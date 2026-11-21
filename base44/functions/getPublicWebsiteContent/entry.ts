import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  publicPublication,
  publicNewsPost,
  publicPage,
  publicSection,
  publicSite,
  orderMenuPages,
} from '../../shared/websitePublishing.ts';
import { loadWebsiteContent } from '../../shared/websiteContent.ts';
import { resolveTheme } from '../../shared/websiteThemes.ts';

// Public feed for the separate Candora website app. Anyone can read it, so it
// only ever returns published website content, shaped by the shared allowlist.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    // Anything with a scheduled time still in the future is held back, so a
    // change goes live on the website by itself at the moment chosen.
    const [content, orgPage, seoPage] = await Promise.all([
      loadWebsiteContent(base44.asServiceRole, { publishedOnly: true, skipScheduled: true }),
      base44.asServiceRole.entities.OrgSettings.list({ limit: 1 }),
      base44.asServiceRole.entities.WebsiteSeoPage.list({ limit: 100 }),
    ]);
    const { settings, sections, news, publications, pages } = content;

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
    const now = Date.now();
    const events = publications.map(publicPublication);

    return Response.json({
      site: publicSite(settings, fallbackLogo),
      // The seasonal decoration the site should wear at this moment — worked
      // out in Alberta time, so it changes on its own at midnight. New Year's
      // carries its own countdown, which turns into the celebration at zero.
      theme: resolveTheme(settings, now),
      pages: orderMenuPages(pages).map(publicPage),
      sections: sections.map(publicSection),
      news: news.map(publicNewsPost),
      events,
      // The search settings written in Website Studio, so the website can show
      // the right title, description and share image for each page.
      seo: (seoPage.items || [])
        .filter((record) => record.is_indexable !== false)
        .map((record) => ({
          page_key: record.page_key,
          meta_title: record.meta_title || '',
          meta_description: record.meta_description || '',
          keywords: record.keywords || [],
          og_image_url: record.og_image_url || '',
          canonical_path: record.canonical_path || '',
        })),
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