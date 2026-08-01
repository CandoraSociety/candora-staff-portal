import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGraphToken, getActiveCrtWorkbook } from '../../shared/crtWorkbook.ts';
import { syncClientsIntoWorkbook } from '../../shared/crtSync.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    // Tolerate scheduled (no-user) invocation so the auto-create automation
    // can populate a freshly created monthly file. Manual clicks still pass a user.
    try { await base44.auth.me(); } catch { /* scheduled — service role */ }

    const accessToken = await getGraphToken();
    const activeWorkbook = await getActiveCrtWorkbook(accessToken);
    if (!activeWorkbook) {
      return Response.json({ error: 'No active CRT workbook found. Create one from the master template first.' }, { status: 404 });
    }

    const result = await syncClientsIntoWorkbook(base44, accessToken, activeWorkbook);
    return Response.json({
      status: 'success',
      activeWorkbook: activeWorkbook.name,
      totalPortalClients: result.totalPortalClients,
      updated: result.updated,
      added: result.added,
      totalRowsInWorkbook: result.totalRowsInWorkbook,
      message: result.message,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}