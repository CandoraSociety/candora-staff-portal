import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { publicationFromSource } from '../../shared/websitePublishing.ts';

// Re-reads the approved source fields of every publication from its Event or
// Program record, so a change made in Candora 360 reaches the public website.
// Website-written copy (summary, body, image, registration) is left alone; the
// public title only follows the source name when staff had not renamed it.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const publications = await base44.asServiceRole.entities.WebsitePublication.list({ limit: 500 });
    const items = publications.items || [];
    if (items.length === 0) return Response.json({ updated: 0, checked: 0 });

    const eventIds = items.filter((p) => p.source_type === 'event' && p.source_id).map((p) => p.source_id);
    const programIds = items.filter((p) => p.source_type === 'program' && p.source_id).map((p) => p.source_id);

    const [eventPage, programPage] = await Promise.all([
      eventIds.length
        ? base44.asServiceRole.entities.Event.filter({ id: { $in: eventIds } }, { limit: 500 })
        : { items: [] },
      programIds.length
        ? base44.asServiceRole.entities.Program.filter({ id: { $in: programIds } }, { limit: 500 })
        : { items: [] },
    ]);

    const byId = new Map();
    (eventPage.items || []).forEach((e) => byId.set(e.id, { type: 'event', record: e }));
    (programPage.items || []).forEach((p) => byId.set(p.id, { type: 'program', record: p }));

    const now = new Date().toISOString();
    const updates = [];

    for (const pub of items) {
      const hit = byId.get(pub.source_id);
      if (!hit) continue;
      const fresh = publicationFromSource(hit.type, hit.record);
      if (!fresh) continue;

      const next = {
        source_name: fresh.source_name,
        event_start: fresh.event_start,
        event_end: fresh.event_end,
        location: fresh.location,
        last_synced_at: now,
      };
      // Keep the public page in step with a rename unless staff wrote their own title.
      if (!pub.title || pub.title === pub.source_name) {
        next.title = fresh.title;
      }

      const changed = Object.keys(next).some((key) => (pub[key] || '') !== (next[key] || ''));
      if (changed) updates.push({ id: pub.id, ...next });
    }

    if (updates.length > 0) {
      await base44.asServiceRole.entities.WebsitePublication.bulkUpdate(updates);
    }

    return Response.json({ updated: updates.length, checked: items.length });
  } catch (error) {
    console.log('refreshWebsitePublications failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}