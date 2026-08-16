import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { DRIVE_ID, getGraphToken, listCrtFiles } from '../../shared/crtWorkbook.ts';
import { cellToMonthKey } from '../../shared/invoiceTracker.ts';
import { patchProtectedSheet } from '../../shared/crtDatePatch.ts';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DELIVERABLES_SHEET = 'Deliverables';
const WORKSHOPS_DELIVERED_ROW = 14;   // "Workshops - Delivered"
const WORKSHOPS_ATTENDED_ROW = 15;   // "Workshops - # of Clients Attended"

// 0-based column index → Excel column letter(s)
function colLetter(idx0: number): string {
  let n = idx0 + 1, s = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

// When a workshop session is marked complete, record it on the Deliverables
// sheet of that month's CRT workbook: +1 to "Workshops - Delivered" (row 14)
// and +attendedCount to "Workshops - # of Clients Attended" (row 15), in the
// column matching the session's month/year.
//
// Payload: { sessionDate (YYYY-MM-DD), attendedCount (number) }
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch { /* allow service role */ }

    let body: any = {};
    try { body = await req.json(); } catch { /* no body */ }
    const { sessionDate, attendedCount, deliveredDelta, attendedDelta } = body || {};
    if (!sessionDate) return Response.json({ error: 'sessionDate is required' }, { status: 400 });
    // Deltas default to +1 delivered / +attendedCount attended (a completed
    // session). Pass negative deltas to undo a recorded session (e.g. deleting a
    // test workshop). Counts are clamped at 0 so a decrement can't go negative.
    const dDelivered = deliveredDelta != null ? Number(deliveredDelta) : 1;
    const dAttended = attendedDelta != null ? Number(attendedDelta) : (Number(attendedCount) || 0);

    const iso = String(sessionDate).slice(0, 10);
    const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
    if (isNaN(d.getTime())) return Response.json({ error: 'invalid sessionDate' }, { status: 400 });
    const year = d.getFullYear();
    const month0 = d.getMonth();
    const fileName = `CRT_${MONTHS[month0]}_${year}.xlsx`;

    const accessToken = await getGraphToken();
    const files = await listCrtFiles(accessToken);
    const file = (files || []).find(f => f.name === fileName);
    if (!file) {
      return Response.json({ status: 'no_workbook', message: `${fileName} not found — deliverables not updated.` });
    }

    // Read the Deliverables sheet used range.
    const rangeRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${file.id}/workbook/worksheets('${DELIVERABLES_SHEET}')/usedRange(valuesOnly=true)`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!rangeRes.ok) return Response.json({ status: 'read_failed', error: await rangeRes.text() });
    const rangeData = await rangeRes.json();
    const values: any[][] = rangeData.values || [];

    // Locate the column whose header cell matches the session's month/year.
    // The Deliverables sheet has one column per calendar month; scan the header
    // rows (first ~12) for a date cell matching the target.
    let colIdx = -1;
    for (let r = 0; r < Math.min(values.length, 12) && colIdx < 0; r++) {
      const row = values[r];
      if (!row) continue;
      for (let c = 0; c < row.length; c++) {
        const key = cellToMonthKey(row[c]);
        if (key && key.year === year && key.month === month0) { colIdx = c; break; }
      }
    }
    if (colIdx < 0) {
      return Response.json({ status: 'column_not_found', message: `No Deliverables column for ${MONTHS[month0]} ${year}.`, workbook: file.name });
    }

    const colL = colLetter(colIdx);
    const readNum = (row1: number): number => {
      const row = values[row1 - 1];
      if (!row) return 0;
      const v = row[colIdx];
      if (v == null || v === '') return 0;
      const n = Number(v);
      return isNaN(n) ? 0 : n;
    };

    const newDelivered = Math.max(0, readNum(WORKSHOPS_DELIVERED_ROW) + dDelivered);
    const newAttended = Math.max(0, readNum(WORKSHOPS_ATTENDED_ROW) + dAttended);

    await patchProtectedSheet(accessToken, file.id, DELIVERABLES_SHEET, [
      { cell: `${colL}${WORKSHOPS_DELIVERED_ROW}`, value: newDelivered },
      { cell: `${colL}${WORKSHOPS_ATTENDED_ROW}`, value: newAttended },
    ]);

    return Response.json({
      status: 'success',
      workbook: file.name,
      column: colL,
      workshopsDelivered: newDelivered,
      clientsAttended: newAttended,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}