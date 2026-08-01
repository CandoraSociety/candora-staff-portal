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
  // Eligibility: a client first appears on the CRT for the month containing
  // their intake date (falling back to service_start_date when no intake date
  // is recorded), and then on every subsequent open month. Clients whose
  // intake/service start falls AFTER this workbook's month are excluded.
  const crtClients = allClients.filter(c => {
    if (!((c.service_type === 'pathways' || c.service_type === 'direct_to_employment') &&
          c.compass_hsid && String(c.compass_hsid).trim())) return false;
    const gateDateRaw = c.intake_date || c.service_start_date;
    if (!gateDateRaw) return false;
    if (monthEnd) {
      const d = new Date(gateDateRaw);
      if (!isNaN(d.getTime()) && d > monthEnd) return false;
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

  const hsidToRowIndex = {};
  for (let i = CLIENT_DATA_START_ROW - 1; i < allValues.length; i++) {
    const row = allValues[i];
    if (row && row[1] && String(row[1]).trim()) {
      hsidToRowIndex[String(row[1]).trim()] = i;
    }
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
    const hsid = String(client.compass_hsid).trim();
    const portalRow = mapClientToCrtRow(client, monthEnd);
    if (hsidToRowIndex[hsid] !== undefined) {
      const rowIdx = hsidToRowIndex[hsid];
      for (let col = 0; col < NUM_COLUMNS; col++) {
        if (portalRow[col] !== '' && portalRow[col] !== null && portalRow[col] !== undefined) {
          allValues[rowIdx][col] = portalRow[col];
        }
      }
      updatedCount++;
    } else {
      const newRowIndex = lastDataRow + 1;
      while (allValues.length <= newRowIndex) {
        allValues.push(new Array(NUM_COLUMNS).fill(''));
      }
      allValues[newRowIndex] = portalRow;
      hsidToRowIndex[hsid] = newRowIndex;
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