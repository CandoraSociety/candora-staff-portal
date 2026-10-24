// Only explicitly authored, view-only actions call this helper. No searching
// for an arbitrary button inside a section and no simulated form submissions.
export function activateTourControl(element) {
  if (!element || element.disabled || element.getAttribute('aria-disabled') === 'true') return false;
  if (element.getAttribute('data-tour-open') === 'true') return true;
  if (element.matches('input[type="checkbox"]') && element.checked) return true;
  if (element.getAttribute('role') === 'tab') {
    if (element.getAttribute('data-state') === 'active') return true;
    // Radix tabs activate on mousedown, not on a synthetic click alone.
    element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }));
  }
  element.click();
  return true;
}

export function spotlightBounds(element) {
  const bounds = element.getBoundingClientRect();
  let left = Math.max(8, bounds.left), top = Math.max(80, bounds.top);
  let right = Math.min(window.innerWidth - 8, bounds.right), bottom = Math.min(window.innerHeight - 8, bounds.bottom);
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    const style = getComputedStyle(parent), clip = parent.getBoundingClientRect();
    if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) { left = Math.max(left, clip.left); right = Math.min(right, clip.right); }
    if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) { top = Math.max(top, clip.top); bottom = Math.min(bottom, clip.bottom); }
  }
  if (right <= left || bottom <= top) return null;
  const rect = { top, left, width: right - left, height: bottom - top };
  // Point inside the visible part of the named section, not its off-screen centre.
  const point = { x: left + Math.min(rect.width / 2, 160), y: top + Math.min(rect.height / 2, 32) };
  return { rect, point };
}