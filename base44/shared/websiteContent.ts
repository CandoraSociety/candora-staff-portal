import { scheduledForLater } from './websitePublishing.ts';

// One reader for the site's content records, shared by the public feed and the
// Studio's search tools, so both always see the same pages, blocks and posts.
// `publishedOnly` narrows to what may be advertised; `skipScheduled` holds back
// anything whose change is still in the future.
export async function loadWebsiteContent(client, { publishedOnly = false, skipScheduled = false } = {}) {
  const [settingsPage, sectionPage, pagePage, newsPage, publicationPage] = await Promise.all([
    client.entities.WebsiteSettings.list({ limit: 1 }),
    client.entities.WebsiteSection.list({ sort: 'display_order', limit: 300 }),
    client.entities.WebsitePage.list({ sort: 'display_order', limit: 100 }),
    publishedOnly
      ? client.entities.WebsiteNewsPost.filter({ status: 'published' }, { sort: '-publish_date', limit: 50 })
      : client.entities.WebsiteNewsPost.list({ sort: '-publish_date', limit: 100 }),
    publishedOnly
      ? client.entities.WebsitePublication.filter(
          { status: 'published', advertise: true },
          { sort: 'event_start', limit: 100 }
        )
      : client.entities.WebsitePublication.list({ sort: 'event_start', limit: 100 }),
  ]);

  const now = Date.now();
  const heldBack = (record) => skipScheduled && scheduledForLater(record, now);

  return {
    settings: (settingsPage.items || [])[0] || null,
    // Archived blocks were removed from their page in Page Content, so they
    // never reach a reader until someone re-adds them.
    sections: (sectionPage.items || []).filter(
      (section) => section.is_visible !== false && !section.is_archived && !heldBack(section)
    ),
    // The top menu, in the order set in Page Content.
    pages: (pagePage.items || []).filter((page) => page.is_visible !== false && !page.is_archived),
    news: (newsPage.items || []).filter((post) => post.advertise !== false && !heldBack(post)),
    publications: (publicationPage.items || []).filter((item) => !heldBack(item)),
  };
}