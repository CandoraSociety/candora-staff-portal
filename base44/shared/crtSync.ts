import {
  DRIVE_ID, CLIENT_DATA_SHEET, CLIENT_DATA_START_ROW, NUM_COLUMNS,
  mapClientToCrtRow, crtMonthEnd, listCrtFiles
} from './crtWorkbook.ts';

// Sync a single workbook's Client Data sheet with the given portal clients,
// month-bound: only clients whose service_start_date is on or before the
// workbook's month-end are included, and date fields dated after month-end are
// blanked. Updates rows in place (does NOT clear) — callers must ensure the
// file already holds the correct client set (creation clears first to avoid
// carrying future-started clients over from the copied source).
export async function syncClientsIntoWorkbook(accessToken, workbook, allClients) {
  const monthEnd = crtMonthEnd(workbook.name);
  // Eligibility: only clients assigned to a program stream (DEA or WD) with a
  // program start date set appear on the CRT. They first appear on the month
  // containing their program start date (service_start_date), then on every
  // subsequent open month. Casual, rejected, and not-yet-assigned clients are
  // excluded. Clients whose program start date falls AFTER this workbook's
  // month are excluded.
  const crtClients = allClients.filter(c => {
    // A COMPASS HSID is NOT required to appear on the CRT — the field stays
    // blank until entered in the portal, then the next sync writes it in.
    // Only a program stream (DEA/WD) + program start date are required.
    if (!((c.service_type === 'pathways' || c.service_type === 'direct_to_employment') &&
          c.service_start_date)) return false;
    if (monthEnd) {
      const sd = new Date(c.service_start_date);
      if (!isNaN(sd.getTime()) && sd > monthEnd) return false;
    }
    return true;
  });

  if (crtClients.length === 0) {
    return { totalPortalClients: 0, updated: 0, added: 0, totalRowsInWorkbook: 0 };
  }

  const rangeRes = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${workbook.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/usedRange(valuesOnly=true)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!rangeRes.ok) {
    throw new Error('Failed to read Client Data sheet: ' + await rangeRes.text());
  }
  const rangeData = await rangeRes.json();
  const allValues = (rangeData.values || []).map(row => {
    const padded = [...row];
    while (padded.length < NUM_COLUMNS) padded.push('');
    return padded.slice(0, NUM_COLUMNS);
  });

  // Match rows by HSID; fall back to normalized name for HSID-blank rows (and
  // for portal clients without an HSID yet). This keeps clients without a
  // COMPASS HSID on the CRT — the HSID field stays blank until entered in the
  // portal, at which point the next sync writes it into the matched row and
  // future syncs match that row by HSID.
  // Token-sort normalization so a row matches regardless of name word order
  // (e.g. a manual CRT row "Therese ... Ngosso" vs the portal's "Ngosso, ...").
  // Only used as the HSID-blank fallback, so collision risk is limited to
  // HSID-less clients.
  const normName = (s) => String(s || '').toLowerCase().replace(/,/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');
  const portalNameKey = (c) => normName(`${c.last_name || ''}, ${c.first_name || ''}`);

  const hsidToRowIndex = {};
  const nameToRowIndex = {};
  for (let i = CLIENT_DATA_START_ROW - 1; i < allValues.length; i++) {
    const row = allValues[i];
    if (!row) continue;
    const h = row[1] ? String(row[1]).trim() : '';
    if (h) hsidToRowIndex[h] = i;
    else if (row[0] && String(row[0]).trim()) nameToRowIndex[normName(row[0])] = i;
  }

  let lastDataRow = CLIENT_DATA_START_ROW - 2;
  for (let i = allValues.length - 1; i >= CLIENT_DATA_START_ROW - 1; i--) {
    if (allValues[i] && allValues[i].some(v => v !== '' && v !== null && v !== undefined)) {
      lastDataRow = i;
      break;
    }
  }

  let updatedCount = 0, addedCount = 0;
  for (const client of crtClients) {
    const hsid = client.compass_hsid ? String(client.compass_hsid).trim() : '';
    const portalRow = mapClientToCrtRow(client, monthEnd);
    let rowIdx = -1;
    if (hsid && hsidToRowIndex[hsid] !== undefined) {
      rowIdx = hsidToRowIndex[hsid];
    } else {
      const nk = portalNameKey(client);
      if (nameToRowIndex[nk] !== undefined) rowIdx = nameToRowIndex[nk];
    }

    if (rowIdx >= 0) {
      for (let col = 0; col < NUM_COLUMNS; col++) {
        // Columns D (3) and F (5) are the stream-specific start dates. A client
        // is only in one stream, so always write both — this clears a stale date
        // left in the opposite column (e.g. a DEA date after a switch to WD).
        const force = (col === 3 || col === 5);
        if (force || (portalRow[col] !== '' && portalRow[col] !== null && portalRow[col] !== undefined)) {
          allValues[rowIdx][col] = portalRow[col];
        }
      }
      // Name-matched row that now has an HSID in the portal: the HSID was just
      // written — index by HSID and drop the name entry so it matches by HSID
      // going forward (and isn't matched again as a name row).
      if (hsid) {
        hsidToRowIndex[hsid] = rowIdx;
        const nk = portalNameKey(client);
        if (nameToRowIndex[nk] !== undefined) delete nameToRowIndex[nk];
      }
      updatedCount++;
    } else {
      const newRowIndex = lastDataRow + 1;
      while (allValues.length <= newRowIndex) {
        allValues.push(new Array(NUM_COLUMNS).fill(''));
      }
      allValues[newRowIndex] = portalRow;
      if (hsid) hsidToRowIndex[hsid] = newRowIndex;
      nameToRowIndex[portalNameKey(client)] = newRowIndex;
      lastDataRow = newRowIndex;
      addedCount++;
    }
  }

  const endRow = lastDataRow + 1;
  const rangeAddress = `A${CLIENT_DATA_START_ROW}:Y${endRow}`;
  const valuesToWrite = allValues.slice(CLIENT_DATA_START_ROW - 1, endRow);
  const updateRes = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${workbook.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/range(address='${rangeAddress}')`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: valuesToWrite })
    }
  );
  if (!updateRes.ok) {
    throw new Error('Failed to write to workbook: ' + await updateRes.text());
  }

  return { totalPortalClients: crtClients.length, updated: updatedCount, added: addedCount, totalRowsInWorkbook: updatedCount + addedCount };
}

// Sync every OPEN monthly CRT. Closed workbooks (marked complete) are frozen
// and skipped. Portal clients are fetched once and reused across files.
// The reporting date ranges (row 8 / Outcomes Report) are never touched here —
// they're set per-file at creation and stay fixed for that month.
export async function syncAllOpenWorkbooks(base44, accessToken) {
  const files = await listCrtFiles(accessToken);
  if (!files.length) return { files: [], totalSynced: 0 };

  let closedNames = new Set();
  try {
    const closed = await base44.asServiceRole.entities.CrtWorkbook.filter({ status: 'closed' });
    closedNames = new Set(closed.map(r => r.file_name));
  } catch { /* default: nothing closed */ }

  const allClients = await base44.asServiceRole.entities.Client.list();
  const results = [];
  for (const f of files) {
    if (closedNames.has(f.name)) { results.push({ file: f.name, status: 'skipped_closed' }); continue; }
    try {
      const r = await syncClientsIntoWorkbook(accessToken, f, allClients);
      results.push({ file: f.name, status: 'synced', ...r });
    } catch (e) { results.push({ file: f.name, status: 'error', error: e.message }); }
  }
  return { files: results, totalSynced: results.filter(r => r.status === 'synced').length };
}