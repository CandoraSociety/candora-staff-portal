import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  DRIVE_ID,
  getGraphToken, getActiveCrtWorkbook, getPathwaysFolder, formatDateForCrt
} from '../../shared/crtWorkbook.ts';
import { excelSerial, patchWithRetry, SUBMISSION_RANGE_CELLS } from '../../shared/crtDatePatch.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const accessToken = await getGraphToken();
    const activeWorkbook = await getActiveCrtWorkbook(accessToken);
    if (!activeWorkbook) {
      return Response.json({ error: 'No active CRT workbook found to copy from.' }, { status: 404 });
    }

    // 1. Determine next month — derived from the ACTIVE workbook's filename, not the calendar,
    //    so it always advances one billing month past the current workbook (even if you're behind).
    const nameMatch = activeWorkbook.name.match(/CRT_([A-Za-z]+)_(\d{4})/i);
    let nextMonth;
    if (nameMatch) {
      const baseMonthIdx = new Date(`${nameMatch[1]} 1, ${nameMatch[2]}`).getMonth();
      const baseYear = parseInt(nameMatch[2], 10);
      nextMonth = new Date(baseYear, baseMonthIdx + 1, 1);
    } else {
      // Fallback: calendar next month (active workbook name didn't parse)
      const now = new Date();
      nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }
    const monthName = nextMonth.toLocaleString('en-US', { month: 'long' });
    const year = nextMonth.getFullYear();
    const newFileName = `CRT_${monthName}_${year}.xlsx`;

    // Check if the target file already exists
    const folder = await getPathwaysFolder(accessToken);
    const existingFilesRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${folder.id}/children`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const existingFiles = await existingFilesRes.json();
    const alreadyExists = (existingFiles.value || []).find(f => f.name === newFileName);
    if (alreadyExists) {
      return Response.json({
        status: 'already_exists',
        message: `${newFileName} already exists in ${folder.name}`,
        newWorkbook: { id: alreadyExists.id, name: alreadyExists.name, webUrl: alreadyExists.webUrl }
      });
    }

    // 2. Copy the file
    const copyRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${activeWorkbook.id}/copy`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentReference: { driveId: DRIVE_ID, id: folder.id },
          name: newFileName
        })
      }
    );

    if (!copyRes.ok && copyRes.status !== 202) {
      const errText = await copyRes.text();
      return Response.json({ error: 'Failed to copy workbook', details: errText }, { status: 500 });
    }

    // 3. Wait for the copy to complete by polling for the new file
    let newFile = null;
    for (let attempt = 0; attempt < 30; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const checkRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${folder.id}/children`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        newFile = (checkData.value || []).find(f => f.name === newFileName);
        if (newFile) break;
      }
    }

    if (!newFile) {
      return Response.json({
        status: 'copy_pending',
        message: `Copy initiated but ${newFileName} not yet visible after 60s. Please refresh in a moment.`
      });
    }

    // 4. Update the submission range to the new month.
    //    Excel stores dates as serial numbers (days since 1899-12-30). Writing ISO
    //    strings makes Excel store them as TEXT, which breaks the conditional
    //    highlighting that compares client dates to this range — so we write serials
    //    and the cells keep their existing date number format from the copied template.
    const firstDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
    const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
    const startDateStr = formatDateForCrt(firstDay.toISOString());
    const endDateStr = formatDateForCrt(lastDay.toISOString());
    const startDateSerial = excelSerial(firstDay);
    const endDateSerial = excelSerial(lastDay);

    const rangeErrors = [];
    for (const r of SUBMISSION_RANGE_CELLS) {
      try {
        await patchWithRetry(accessToken, newFile.id, r.sheet, r.startCell, startDateSerial, 'mm/dd/yy');
        await patchWithRetry(accessToken, newFile.id, r.sheet, r.endCell, endDateSerial, 'mm/dd/yy');
      } catch (e) {
        rangeErrors.push(e.message);
      }
    }

    // 5. Get embed URL for the new file
    let embedUrl = null;
    try {
      const previewRes = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${newFile.id}/preview`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: '{}'
        }
      );
      if (previewRes.ok) {
        const previewData = await previewRes.json();
        embedUrl = previewData.getUrl || null;
      }
    } catch (e) { /* optional */ }

    return Response.json({
      status: 'success',
      message: rangeErrors.length
        ? `Rolled forward to ${newFileName}, but ${rangeErrors.length} submission-range cell(s) could not be updated: ${rangeErrors.join('; ')}`
        : `Rolled forward to ${newFileName}. All client data carried over, submission range updated to ${startDateStr} – ${endDateStr}.`,
      newWorkbook: {
        id: newFile.id,
        name: newFile.name,
        webUrl: newFile.webUrl,
        embedUrl,
      },
      submissionRange: { start: startDateStr, end: endDateStr },
      rangeErrors: rangeErrors.length ? rangeErrors : undefined,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}