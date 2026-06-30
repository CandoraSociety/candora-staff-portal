import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import EAFloatingWidget from '@/components/ed/EAFloatingWidget';
import ModuleGate from '@/components/shared/ModuleGate';
import { Presentation, Home, Monitor, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/presentations', icon: Home },
  { name: 'New Presentation', href: '/presentations/editor/new', icon: Monitor },
];

export default function PresentationsLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <ModuleGate moduleId="presentations">
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b bg-sidebar">
          <div className="flex h-16 items-center justify-between px-6">
            <Link to="/presentations" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Presentation className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display font-bold text-sidebar-foreground">Presentations</h1>
                <p className="text-xs text-sidebar-foreground/70">PowerPoint Creator</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <button
              className="md:hidden text-sidebar-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-sidebar-border bg-sidebar">
              <nav className="flex flex-col gap-1 p-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      location.pathname === item.href
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </header>

        <main className="container mx-auto p-6">
          <Outlet />
        </main>
        <EAFloatingWidget />
      </div>
    </ModuleGate>
  );
}