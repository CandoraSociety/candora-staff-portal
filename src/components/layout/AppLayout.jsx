import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAccessControl } from '@/lib/useAccessControl';
import { cn } from '@/lib/utils';
import EAFloatingWidget from '@/components/ed/EAFloatingWidget';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => base44.entities.AccessPermission.list(),
  });

  const access = useAccessControl(user, permissions);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar - hidden on mobile unless open */}
      <div className={cn("hidden lg:block")}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} isAdmin={access.isAdmin} />
      </div>
      {mobileOpen && (
        <div className="lg:hidden fixed z-40">
          <Sidebar collapsed={false} setCollapsed={() => setMobileOpen(false)} isAdmin={access.isAdmin} />
        </div>
      )}

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300",
        collapsed ? "lg:ml-[68px]" : "lg:ml-[240px]"
      )}>
        <TopBar user={user} sidebarCollapsed={collapsed} onToggleMobile={() => setMobileOpen(!mobileOpen)} />
        <main className="p-6 max-w-7xl mx-auto">
          <Outlet context={{ user, access, permissions }} />
        </main>
      </div>
      <EAFloatingWidget />
    </div>
  );
}