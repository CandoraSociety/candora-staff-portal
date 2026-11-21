import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { loadWebsiteContent } from '../../shared/websiteContent.ts';

// The AI engine behind Website Studio's search and advertising tools. It reads
// the site's real content — the same records the public website is built from —
// so nothing is ever reviewed or written from invented copy.
// Actions: audit (whole-site review), generate_meta (one page's search
// settings), ads_plan (a paid campaign's copy, keywords and projections).

const clip = (value, max) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';

function siteDigest({ settings, pages, sections, publications, news, seoPages }) {
  const lines = [];
  lines.push(`Organization: ${settings?.site_name || 'Candora'}`);
  if (settings?.tagline) lines.push(`Tagline: ${clip(settings.tagline, 200)}`);
  if (settings?.about_summary) lines.push(`About: ${clip(settings.about_summary, 800)}`);
  if (settings?.hero_headline) lines.push(`Home headline: ${clip(settings.hero_headline, 200)}`);
  if (settings?.hero_subheadline) lines.push(`Home subheadline: ${clip(settings.hero_subheadline, 300)}`);
  if (settings?.contact_address) lines.push(`Address: ${clip(settings.contact_address, 200)}`);
  if (settings?.contact_phone) lines.push(`Phone: ${settings.contact_phone}`);
  if (settings?.contact_email) lines.push(`Email: ${settings.contact_email}`);
  if (settings?.office_hours) lines.push(`Office hours: ${clip(settings.office_hours, 150)}`);
  if (settings?.charity_number) lines.push(`Registered charity number: ${settings.charity_number}`);
  if (settings?.public_site_url) lines.push(`Public site address: ${settings.public_site_url}`);

  lines.push('', 'MENU PAGES:');
  pages.forEach((page) => lines.push(`- ${page.label} (${page.path || '/'})`));

  lines.push('', 'PAGE COPY:');
  sections.slice(0, 60).forEach((section) => {
    lines.push(`- [${section.page}] ${clip(section.heading, 90)}: ${clip(section.body, 320)}`);
  });

  if (publications.length) {
    lines.push('', 'PROGRAMS AND EVENTS ON THE SITE:');
    publications.slice(0, 30).forEach((item) => {
      lines.push(`- ${clip(item.title, 120)}: ${clip(item.summary, 180)}`);
    });
  }

  if (news.length) {
    lines.push('', 'NEWS POSTS:');
    news.slice(0, 20).forEach((post) => {
      lines.push(`- ${clip(post.title, 120)}: ${clip(post.summary, 180)}`);
    });
  }

  lines.push('', 'CURRENT SEARCH SETTINGS:');
  if (!seoPages.length) {
    lines.push('- None written yet.');
  } else {
    seoPages.forEach((seo) => {
      lines.push(
        `- [${seo.page_key}] title: ${seo.meta_title || '(missing)'} | description: ${
          seo.meta_description || '(missing)'
        }`
      );
    });
  }

  return lines.join('\n');
}

const AUDIT_SCHEMA = {
  type: 'object',
  properties: {
    score: { type: 'number' },
    summary: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          area: { type: 'string' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          issue: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['area', 'severity', 'issue', 'fix'],
      },
    },
    quick_wins: { type: 'array', items: { type: 'string' } },
    keywords: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          term: { type: 'string' },
          intent: { type: 'string' },
          note: { type: 'string' },
        },
        required: ['term', 'intent'],
      },
    },
    ai_search_notes: { type: 'string' },
  },
  required: ['score', 'summary', 'findings'],
};

const META_SCHEMA = {
  type: 'object',
  properties: {
    meta_title: { type: 'string' },
    meta_description: { type: 'string' },
    keywords: { type: 'array', items: { type: 'string' } },
    ai_score: { type: 'number' },
    ai_notes: { type: 'string' },
  },
  required: ['meta_title', 'meta_description', 'keywords'],
};

const ADS_SCHEMA = {
  type: 'object',
  properties: {
    headlines: { type: 'array', items: { type: 'string' } },
    descriptions: { type: 'array', items: { type: 'string' } },
    keywords: { type: 'array', items: { type: 'string' } },
    negative_keywords: { type: 'array', items: { type: 'string' } },
    call_to_action: { type: 'string' },
    targeting_notes: { type: 'string' },
    projected_clicks: { type: 'number' },
    projected_conversions: { type: 'number' },
    projected_cost_per_click: { type: 'number' },
    ai_notes: { type: 'string' },
    launch_notes: { type: 'string' },
  },
  required: ['headlines', 'descriptions', 'keywords', 'call_to_action'],
};

