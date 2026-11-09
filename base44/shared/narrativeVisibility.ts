import { DRIVE_ID } from './crtWorkbook.ts';

// Values can be present while an old table filter or hidden template row hides
// them in Excel. Only touch the Narrative Report sheet and its populated rows.
export async function revealAndVerifyNarrativeRows(accessToken, workbook, expectedRows) {
  if (!expectedRows.length) return { verifiedCount: 0, visibleCount: 0 };
  const sheetUrl = `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${workbook.id}/workbook/worksheets('Narrative Report')`;
  const rangeUrl = `${sheetUrl}/range(address='A10:D${9 + expectedRows.length}')`;
  const request = async (url, method = 'GET', body) => {
    const response = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`Narrative visibility update failed (${response.status}): ${await response.text()}`);
    if (method !== 'GET') await response.arrayBuffer();
    return response;
  };

  // Clearing this sheet's table filters also clears stale date/slicer criteria
  // inherited from the template. Never clear filters on other CRT sheets.
  const tables = await (await request(`${sheetUrl}/tables`)).json();
  const tableList = tables.value || [];
  for (let i = 0; i < tableList.length; i += 6) {
    await Promise.all(tableList.slice(i, i + 6).map(table =>
      request(`${sheetUrl}/tables('${encodeURIComponent(table.id)}')/clearFilters`, 'POST')
    ));
  }
  await request(rangeUrl, 'PATCH', { rowHidden: false });
  await request(`${rangeUrl}/format`, 'PATCH', { wrapText: true });
  await request(`${rangeUrl}/format/autofitRows`, 'POST');

  const actual = await (await request(`${rangeUrl}?$select=address,values,rowHidden`)).json();
  const matches = expectedRows.every((row, i) => row.every((value, col) =>
    String(actual.values?.[i]?.[col] ?? '') === String(value ?? '')
  ));
  if (!matches) throw new Error('Narrative sync could not verify every saved summary.');
  if (actual.rowHidden !== false) throw new Error('Narrative summaries were saved, but some worksheet rows are still hidden.');
  return { verifiedCount: expectedRows.length, visibleCount: expectedRows.length };
}