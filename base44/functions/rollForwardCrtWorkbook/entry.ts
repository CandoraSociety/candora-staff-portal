import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  DRIVE_ID, CLIENT_DATA_SHEET,
  getGraphToken, getActiveCrtWorkbook, getPathwaysFolder, formatDateForCrt
} from '../../shared/crtWorkbook.ts';

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
    //    Values are written as ISO date strings so Excel stores them as real dates
    //    (required for the conditional highlighting that compares client dates to this range).
    const firstDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
    const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
    const startDateISO = firstDay.toISOString();
    const endDateISO = lastDay.toISOString();
    const startDateStr = formatDateForCrt(firstDay.toISOString());
    const endDateStr = formatDateForCrt(lastDay.toISOString());

    // Sheets + cells that hold the submission start/end date range.
    // Extend this list with any other sheets the workbook uses for range-based highlighting.
    const SUBMISSION_RANGE_CELLS = [
      { sheet: CLIENT_DATA_SHEET, startCell: 'B9', endCell: 'E9' },
      { sheet: 'Invoice Tracker', startCell: 'B8', endCell: 'B9' },
      { sheet: 'Outcomes Report', startCell: 'B9', endCell: 'B10' },
    ];

    const patchCell = async (sheet, cell, value) => {
      const url = `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${newFile.id}/workbook/worksheets('${sheet}')/range(address='${cell}')`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [[value]] })
      });
      if (!res.ok) {
        throw new Error(`${sheet}!${cell}: ${res.status} ${await res.text()}`);
      }
    };

    // The workbook may not be ready for edits immediately after a copy — retry briefly.
    const patchWithRetry = async (sheet, cell, value) => {
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          await patchCell(sheet, cell, value);
          return true;
        } catch (e) {
          if (attempt === 3) throw e;
          await new Promise(r => setTimeout(r, 3000));
        }
      }
    };

    const rangeErrors = [];
    for (const r of SUBMISSION_RANGE_CELLS) {
      try {
        await patchWithRetry(r.sheet, r.startCell, startDateISO);
        await patchWithRetry(r.sheet, r.endCell, endDateISO);
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