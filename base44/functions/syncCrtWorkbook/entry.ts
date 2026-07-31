import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  DRIVE_ID, CLIENT_DATA_SHEET, CLIENT_DATA_START_ROW, NUM_COLUMNS,
  getGraphToken, getActiveCrtWorkbook, mapClientToCrtRow
} from '../../shared/crtWorkbook.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const accessToken = await getGraphToken();
    const activeWorkbook = await getActiveCrtWorkbook(accessToken);
    if (!activeWorkbook) {
      return Response.json({ error: 'No active CRT workbook found. Create one from the master template first.' }, { status: 404 });
    }
    const workbookId = activeWorkbook.id;

    // 1. Get all portal clients that belong in the CRT (WD and DEA with HSID + service start date)
    const allClients = await base44.asServiceRole.entities.Client.list();
    const crtClients = allClients.filter(c =>
      (c.service_type === 'pathways' || c.service_type === 'direct_to_employment') &&
      c.compass_hsid &&
      c.compass_hsid.trim() &&
      c.service_start_date
    );

    if (crtClients.length === 0) {
      return Response.json({
        status: 'success',
        activeWorkbook: activeWorkbook.name,
        totalPortalClients: 0,
        updated: 0,
        added: 0,
        message: 'No eligible portal clients found (need WD/DEA service type + HSID + service start date).'
      });
    }

    // 2. Read existing Client Data values from the workbook
    const rangeRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${workbookId}/workbook/worksheets('${CLIENT_DATA_SHEET}')/usedRange(valuesOnly=true)`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!rangeRes.ok) {
      const errText = await rangeRes.text();
      return Response.json({ error: 'Failed to read Client Data sheet', details: errText }, { status: 500 });
    }
    const rangeData = await rangeRes.json();
    const allValues = (rangeData.values || []).map(row => {
      // Ensure each row has exactly NUM_COLUMNS elements
      const padded = [...row];
      while (padded.length < NUM_COLUMNS) padded.push('');
      return padded.slice(0, NUM_COLUMNS);
    });

    // 3. Build HSID → row index map (0-based index in allValues, row 15 = index 14)
    const hsidToRowIndex = {};
    for (let i = CLIENT_DATA_START_ROW - 1; i < allValues.length; i++) {
      const row = allValues[i];
      if (row && row[1] && String(row[1]).trim()) {
        hsidToRowIndex[String(row[1]).trim()] = i;
      }
    }

    // 4. Find the last row with data (to know where to append new rows)
    let lastDataRow = CLIENT_DATA_START_ROW - 2; // row 14 (0-based: 13), meaning no data yet
    for (let i = allValues.length - 1; i >= CLIENT_DATA_START_ROW - 1; i--) {
      if (allValues[i] && allValues[i].some(v => v !== '' && v !== null && v !== undefined)) {
        lastDataRow = i;
        break;
      }
    }

    // 5. Process each portal client — merge into allValues
    let updatedCount = 0;
    let addedCount = 0;
    for (const client of crtClients) {
      const hsid = String(client.compass_hsid).trim();
      const portalRow = mapClientToCrtRow(client);

      if (hsidToRowIndex[hsid] !== undefined) {
        // Update existing row — only overwrite cells where portal has a value
        const rowIdx = hsidToRowIndex[hsid];
        for (let col = 0; col < NUM_COLUMNS; col++) {
          if (portalRow[col] !== '' && portalRow[col] !== null && portalRow[col] !== undefined) {
            allValues[rowIdx][col] = portalRow[col];
          }
        }
        updatedCount++;
      } else {
        // Append new row after last data row
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

    // 6. Write the updated client data range back in one PATCH
    // Range: A{CLIENT_DATA_START_ROW}:Y{lastDataRow + 1} (1-based)
    const endRow = lastDataRow + 1; // Convert 0-based lastDataRow to 1-based end row
    const rangeAddress = `A${CLIENT_DATA_START_ROW}:Y${endRow}`;
    const valuesToWrite = allValues.slice(CLIENT_DATA_START_ROW - 1, endRow);

    const updateRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${workbookId}/workbook/worksheets('${CLIENT_DATA_SHEET}')/range(address='${rangeAddress}')`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: valuesToWrite })
      }
    );

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      return Response.json({ error: 'Failed to write to workbook', details: errText, rangeAddress }, { status: 500 });
    }

    return Response.json({
      status: 'success',
      activeWorkbook: activeWorkbook.name,
      totalPortalClients: crtClients.length,
      updated: updatedCount,
      added: addedCount,
      totalRowsInWorkbook: updatedCount + addedCount,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}