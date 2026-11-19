// Shared rules for what leaves Candora 360 and reaches the public website.
// Only the fields listed here are ever read from a source record or handed to
// the website, so private client, staff and planning data can never leak.

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 70);
}

// The approved fields taken from an Event or Program record when the wizard
// opens and every time a publication is refreshed.
export function publicationFromSource(sourceType, source) {
  if (!source) return null;
  if (sourceType === 'event') {
    return {
      source_name: source.name || '',
      title: source.name || '',
      summary: String(source.description || '').slice(0, 240),
      body: source.description || '',
      image_url: source.cover_image_url || '',
      event_start: source.start_date || '',
      event_end: source.end_date || '',
      location: source.location || '',
    };
  }
  if (sourceType === 'program') {
    return {
      source_name: source.name || '',
      title: source.name || '',
      summary: String(source.description || '').slice(0, 240),
      body: source.description || '',
      image_url: '',
      event_start: source.start_date || '',
      event_end: source.end_date || '',
      location: '',
    };
  }
  return null;
}

// The only shape the public website receives for one published item.
export function publicPublication(pub) {
  return {
    slug: pub.slug || '',
    title: pub.title || '',
    summary: pub.summary || '',
    body: pub.body || '',
    image_url: pub.image_url || '',
    start: pub.event_start || '',
    end: pub.event_end || '',
    location: pub.location || '',
    cost: pub.cost || '',
    audience: pub.audience || '',
    registration_url: pub.registration_url || '',
    registration_note: pub.registration_note || '',
    source_type: pub.source_type || '',
    featured: !!pub.featured_on_home,
    home_order: Number(pub.home_order) || 0,
    public_path: pub.public_path || (pub.slug ? `/events/${pub.slug}` : ''),
    published_at: pub.published_at || '',
  };
}

export function publicNewsPost(post) {
  return {
    slug: post.slug || '',
    title: post.title || '',
    summary: post.summary || '',
    body: post.body || '',
    image_url: post.image_url || '',
    publish_date: post.publish_date || '',
    is_pinned: !!post.is_pinned,
    path: post.slug ? `/news/${post.slug}` : '',
  };
}

export function publicSection(section) {
  return {
    page: section.page || '',
    key: section.section_key || '',
    heading: section.heading || '',
    body: section.body || '',
    image_url: section.image_url || '',
    cta_label: section.cta_label || '',
    cta_url: section.cta_url || '',
    order: Number(section.display_order) || 0,
  };
}

// fallbackLogo is the organization's primary brand logo, used when the site
// settings do not name a logo of their own.
export function publicSite(settings, fallbackLogo) {
  if (!settings) return null;
  return {
    site_name: settings.site_name || 'Candora',
    logo_url: settings.logo_url || fallbackLogo || '',
    tagline: settings.tagline || '',
    hero_headline: settings.hero_headline || '',
    hero_subheadline: settings.hero_subheadline || '',
    hero_image_url: settings.hero_image_url || '',
    hero_cta_label: settings.hero_cta_label || '',
    hero_cta_url: settings.hero_cta_url || '',
    about_summary: settings.about_summary || '',
    events_heading: settings.events_heading || '',
    events_intro: settings.events_intro || '',
    contact_email: settings.contact_email || '',
    contact_phone: settings.contact_phone || '',
    contact_address: settings.contact_address || '',
    office_hours: settings.office_hours || '',
    charity_number: settings.charity_number || '',
    footer_note: settings.footer_note || '',
    social_links: Array.isArray(settings.social_links)
      ? settings.social_links.map((link) => ({ label: link.label || '', url: link.url || '' }))
      : [],
  };
}