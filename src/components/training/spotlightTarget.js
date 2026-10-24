// Cached portals stay mounted, so the first match may belong to a hidden page.
export function findSpotlightTarget(target) {
  if (!target) return null;
  const visible = (element) => {
    if (element.closest('[data-training-tour], [aria-hidden="true"], [inert]') || !element.getClientRects().length) return false;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden';
  };
  const root = target.scope ? document.querySelector(target.scope) : document;
  if (!root) return null;
  for (const selector of [].concat(target.selector || [])) {
    try {
      const element = [...root.querySelectorAll(selector)].find(visible);
      if (element) return element;
    } catch { /* A stale selector must not stop the rest of the tour. */ }
  }
  if (!target.text) return null;
  return [...root.querySelectorAll('a,button,h1,h2,h3,th,label,span')]
    .filter(element => visible(element) && element.textContent.trim().startsWith(target.text))
    .sort((a, b) => a.textContent.trim().length - b.textContent.trim().length)[0] || null;
}

export function spotlightPath(module, index) {
  return (module?.steps || []).slice(0, index + 1)
    .reduce((path, step) => step.path || step.routeFallback || path, module?.path || '/');
}