async function buildAdsPlan(base44, user, body) {
  const brief = body.brief || {};
  const digest = clip(body.digest, 4000);
  const prompt = `You are planning a paid online advertising campaign for a Canadian non-profit, Candora Society.

CAMPAIGN BRIEF
- Name: ${brief.name || 'Untitled campaign'}
- Objective: ${brief.objective || 'traffic'}
- Channel: ${brief.channel || 'google_search'}
- Total budget: ${brief.budget_total || 'not set'} ${brief.currency || 'CAD'}
- Daily budget: ${brief.budget_daily || 'not set'}
- Area served: ${brief.area || 'Edmonton, Alberta'}
- Audience: ${brief.audience || 'not specified'}
- Offer / what we want people to do: ${brief.offer || 'not specified'}
- Landing page: ${brief.landing_page || 'the website'}

WHAT THE ORGANIZATION ACTUALLY DOES
${digest || 'A community services non-profit offering programs, food services, employment support and a resource centre.'}

Write the campaign so it is ready to load into Google Ads or Meta Ads:
- 8 headlines of 30 characters or fewer each, specific and honest, no exclamation-mark hype, no all-caps.
- 4 descriptions of 90 characters or fewer each, saying what the organization offers and what to do next.
- 12 to 18 search phrases real people would type, most valuable first, each 1-5 words.
- 6 to 10 negative keywords that would waste the budget (job seekers looking for paid work when we mean a program, unrelated products, other cities).
- A single call to action verb.
- Targeting notes: area radius, language, schedule, audiences to layer on, and any demographic or interest targeting worth using.
- Realistic projections for the budget: cost per click in the campaign currency, clicks, and conversions, with the conversion rate you assumed stated in ai_notes.
- launch_notes: what must exist before launch (tracking, approved budget, finished landing page, tax receipt wording).
Never invent programs, prices, phone numbers or statistics that are not in the brief above.`;

  const plan = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: ADS_SCHEMA,
  });

  return Response.json({ plan, planned_by: user.full_name });
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'audit';

    if (action === 'ads_plan') {
      return await buildAdsPlan(base44, user, body);
    }

    const [content, seoRes] = await Promise.all([
      loadWebsiteContent(base44, { publishedOnly: true }),
      base44.entities.WebsiteSeoPage.list({ limit: 100 }),
    ]);
    const { settings, pages, sections, publications, news } = content;
    const seoPages = seoRes.items || [];

    if (action === 'generate_meta') {
      const pageKey = body.page_key;
      if (!pageKey) return Response.json({ error: 'page_key is required' }, { status: 400 });

      const page = pages.find((p) => p.page_key === pageKey) || {
        page_key: pageKey,
        label: body.page_label || pageKey,
        path: body.path || `/${pageKey}`,
      };
      const pageSections = sections.filter((s) => s.page === pageKey);
      const copy = pageSections
        .map((s) => `- ${clip(s.heading, 90)}: ${clip(s.body, 500)}`)
        .join('\n');

      const prompt = `Write the search settings for one page of a Canadian non-profit's website.

ORGANIZATION: ${settings?.site_name || 'Candora'} — ${
        clip(settings?.about_summary, 600) || 'community services non-profit'
      }
${settings?.contact_address ? `LOCATION: ${clip(settings.contact_address, 150)}` : ''}

PAGE: ${page.label} (${page.path || '/'})

WHAT IS ON THE PAGE:
${copy || clip(body.context, 2000) || '(no copy written for this page yet — write settings that fit the page name and the organization)'}

Return:
- meta_title: 50-60 characters, the page's purpose first, then "| Candora" or the organization name.
- meta_description: 140-160 characters, one clear sentence on what the page offers and one on who it is for. Written for a person scanning search results, not for a search engine.
- keywords: 6-10 phrases people would actually type, most valuable first, mixing what the program is called with what people call it themselves.
- ai_score: 0-100, how findable this page is as written, judged honestly.
- ai_notes: two sentences — what you emphasised and what change would most improve this page's reach.
Do not invent facts, prices, dates or phone numbers that are not on the page.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: META_SCHEMA,
      });

      const payload = {
        page_key: pageKey,
        page_label: page.label,
        path: page.path || `/${pageKey}`,
        meta_title: result.meta_title || '',
        meta_description: result.meta_description || '',
        keywords: result.keywords || [],
        ai_score: typeof result.ai_score === 'number' ? result.ai_score : null,
        ai_notes: result.ai_notes || '',
        ai_generated_at: new Date().toISOString(),
        updated_by_name: user.full_name,
      };

      const existing = seoPages.find((record) => record.page_key === pageKey);
      const saved = existing
        ? await base44.entities.WebsiteSeoPage.update(existing.id, payload)
        : await base44.entities.WebsiteSeoPage.create(payload);

      return Response.json({ seo: saved });
    }

    const digest = siteDigest({ settings, pages, sections, publications, news, seoPages });

    const prompt = `You are auditing the online presence of a Canadian non-profit's website, for a staff member who is not a search specialist.

EVERYTHING THE WEBSITE CURRENTLY SAYS:
${digest}

Judge it as Google would, and as an AI assistant (ChatGPT, Google AI answers, Copilot) would when asked "what does Candora do in Edmonton" or "where can I get food help near me".

Return:
- score: 0-100 for how findable and well-described the site is today. Be honest: missing page titles and descriptions are costly.
- summary: 2-3 plain sentences a non-specialist understands — where the site stands and the single biggest opportunity.
- findings: 5-9 concrete problems, ordered worst first. Each with the area (e.g. "Home page title", "Program pages", "Contact details", "Structured data"), a severity, the issue in plain words, and a fix that names exactly what to write or change. Point at real pages and real copy from the digest — never generic advice.
- quick_wins: 3-5 changes that take minutes and matter now.
- keywords: 10-16 phrases this organization should be found for, each with the intent behind the search and the page it belongs on. Include the local ones ("food bank Edmonton", "English classes for newcomers Edmonton") and the ones people use instead of the organization's own program names.
- ai_search_notes: 2-4 sentences on how AI assistants currently see the organization and what would make them describe it correctly and recommend it — including whether the site says plainly, in one sentence, what Candora is, who it serves and where.
Never invent facts. If something is missing from the digest, say it is missing and say what to add.`;

    const audit = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: AUDIT_SCHEMA,
    });

    const saved = await base44.entities.WebsiteSeoAudit.create({
      score: typeof audit.score === 'number' ? audit.score : 0,
      summary: audit.summary || '',
      findings: audit.findings || [],
      quick_wins: audit.quick_wins || [],
      keywords: audit.keywords || [],
      ai_search_notes: audit.ai_search_notes || '',
      generated_by_name: user.full_name,
    });

    return Response.json({ audit: saved });
  } catch (error) {
    console.log('websiteSeoAssistant failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}