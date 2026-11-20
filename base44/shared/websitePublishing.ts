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

// A change can be given a moment to go live. Until that moment passes, the
// public website is not sent the item, so the change appears on its own.
export function scheduledForLater(record, now = Date.now()) {
  const at = record?.publish_at;
  if (!at) return false;
  const time = new Date(at).getTime();
  return Number.isFinite(time) && time > now;
}

// The pop-up can also be given a window: it only shows between its start and
// end, so an appeal can be queued ahead of time and retire itself.
export function popupActive(settings, now = Date.now()) {
  if (!settings?.popup_enabled) return false;
  const start = settings.popup_starts_at ? new Date(settings.popup_starts_at).getTime() : null;
  const end = settings.popup_ends_at ? new Date(settings.popup_ends_at).getTime() : null;
  if (start && Number.isFinite(start) && now < start) return false;
  if (end && Number.isFinite(end) && now > end) return false;
  return true;
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

// One selection in the website's top menu. The site builds its navigation from
// these, in the order given, so adding or removing one changes the menu itself.
export function publicPage(page) {
  return {
    key: page.page_key || '',
    label: page.label || '',
    path: page.path || (page.page_key === 'home' ? '/' : `/${String(page.page_key || '').replace(/_/g, '-')}`),
    order: Number(page.display_order) || 0,
    is_home: !!page.is_home,
    // Set when this selection sits inside a dropdown under another one.
    parent: page.parent_page_key || '',
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
    // How the website renders published news posts.
    news_feed: {
      style: settings.news_feed_style || 'grid',
      speed: settings.news_feed_speed || 'normal',
      pause_on_hover: settings.news_feed_pause_on_hover !== false,
      limit: Number(settings.news_feed_limit) || 6,
    },
    // The home page pop-up. enabled is always present so the website can check
    // one field before showing anything.
    popup: {
      enabled: popupActive(settings),
      title: settings.popup_title || '',
      message: settings.popup_message || '',
      image_url: settings.popup_image_url || '',
      background_url: settings.popup_background_url || '',
      button_label: settings.popup_button_label || '',
      button_url: settings.popup_button_url || '',
      frequency: settings.popup_frequency || 'once_per_session',
    },
  };
}