import {
  DRIVE_ID, CLIENT_DATA_SHEET, CLIENT_DATA_START_ROW, NUM_COLUMNS,
  mapClientToCrtRow, crtMonthEnd
} from './crtWorkbook.ts';

// Month-bound sync: writes portal clients whose service_start_date is on or
// before the workbook's month-end into the given workbook's Client Data sheet.
// Date fields dated after that month are blanked (see mapClientToCrtRow) so each
// monthly CRT is a point-in-time snapshot through that month — a client entered
// after month-end never appears, and a future-dated milestone never leaks in.
export async function syncClientsIntoWorkbook(base44, accessToken, workbook) {
  const monthEnd = crtMonthEnd(workbook.name);

  const allClients = await base44.asServiceRole.entities.Client.list();
  const crtClients = allClients.filter(c => {
    if (!((c.service_type === 'pathways' || c.service_type === 'direct_to_employment') &&
          c.compass_hsid && String(c.compass_hsid).trim() && c.service_start_date)) return false;
    if (monthEnd) {
      const sd = new Date(c.service_start_date);
      if (!isNaN(sd.getTime()) && sd > monthEnd) return false;
    }
    return true;
  });

  if (crtClients.length === 0) {
    return { totalPortalClients: 0, updated: 0, added: 0, totalRowsInWorkbook: 0,
      message: 'No eligible portal clients found (need WD/DEA service type + HSID + service start date on or before this month).' };
  }

  // Read existing Client Data values from the workbook
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

  // Build HSID → row index map (client data starts at CLIENT_DATA_START_ROW, HSID in col B = index 1)
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