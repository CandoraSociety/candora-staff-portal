import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGraphToken, listCrtFiles, CLIENT_DATA_SHEET } from '../../shared/crtWorkbook.ts';
import { patchCell, applySubmissionRange, monthFromCrtFileName } from '../../shared/crtDatePatch.ts';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Repairs the submission-range date cells of every CRT workbook so each file's
// headers show its OWN month/year (parsed from the filename) rather than a
// month carried over from the file it was copied from.
//
// Payload:
//   {}                       → repair every CRT workbook
//   { file_name: "CRT_..." }  → repair that one workbook
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let payload: any = {};
    try { payload = await req.json(); } catch { /* no body */ }
    const wantedName = String(payload?.file_name || '').trim().toLowerCase();

    const accessToken = await getGraphToken();
    const allFiles = await listCrtFiles(accessToken);
    const files = wantedName
      ? allFiles.filter(f => f.name.toLowerCase() === wantedName)
      : allFiles;
    if (!files.length) return Response.json({ status: 'no_workbook', message: 'No matching CRT workbook found.' });

    const results = [];
    for (const file of files) {
      const month = monthFromCrtFileName(file.name);
      if (!month) {
        results.push({ workbook: file.name, status: 'skipped', message: 'Filename is not CRT_<Month>_<Year>.xlsx' });
        continue;
      }
      const { errors } = await applySubmissionRange(accessToken, file.id, month.year, month.monthIdx);

      // Clear the stray ISO text left in B9 of Client Data from an earlier bad write
      try { await patchCell(accessToken, file.id, CLIENT_DATA_SHEET, 'B9', ''); }
      catch (e) { errors.push('clear B9: ' + String(e.message || e).split('\n')[0]); }

      const monthName = MONTHS[month.monthIdx];
      results.push({
        workbook: file.name,
        status: errors.length ? 'partial' : 'success',
        message: errors.length
          ? `Repaired ${monthName} ${month.year}, but some cells were locked and skipped: ${errors.join('; ')}`
          : `Repaired date ranges in ${file.name} to ${monthName} ${month.year}.`,
        errors: errors.length ? errors : undefined,
      });
    }

    const failed = results.filter(r => r.status === 'partial');
    return Response.json({
      status: failed.length ? 'partial' : 'success',
      message: failed.length
        ? `${results.length - failed.length} of ${results.length} workbooks repaired. ${failed.map(f => f.message).join(' ')}`
        : `Repaired date ranges in ${results.length} CRT workbook${results.length === 1 ? '' : 's'}.`,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}