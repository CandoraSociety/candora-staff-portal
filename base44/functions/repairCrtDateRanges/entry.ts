import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGraphToken, getActiveCrtWorkbook, CLIENT_DATA_SHEET } from '../../shared/crtWorkbook.ts';
import { excelSerial, patchCell, SUBMISSION_RANGE_CELLS } from '../../shared/crtDatePatch.ts';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Repairs the active workbook's submission-range date cells so they match the
// month/year encoded in its filename. Fixes files created by earlier roll-forward
// attempts that wrote to the wrong cells or stored dates as text.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const accessToken = await getGraphToken();
    const active = await getActiveCrtWorkbook(accessToken);
    if (!active) return Response.json({ status: 'no_workbook' }, { status: 200 });

    // Parse the month/year from the filename "CRT_<Month>_<Year>.xlsx"
    const m = active.name.match(/CRT_(\w+)_(\d{4})/i);
    if (!m) return Response.json({ error: 'Could not parse month/year from filename' }, { status: 400 });
    const monthName = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
    const monthIdx = MONTHS.indexOf(monthName);
    const year = parseInt(m[2], 10);
    if (monthIdx < 0) return Response.json({ error: `Unknown month "${m[1]}" in filename` }, { status: 400 });

    const startSerial = excelSerial(new Date(Date.UTC(year, monthIdx, 1)));
    const endSerial = excelSerial(new Date(Date.UTC(year, monthIdx + 1, 0)));

    const errors = [];
    for (const r of SUBMISSION_RANGE_CELLS) {
      try {
        await patchCell(accessToken, active.id, r.sheet, r.startCell, startSerial, 'mm/dd/yy');
        await patchCell(accessToken, active.id, r.sheet, r.endCell, endSerial, 'mm/dd/yy');
      } catch (e) { errors.push(`${r.sheet} ${r.startCell}/${r.endCell}: ${e.message.split('\n')[0]}`); }
    }

    // Clear the stray ISO text left in B9 of Client Data from an earlier bad write
    try {
      await patchCell(accessToken, active.id, CLIENT_DATA_SHEET, 'B9', '');
    } catch (e) { errors.push('clear B9: ' + e.message.split('\n')[0]); }

    const repaired = errors.length === 0;
    return Response.json({
      status: repaired ? 'success' : 'partial',
      message: repaired
        ? `Repaired date ranges in ${active.name} to ${monthName} ${year}.`
        : `Repaired ${monthName} ${year} in ${active.name}, but some cells were locked and skipped: ${errors.join('; ')}`,
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}