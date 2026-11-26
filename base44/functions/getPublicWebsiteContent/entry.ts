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
import { publicProgram, publicSession } from '../../shared/websitePrograms.ts';

// Public feed for the separate Candora website app. Anyone can read it, so it
// only ever returns published website content, shaped by the shared allowlist.
// Programs, their calendar, the board list, documents and volunteer roles are
// added here so the website never has to point at an outside form or a PDF on the
// old site.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const now = Date.now();
    const horizon = new Date(now + 90 * 24 * 60 * 60 * 1000).toISOString();

    // Anything with a scheduled time still in the future is held back, so a
    // change goes live on the website by itself at the moment chosen.
    const [content, orgPage, seoPage, programPage, sessionPage, seatRows] = await Promise.all([
      loadWebsiteContent(base44.asServiceRole, { publishedOnly: true, skipScheduled: true }),
      base44.asServiceRole.entities.OrgSettings.list({ limit: 1 }),
      base44.asServiceRole.entities.WebsiteSeoPage.list({ limit: 100 }),
      base44.asServiceRole.entities.WebsiteProgram.filter(
        { is_published: true },
        { sort: 'home_order', limit: 200 }
      ),
      base44.asServiceRole.entities.WebsiteProgramSession.filter(
        { starts_at: { $gte: new Date(now).toISOString(), $lte: horizon } },
        { sort: 'starts_at', limit: 500 }
      ),
      base44.asServiceRole.entities.WebsiteProgramRegistration.aggregate({
        query: { status: 'confirmed' },
        groupBy: 'program',
      }),
    ]);

    const [boardPage, libraryPage, rolePage] = await Promise.all([
      base44.asServiceRole.entities.BoardMember.filter({ status: 'active' }, { limit: 50 }),
      base44.asServiceRole.entities.WebsiteLibraryItem.filter(
        { is_published: true },
        { sort: 'display_order', limit: 200 }
      ),
      base44.asServiceRole.entities.VolunteerRole.filter({ is_open: true }, { sort: 'order', limit: 50 }),
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
    const events = publications.map(publicPublication);

    const seatsByProgram = new Map(
      (seatRows?.rows || []).map((row) => [row.program, Number(row.count) || 0])
    );
    const programs = (programPage.items || []).map((program) =>
      publicProgram(program, seatsByProgram.get(program.id) || 0, now)
    );
    const sessions = (sessionPage.items || []).map(publicSession);

    const library = libraryPage.items || [];
    const documents = library
      .filter((item) => item.kind === 'document')
      .map((item) => ({
        title: item.title || '',
        category: item.category || 'Documents',
        description: item.description || '',
        file_url: item.file_url || '',
        image_url: item.image_url || '',
      }));
    const resources = library
      .filter((item) => item.kind === 'resource')
      .map((item) => ({
        title: item.title || '',
        category: item.category || 'Online resources',
        description: item.description || '',
        url: item.external_url || '',
        image_url: item.image_url || '',
      }));

    const boardMembers = (boardPage.items || []).map((member) => ({
      name: member.full_name || '',
      role: member.role || '',
      bio: member.bio || '',
      photo_url: member.photo_url || '',
    }));

    const volunteerRoles = (rolePage.items || []).map((role) => ({
      id: role.id,
      title: role.title || '',
      summary: role.summary || '',
      description: role.description || '',
      commitment: role.commitment || '',
      requirements: role.requirements || '',
      location_name: role.location_name || '',
    }));

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
      programs,
      program_sessions: sessions,
      board_members: boardMembers,
      documents,
      volunteer_roles: volunteerRoles,
      resources,
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
        programs: programs.length,
        program_sessions: sessions.length,
        documents: documents.length,
        volunteer_roles: volunteerRoles.length,
        resources: resources.length,
      },
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.log('getPublicWebsiteContent failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}