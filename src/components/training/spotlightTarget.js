// Cached portals stay mounted, so the first match may belong to a hidden page.
export function findSpotlightTarget(target) {
  if (!target) return null;
  const visible = (element) => {
    if (element.closest('[data-training-tour]') || !element.getClientRects().length) return false;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden';
  };
  for (const selector of [].concat(target.selector || [])) {
    try {
      const element = [...document.querySelectorAll(selector)].find(visible);
      if (element) return element;
    } catch { /* A stale selector must not stop the rest of the tour. */ }
  }
  if (!target.text) return null;
  return [...document.querySelectorAll('a,button,h1,h2,h3,th,label,span,div')]
    .filter(element => visible(element) && element.textContent.trim().startsWith(target.text))
    .sort((a, b) => a.textContent.trim().length - b.textContent.trim().length)[0] || null;
}

export function spotlightPath(module, index) {
  return (module?.steps || []).slice(0, index + 1)
    .reduce((path, step) => step.path || path, module?.path || '/');
}