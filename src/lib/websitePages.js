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

// Menu order: the home page leads, then position, then label. A selection that
// sits in a dropdown is placed directly after the item it opens from.
export function sortPages(pages) {
  const list = [...(pages || [])];
  const keys = new Set(list.map((page) => page.page_key));
  const childrenByParent = new Map();
  const topLevel = [];

  list.forEach((page) => {
    const parent = page.parent_page_key;
    if (parent && parent !== page.page_key && keys.has(parent)) {
      if (!childrenByParent.has(parent)) childrenByParent.set(parent, []);
      childrenByParent.get(parent).push(page);
    } else {
      topLevel.push(page);
    }
  });

  const byPosition = (a, b) =>
    (Number(a.display_order) || 0) - (Number(b.display_order) || 0) ||
    String(a.label || "").localeCompare(String(b.label || ""));

  topLevel.sort((a, b) => {
    if (!!a.is_home !== !!b.is_home) return a.is_home ? -1 : 1;
    return byPosition(a, b);
  });

  const ordered = [];
  topLevel.forEach((page) => {
    ordered.push(page);
    ordered.push(...(childrenByParent.get(page.page_key) || []).sort(byPosition));
  });
  return ordered;
}

// The selections that sit inside the dropdown under one menu item.
export function dropdownPages(pages, parentKey) {
  return sortPages(pages).filter((page) => page.parent_page_key === parentKey);
}

// The selections shown in the menu and as tabs: never an archived one.
export function activePages(pages) {
  return sortPages((pages || []).filter((page) => !page.is_archived));
}

export function archivedPages(pages) {
  return sortPages((pages || []).filter((page) => page.is_archived));
}