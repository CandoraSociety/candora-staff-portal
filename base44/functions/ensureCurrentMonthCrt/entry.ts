import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  DRIVE_ID, CLIENT_DATA_SHEET, CLIENT_DATA_START_ROW, NUM_COLUMNS,
  getGraphToken, getPathwaysFolder, getActiveCrtWorkbook
} from '../../shared/crtWorkbook.ts';
import { excelSerial, patchWithRetry, patchProtectedSheet, SUBMISSION_RANGE_CELLS } from '../../shared/crtDatePatch.ts';
import { syncAllOpenWorkbooks } from '../../shared/crtSync.ts';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function currentMtMonth() {
  const now = new Date();
  const mt = new Date(now.toLocaleString('en-US', { timeZone: 'America/Edmonton' }));
  return { year: mt.getFullYear(), monthIdx: mt.getMonth() };
}

// Creates a monthly CRT workbook for the given month/year (defaults to the
// current Candora calendar month) if it doesn't already exist — by copying the
// most recent monthly file, CLEARING its client rows (so future-started clients
// from the source don't leak in), and setting that month's reporting date range
// (which never syncs afterwards). Then syncs ALL open workbooks month-bound so
// the new file is populated and other open months are refreshed. Idempotent.
//
// Payload: { month?: number (1-12), year?: number }
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch { /* scheduled — service role */ }

    let body: any = {};
    try { body = await req.json(); } catch { /* no body (scheduled) */ }
    let monthIdx: number, year: number;
    if (body && body.month && body.year) {
      monthIdx = Number(body.month) - 1;
      year = Number(body.year);
      if (monthIdx < 0 || monthIdx > 11) return Response.json({ error: 'month must be 1-12' }, { status: 400 });
    } else {
      const c = currentMtMonth();
      monthIdx = c.monthIdx;
      year = c.year;
    }
    const monthName = MONTHS[monthIdx];
    const newFileName = `CRT_${monthName}_${year}.xlsx`;

    const accessToken = await getGraphToken();
    const folder = await getPathwaysFolder(accessToken);

    // 1. Does this month's file already exist?
    const listRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${folder.id}/children`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const children = await listRes.json();
    const existing = (children.value || []).find(f => f.name === newFileName);
    let created = false;
    let newFile = existing || null;

    if (!existing) {
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

      // 4. Clear client data rows so the month-bound sync repopulates cleanly
      //    (prevents future-started clients from the source leaking into this month).
      try {
        const usedRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${newFile.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/usedRange(valuesOnly=true)`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (usedRes.ok) {
          const usedData = await usedRes.json();
          const values = usedData.values || [];
          let lastRowIdx = -1;
          for (let i = values.length - 1; i >= CLIENT_DATA_START_ROW - 1; i--) {
            if (values[i] && values[i].some(v => v !== '' && v !== null && v !== undefined)) { lastRowIdx = i; break; }
          }
          if (lastRowIdx >= CLIENT_DATA_START_ROW - 1) {
            const blankRows = [];
            for (let i = CLIENT_DATA_START_ROW - 1; i <= lastRowIdx; i++) blankRows.push(new Array(NUM_COLUMNS).fill(''));
            const rangeAddress = `A${CLIENT_DATA_START_ROW}:Y${lastRowIdx + 1}`;
            await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${newFile.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/range(address='${rangeAddress}')`, {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ values: blankRows })
            });
          }
        }
      } catch (e) { /* non-fatal — sync will still overwrite */ }

      // 5. Set this month's reporting date range (never touched by sync afterwards)
      const firstDay = new Date(Date.UTC(year, monthIdx, 1));
      const lastDay = new Date(Date.UTC(year, monthIdx + 1, 0));
      const startSerial = excelSerial(firstDay);
      const endSerial = excelSerial(lastDay);
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
        } catch (e) { /* date range best-effort */ }
      }

      // 5b. Unhide the 26/27 fiscal-year month columns (Q:AB = Apr 2026 – Mar 2027)
      //     on the Deliverables sheet. The template ships these hidden (width 0);
      //     new monthly workbooks need them visible so staff can enter 26/27 deliverables.
      try {
        await fetch(
          `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${newFile.id}/workbook/worksheets('Deliverables')/range(address='Q:AB')/format`,
          {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ columnWidth: 60.75 })
          }
        );
      } catch (e) { /* unhide best-effort */ }

      created = true;
    }

    // 6. Sync ALL open workbooks (month-bound) — populates the new file + refreshes others
    const sync = await syncAllOpenWorkbooks(base44, accessToken);

    return Response.json({
      status: 'success',
      message: created
        ? `Created ${newFileName}. Synced ${sync.totalSynced} open workbook(s).`
        : `${newFileName} already exists. Synced ${sync.totalSynced} open workbook(s).`,
      created,
      workbook: created ? { id: newFile.id, name: newFile.name, webUrl: newFile.webUrl } : undefined,
      sync,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}