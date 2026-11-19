import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { publicationFromSource } from '../../shared/websitePublishing.ts';

// Gives the publishing wizard the approved public fields of one Event or
// Program, plus any website page already set up for it. Staff only.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const sourceType = String(body.source_type || '').trim();
    const sourceId = String(body.source_id || '').trim();

    if (!['event', 'program'].includes(sourceType)) {
      return Response.json({ error: 'source_type must be event or program' }, { status: 400 });
    }
    if (!sourceId) {
      return Response.json({ error: 'source_id is required' }, { status: 400 });
    }

    const entity = sourceType === 'event' ? base44.entities.Event : base44.entities.Program;
    const record = await entity.get(sourceId).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!record) return Response.json({ error: 'Source record not found' }, { status: 404 });

    const existingPage = await base44.entities.WebsitePublication.filter({ source_id: sourceId }, { limit: 1 });
    const existing = (existingPage.items || [])[0] || null;

    return Response.json({
      source: publicationFromSource(sourceType, record),
      existing,
    });
  } catch (error) {
    console.log('getWebsitePublishSource failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}