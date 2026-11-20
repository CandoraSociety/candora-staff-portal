// The selections across the top of the website, which are also the tabs in
// Page Content. They are stored as WebsitePage records; this list is only the
// starting set used when none exist yet.

export const DEFAULT_WEBSITE_PAGES = [
  { label: "Home", page_key: "home", path: "/", is_home: true, display_order: 0 },
  { label: "About us", page_key: "about", path: "/about", display_order: 1 },
  { label: "Programs", page_key: "programs", path: "/programs", display_order: 2 },
  { label: "Events", page_key: "events", path: "/events", display_order: 3 },
  { label: "Contact", page_key: "contact", path: "/contact", display_order: 4 },
  { label: "Get involved", page_key: "get_involved", path: "/get-involved", display_order: 5 },
];

// A new selection gets a key from its label, e.g. "Winter Festival" →
// winter_festival. The key never changes once the page exists.
export function pageKeyFromLabel(label) {
  return String(label || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s-]+/g, "_")
    .slice(0, 40);
}

// Menu order: the home page leads, then position, then label.
export function sortPages(pages) {
  return [...pages].sort((a, b) => {
    if (!!a.is_home !== !!b.is_home) return a.is_home ? -1 : 1;
    const order = (Number(a.display_order) || 0) - (Number(b.display_order) || 0);
    return order || String(a.label || "").localeCompare(String(b.label || ""));
  });
}

// The selections shown in the menu and as tabs: never an archived one.
export function activePages(pages) {
  return sortPages((pages || []).filter((page) => !page.is_archived));
}

export function archivedPages(pages) {
  return sortPages((pages || []).filter((page) => page.is_archived));
}