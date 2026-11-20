import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { syncRecentMail } from '../../shared/emailMailboxSync.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => e.status === 401 ? null : Promise.reject(e));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    return Response.json(await syncRecentMail(base44, user));
  } catch (error) {
    console.error('emailAssistantSyncOutlook failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}