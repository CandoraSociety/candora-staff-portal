import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAccessControl } from '@/lib/useAccessControl';
import { cn } from '@/lib/utils';
import EAFloatingWidget from '@/components/ed/EAFloatingWidget';
import NDAGate from '@/components/onboarding/NDAGate';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';
import OnboardingBanner from '@/components/onboarding/OnboardingBanner';
import { useOnboarding } from '@/lib/useOnboarding';

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

  // Auto-link employee record to user ID on first login
  useEffect(() => {
    if (!user?.id || !user?.email) return;
    base44.entities.Employee.filter({ email: user.email }).then(emps => {
      const emp = emps[0];
      if (emp && !emp.user_id) {
        base44.entities.Employee.update(emp.id, { user_id: user.id });
      }
    }).catch(() => {});
  }, [user?.id]);

  const access = useAccessControl(user, permissions);

  const {
    loading: onboardingLoading,
    ndaSigned,
    employee,
    onboardingTemplates,
    onboardingRecords,
    showWizard,
    setShowWizard,
    pendingCount,
    requiredPendingCount,
    handleNDASigned,
    handleWizardComplete,
    handleWizardDismiss,
  } = useOnboarding(user);

  // Block render until NDA check is done
  if (user && !onboardingLoading && ndaSigned === false) {
    return (
      <NDAGate
        user={user}
        employee={employee}
        onSigned={handleNDASigned}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar - hidden on mobile unless open */}
      <div className={cn("hidden lg:block app-sidebar")}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} isAdmin={access.isAdmin} />
      </div>
      {mobileOpen && (
        <div className="lg:hidden fixed z-40 app-sidebar-mobile">
          <Sidebar collapsed={false} setCollapsed={() => setMobileOpen(false)} isAdmin={access.isAdmin} />
        </div>
      )}

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300",
        collapsed ? "lg:ml-[68px]" : "lg:ml-[240px]"
      )}>
        <TopBar user={user} sidebarCollapsed={collapsed} onToggleMobile={() => setMobileOpen(!mobileOpen)} className="app-topbar" />
        {/* Onboarding banner — shown on all pages until complete */}
        {ndaSigned && pendingCount > 0 && (
          <OnboardingBanner
            pendingCount={pendingCount}
            requiredPendingCount={requiredPendingCount}
            onClick={() => setShowWizard(true)}
          />
        )}
        <main className="p-6 max-w-7xl mx-auto">
          <Outlet context={{ user, access, permissions }} />
        </main>
      </div>
      <EAFloatingWidget />

      {/* Onboarding Wizard */}
      {showWizard && onboardingTemplates.length > 0 && (
        <OnboardingWizard
          user={user}
          employee={employee}
          templates={onboardingTemplates}
          records={onboardingRecords}
          onComplete={handleWizardComplete}
          onDismiss={handleWizardDismiss}
        />
      )}
    </div>
  );
}