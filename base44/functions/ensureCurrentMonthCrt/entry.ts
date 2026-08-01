import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  DRIVE_ID, getGraphToken, getPathwaysFolder, getActiveCrtWorkbook
} from '../../shared/crtWorkbook.ts';
import { excelSerial, patchWithRetry, patchProtectedSheet, SUBMISSION_RANGE_CELLS } from '../../shared/crtDatePatch.ts';
import { syncClientsIntoWorkbook } from '../../shared/crtSync.ts';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Current calendar month in the Candora (America/Edmonton) timezone.
function currentMtMonth() {
  const now = new Date();
  const mt = new Date(now.toLocaleString('en-US', { timeZone: 'America/Edmonton' }));
  return { year: mt.getFullYear(), monthIdx: mt.getMonth() };
}

// Creates the current month's CRT workbook (CRT_<Month>_<Year>.xlsx) if it
// doesn't already exist, by copying the most recent monthly file (to preserve
// structure/formulas), setting the submission range to the new month, then
// running a month-bound sync so the file is a point-in-time snapshot through
// this month. Idempotent — returns already_exists if the file is present.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    // Allow manual clicks (any user) and scheduled (no-user) runs alike.
    try { await base44.auth.me(); } catch { /* scheduled — service role */ }

    const accessToken = await getGraphToken();
    const { year, monthIdx } = currentMtMonth();
    const monthName = MONTHS[monthIdx];
    const newFileName = `CRT_${monthName}_${year}.xlsx`;

    const folder = await getPathwaysFolder(accessToken);

    // 1. Bail if this month's file already exists
    const listRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${folder.id}/children`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const children = await listRes.json();
    const existing = (children.value || []).find(f => f.name === newFileName);
    if (existing) {
      return Response.json({
        status: 'already_exists',
        message: `${newFileName} already exists.`,
        workbook: { id: existing.id, name: existing.name, webUrl: existing.webUrl }
      });
    }

    // 2. Copy the most recent monthly file for structure/formulas
    const source = await getActiveCrtWorkbook(accessToken);
    if (!source) {
      return Response.json({ error: 'No existing CRT workbook to copy structure from. Seed the first month manually first.' }, { status: 404 });
    }

    const copyRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${source.id}/copy`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentReference: { driveId: DRIVE_ID, id: folder.id }, name: newFileName })
    });
    if (!copyRes.ok && copyRes.status !== 202) {
      return Response.json({ error: 'Copy failed', details: await copyRes.text() }, { status: 500 });
    }

    // 3. Wait for the copy to land
    let newFile = null;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const checkRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${folder.id}/children`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (checkRes.ok) {
        const data = await checkRes.json();
        newFile = (data.value || []).find(f => f.name === newFileName);
        if (newFile) break;
      }
    }
    if (!newFile) {
      return Response.json({ status: 'copy_pending', message: `Copy initiated but ${newFileName} not yet visible. Please refresh in a moment.` });
    }

    // 4. Set the submission range to the new month (value-only for the protected Outcomes sheet)
    const firstDay = new Date(Date.UTC(year, monthIdx, 1));
    const lastDay = new Date(Date.UTC(year, monthIdx + 1, 0));
    const startSerial = excelSerial(firstDay);
    const endSerial = excelSerial(lastDay);
    const rangeErrors = [];
    for (const r of SUBMISSION_RANGE_CELLS) {
      try {
        if (r.protected) {
          await patchProtectedSheet(accessToken, newFile.id, r.sheet, [
            { cell: r.startCell, value: startSerial },
            { cell: r.endCell, value: endSerial },
          ]);
        } else {
          await patchWithRetry(accessToken, newFile.id, r.sheet, r.startCell, startSerial, 'mm/dd/yy');
          await patchWithRetry(accessToken, newFile.id, r.sheet, r.endCell, endSerial, 'mm/dd/yy');
        }
      } catch (e) { rangeErrors.push(e.message); }
    }

    // 5. Populate with this month's snapshot (month-bound sync)
    let syncResult = null;
    try {
      syncResult = await syncClientsIntoWorkbook(base44, accessToken, newFile);
    } catch (e) { rangeErrors.push('sync: ' + e.message); }

    return Response.json({
      status: 'success',
      message: `Created ${newFileName} for this month and synced ${syncResult?.totalRowsInWorkbook ?? 0} client(s).`,
      workbook: { id: newFile.id, name: newFile.name, webUrl: newFile.webUrl },
      sync: syncResult,
      rangeErrors: rangeErrors.length ? rangeErrors : undefined,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}