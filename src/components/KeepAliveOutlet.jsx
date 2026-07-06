import { useContext, useRef, useEffect, useReducer } from 'react';
import {
  useOutlet,
  useLocation,
  UNSAFE_NavigationContext as NavigationContext,
  UNSAFE_LocationContext as LocationContext,
} from 'react-router-dom';
import { useTabs, PORTAL_REGISTRY } from '@/lib/tabContext';

const noopNavigator = {
  push: () => {},
  replace: () => {},
  go: () => {},
  back: () => {},
  forward: () => {},
  createHref: (to) => (typeof to === 'string' ? to : to?.pathname || '/'),
  listen: () => () => {},
};

function getPortalPrefix(pathname) {
  if (pathname === '/') return '/';
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return '/';
  return '/' + segments[0];
}

/**
 * KeepAliveOutlet — a drop-in replacement for <Outlet /> that caches
 * rendered portal content so switching between portal tabs preserves
 * page state (form inputs, scroll position, etc.).
 *
 * How it works:
 * 1. Each open portal prefix gets its own cached entry (outlet element +
 *    frozen router contexts).
 * 2. The active portal uses live (current) contexts — navigation works normally.
 * 3. Inactive portals render in a hidden div with frozen contexts (noop navigator)
 *    so their components stay mounted but can't interfere with the active portal.
 * 4. When a tab is closed, its cache entry is removed and components unmount.
 */
export default function KeepAliveOutlet() {
  const outlet = useOutlet();
  const location = useLocation();
  const navCtx = useContext(NavigationContext);
  const locCtx = useContext(LocationContext);
  const { tabs } = useTabs();

  const prefix = getPortalPrefix(location.pathname);
  const isPortalRoute = Object.keys(PORTAL_REGISTRY).includes(prefix);

  const cacheRef = useRef({});
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  // Update cache for the active portal on every render
  if (isPortalRoute) {
    cacheRef.current[prefix] = {
      outlet,
      navCtx,
      locCtx,
      fullPath: location.pathname + (location.search || ''),
    };
  }

  // Clean up cache entries for closed tabs
  useEffect(() => {
    const openPrefixes = new Set(tabs.map((t) => t.path));
    let changed = false;
    Object.keys(cacheRef.current).forEach((p) => {
      if (!openPrefixes.has(p)) {
        delete cacheRef.current[p];
        changed = true;
      }
    });
    if (changed) forceUpdate();
  }, [tabs]);

  const entries = Object.entries(cacheRef.current);

  return (
    <>
      {entries.map(([p, cached]) => {
        const isActive = p === prefix && isPortalRoute;

        // For active portal: use live contexts (navigation works normally)
        // For inactive portals: use frozen contexts with noop navigator
        const navValue = isActive
          ? navCtx
          : { ...cached.navCtx, navigator: noopNavigator };
        const locValue = isActive ? locCtx : cached.locCtx;
        const outletEl = isActive ? outlet : cached.outlet;

        return (
          <div
            key={p}
            style={{ display: isActive ? 'block' : 'none' }}
          >
            <NavigationContext.Provider value={navValue}>
              <LocationContext.Provider value={locValue}>
                {outletEl}
              </LocationContext.Provider>
            </NavigationContext.Provider>
          </div>
        );
      })}

      {/* Non-portal routes (e.g. /admin) render directly without caching */}
      {!isPortalRoute && outlet}
    </>
  );
}