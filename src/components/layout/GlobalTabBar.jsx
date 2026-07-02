import React, { useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus } from 'lucide-react';
import { useTabs, PORTAL_REGISTRY } from '@/lib/tabContext';
import { AppWindow } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GlobalTabBar() {
  const { tabs, activeTab, openTab, closeTab } = useTabs();
  const navigate = useNavigate();

  useLayoutEffect(() => {
    document.body.classList.add('has-tabbar');
    return () => document.body.classList.remove('has-tabbar');
  }, []);

  return (
    <div className="global-tabbar sticky top-0 z-50 flex items-stretch h-9 bg-sidebar border-b border-sidebar-border">
      <div className="flex items-stretch overflow-x-auto flex-1 global-tabbar-scroll">
        {tabs.map((tab) => {
          const registry = PORTAL_REGISTRY[tab.path];
          const Icon = registry?.icon || AppWindow;
          const isActive = activeTab === tab.path;
          const canClose = tab.path !== '/';

          return (
            <div
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                'group relative flex items-center gap-1.5 px-3 cursor-pointer border-r border-sidebar-border text-xs whitespace-nowrap transition-colors select-none',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="hidden sm:inline max-w-[120px] truncate">{tab.label}</span>
              {canClose && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.path);
                  }}
                  className={cn(
                    'ml-1 flex items-center justify-center rounded p-0.5 transition-all',
                    isActive
                      ? 'hover:bg-destructive/20'
                      : 'opacity-40 hover:opacity-100 hover:bg-destructive/20'
                  )}
                  title="Close tab"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </div>
          );
        })}
      </div>
      <button
        onClick={() => openTab('/portal')}
        className="flex items-center justify-center px-3 text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground transition-colors flex-shrink-0 border-l border-sidebar-border"
        title="Browse portals"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}