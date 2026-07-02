import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, LayoutGrid, Users, Heart, Briefcase, Gavel,
  FileText, BarChart3, Utensils, Megaphone, Archive, Calendar,
  FolderOpen, Mail, CalendarDays, GraduationCap,
  Code, HelpCircle, AppWindow, Baby, LifeBuoy
} from 'lucide-react';

const PORTAL_REGISTRY = {
  '/': { label: 'Dashboard', icon: LayoutDashboard },
  '/portal': { label: 'Portals', icon: LayoutGrid },
  '/nexushr': { label: 'HR Management', icon: Users },
  '/pathways': { label: 'Pathways CM', icon: Heart },
  '/ed': { label: 'ED Portal', icon: Briefcase },
  '/board': { label: 'Board', icon: Gavel },
  '/grants': { label: 'Grants', icon: FileText },
  '/reporting': { label: 'Reporting', icon: BarChart3 },
  '/food': { label: 'Food Services', icon: Utensils },
  '/marketing': { label: 'Marketing', icon: Megaphone },
  '/archives': { label: 'Archives', icon: Archive },
  '/eventsmgr': { label: 'Events Manager', icon: Calendar },
  '/filemanager': { label: 'File Manager', icon: FolderOpen },
  '/volunteermgr': { label: 'Volunteer Mgr', icon: Users },
  '/outlook': { label: 'Outlook', icon: Mail },
  '/meeting-manager': { label: 'Meetings', icon: CalendarDays },
  '/ell': { label: 'ELL Program', icon: GraduationCap },
  '/frn': { label: 'FRN Programs', icon: Users },
  '/phac': { label: 'PHAC Programs', icon: Baby },
  '/rc': { label: 'Resource Centre', icon: LifeBuoy },
  '/dev-tasks': { label: 'Dev Tasks', icon: Code },
  '/how-to-admin': { label: 'How-To', icon: HelpCircle },
};

const TabContext = createContext(null);
const STORAGE_KEY = 'candora_open_tabs';
const FIXED_TABS = ['/'];

function getPortalPrefix(pathname) {
  if (pathname === '/') return '/';
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return '/';
  return '/' + segments[0];
}

function isTabRoute(pathname) {
  return getPortalPrefix(pathname) in PORTAL_REGISTRY;
}

export function TabProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [tabs, setTabs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (!parsed.find(t => t.path === '/')) {
            parsed.unshift({ path: '/', label: 'Dashboard' });
          }
          return parsed;
        }
      }
    } catch {}
    return [{ path: '/', label: 'Dashboard' }];
  });

  const [activeTab, setActiveTab] = useState(() => {
    const prefix = getPortalPrefix(location.pathname);
    return isTabRoute(location.pathname) ? prefix : '/';
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
    } catch {}
  }, [tabs]);

  // Watch location changes — auto-create/activate tabs
  useEffect(() => {
    const prefix = getPortalPrefix(location.pathname);
    if (!isTabRoute(location.pathname)) return;

    setActiveTab(prefix);
    setTabs(prev => {
      if (prev.find(t => t.path === prefix)) return prev;
      const registry = PORTAL_REGISTRY[prefix];
      return [...prev, { path: prefix, label: registry?.label || prefix }];
    });
  }, [location.pathname]);

  const openTab = useCallback((path, metadata) => {
    const prefix = getPortalPrefix(path);
    const registry = PORTAL_REGISTRY[prefix];
    const label = metadata?.label || registry?.label || prefix;

    setTabs(prev => {
      if (prev.find(t => t.path === prefix)) return prev;
      return [...prev, { path: prefix, label }];
    });
    setActiveTab(prefix);
    navigate(path);
  }, [navigate]);

  const closeTab = useCallback((tabPath) => {
    if (FIXED_TABS.includes(tabPath)) return;

    const idx = tabs.findIndex(t => t.path === tabPath);
    if (idx === -1) return;

    const newTabs = tabs.filter(t => t.path !== tabPath);
    if (!newTabs.find(t => t.path === '/')) {
      newTabs.unshift({ path: '/', label: 'Dashboard' });
    }

    setTabs(newTabs);

    if (activeTab === tabPath) {
      const nextTab = newTabs[Math.min(idx, newTabs.length - 1)] || newTabs[0];
      setActiveTab(nextTab.path);
      navigate(nextTab.path);
    }
  }, [tabs, activeTab, navigate]);

  return (
    <TabContext.Provider value={{ tabs, activeTab, openTab, closeTab }}>
      {children}
    </TabContext.Provider>
  );
}

export function useTabs() {
  const ctx = useContext(TabContext);
  if (!ctx) {
    return {
      tabs: [{ path: '/', label: 'Dashboard' }],
      activeTab: '/',
      openTab: (path) => window.location.assign(path),
      closeTab: () => {},
    };
  }
  return ctx;
}

export { PORTAL_REGISTRY };