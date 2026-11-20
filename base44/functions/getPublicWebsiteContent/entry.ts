import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  publicPublication,
  publicNewsPost,
  publicPage,
  publicSection,
  publicSite,
  scheduledForLater,
  orderMenuPages,
} from '../../shared/websitePublishing.ts';

// Public feed for the separate Candora website app. Anyone can read it, so it
// only ever returns published website content, shaped by the shared allowlist.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const [settingsPage, sectionPage, pagePage, newsPage, publicationPage, orgPage] = await Promise.all([
      base44.asServiceRole.entities.WebsiteSettings.list({ limit: 1 }),
      base44.asServiceRole.entities.WebsiteSection.list({ sort: 'display_order', limit: 300 }),
      base44.asServiceRole.entities.WebsitePage.list({ sort: 'display_order', limit: 100 }),
      base44.asServiceRole.entities.WebsiteNewsPost.filter(
        { status: 'published' },
        { sort: '-publish_date', limit: 50 }
      ),
      base44.asServiceRole.entities.WebsitePublication.filter(
        { status: 'published', advertise: true },
        { sort: 'event_start', limit: 100 }
      ),
      base44.asServiceRole.entities.OrgSettings.list({ limit: 1 }),
    ]);

    const settings = (settingsPage.items || [])[0] || null;

    // The website's logo defaults to the primary logo chosen in Brand Assets,
    // so the site never drifts from the organization's own brand mark.
    const org = (orgPage.items || [])[0] || null;
    let brandLogoUrl = '';
    const primaryAssetId = org?.brand_logo_selection?.primary_asset_id;
    if (primaryAssetId) {
      const asset = await base44.asServiceRole.entities.MarketingAsset.get(primaryAssetId).catch(() => null);
      brandLogoUrl = asset?.file_url || '';
    }
    const fallbackLogo = brandLogoUrl || org?.logo_url || '';
    // Anything with a scheduled time still in the future is held back, so a
    // change goes live on the website by itself at the moment chosen.
    const now = Date.now();
    // Archived blocks were removed from their page in Page Content, so they
    // never reach the website until someone re-adds them.
    const sections = (sectionPage.items || []).filter(
      (s) => s.is_visible !== false && !s.is_archived && !scheduledForLater(s, now)
    );
    const news = (newsPage.items || []).filter((p) => p.advertise !== false && !scheduledForLater(p, now));
    const publications = (publicationPage.items || []).filter((p) => !scheduledForLater(p, now));

    const events = publications.map(publicPublication);
    // The top menu, in the order set in Page Content. An archived selection is
    // left out, so removing one takes it off the website's menu.
    const pages = (pagePage.items || []).filter((p) => p.is_visible !== false && !p.is_archived);

    return Response.json({
      site: publicSite(settings, fallbackLogo),
      pages: orderMenuPages(pages).map(publicPage),
      sections: sections.map(publicSection),
      news: news.map(publicNewsPost),
      events,
      counts: {
        events: events.length,
        news: news.length,
        sections: sections.length,
        pages: pages.length,
      },
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.log('getPublicWebsiteContent failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}