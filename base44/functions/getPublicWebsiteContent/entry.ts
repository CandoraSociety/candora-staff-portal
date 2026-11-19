import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { publicPublication, publicNewsPost, publicSection, publicSite } from '../../shared/websitePublishing.ts';

// Public feed for the separate Candora website app. Anyone can read it, so it
// only ever returns published website content, shaped by the shared allowlist.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const [settingsPage, sectionPage, newsPage, publicationPage] = await Promise.all([
      base44.asServiceRole.entities.WebsiteSettings.list({ limit: 1 }),
      base44.asServiceRole.entities.WebsiteSection.list({ sort: 'display_order', limit: 300 }),
      base44.asServiceRole.entities.WebsiteNewsPost.filter(
        { status: 'published' },
        { sort: '-publish_date', limit: 50 }
      ),
      base44.asServiceRole.entities.WebsitePublication.filter(
        { status: 'published', advertise: true },
        { sort: 'event_start', limit: 100 }
      ),
    ]);

    const settings = (settingsPage.items || [])[0] || null;
    const sections = (sectionPage.items || []).filter((s) => s.is_visible !== false);
    const news = (newsPage.items || []).filter((p) => p.advertise !== false);
    const publications = publicationPage.items || [];

    const events = publications.map(publicPublication);

    return Response.json({
      site: publicSite(settings),
      sections: sections.map(publicSection),
      news: news.map(publicNewsPost),
      events,
      counts: {
        events: events.length,
        news: news.length,
        sections: sections.length,
      },
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.log('getPublicWebsiteContent failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}