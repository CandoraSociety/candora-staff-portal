import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGraphToken } from '../../shared/crtWorkbook.ts';
import { syncAllOpenWorkbooks } from '../../shared/crtSync.ts';

// Re-syncs every OPEN monthly CRT (month-bound). Closed workbooks are skipped.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch { /* scheduled — service role */ }

    const accessToken = await getGraphToken();
    const result = await syncAllOpenWorkbooks(base44, accessToken);
    if (!result.files.length) {
      return Response.json({ status: 'no_workbook', message: 'No CRT workbooks found.' });
    }
    return Response.json({ status: 'success', ...result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}