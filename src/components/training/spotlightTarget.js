// Cached portals stay mounted, so the first match may belong to a hidden page.
export function isVisibleTourElement(element) {
  if (element.closest('[data-training-tour], [aria-hidden="true"], [inert]') || !element.getClientRects().length) return false;
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden';
}

export function findSpotlightTarget(target) {
  if (!target) return null;
  const root = target.scope ? document.querySelector(target.scope) : document;
  if (!root) return null;
  for (const selector of [].concat(target.selector || [])) {
    try {
      const element = [...root.querySelectorAll(selector)].find(isVisibleTourElement);
      if (element) return element;
    } catch { /* A stale selector must not stop the rest of the tour. */ }
  }
  if (!target.text) return null;
  return [...root.querySelectorAll('a,button,h1,h2,h3,th,label,span')]
    .filter(element => isVisibleTourElement(element) && element.textContent.trim().startsWith(target.text))
    .sort((a, b) => a.textContent.trim().length - b.textContent.trim().length)[0] || null;
}

// Group slides name several cards at once: highlight every match, not just the
// first, so a slide about five portals spotlights all five cards together.
export function findSpotlightTargets(target) {
  if (!target?.selectors) {
    const one = findSpotlightTarget(target);
    return one ? [one] : [];
  }
  const root = target.scope ? document.querySelector(target.scope) : document;
  if (!root) return [];
  const found = [];
  for (const selector of [].concat(target.selectors)) {
    try {
      [...root.querySelectorAll(selector)].forEach(element => {
        if (isVisibleTourElement(element) && !found.includes(element)) found.push(element);
      });
    } catch { /* A stale selector must not stop the rest of the tour. */ }
  }
  return found;
}

export function spotlightPath(module, index) {
  return (module?.steps || []).slice(0, index + 1)
    .reduce((path, step) => step.path || step.routeFallback || path, module?.path || '/');
}