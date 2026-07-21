import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';
import { MICROSOFT_APPS, DEFAULT_MS_APP_IDS } from '@/lib/microsoftApps';
import OutlookTeamsFloatingWidget from '@/components/outlook/OutlookTeamsFloatingWidget';
import TeamsFloatingWidget from '@/components/teams/TeamsFloatingWidget';
import OfficeEditorPanel from '@/components/layout/OfficeEditorPanel';

export default function MicrosoftRibbon() {
  const [activePanel, setActivePanel] = useState(null);
  const { user } = useAuth();

  const { data: preferences } = useQuery({
    queryKey: ['dashboardPreferences', user?.id],
    queryFn: () => base44.entities.UserDashboardPreference.filter({ user_id: user?.id }).then(data => data[0]),
    enabled: !!user?.id,
  });

  const enabledIds = preferences?.enabled_microsoft_apps?.length > 0
    ? preferences.enabled_microsoft_apps
    : DEFAULT_MS_APP_IDS;

  const visibleApps = MICROSOFT_APPS.filter(app => enabledIds.includes(app.id));

  const togglePanel = (id) => {
    setActivePanel(prev => prev === id ? null : id);
  };

  // Add body class so global CSS can pad content away from the ribbon
  useEffect(() => {
    if (visibleApps.length === 0) return;
    document.body.classList.add('has-ms-ribbon');
    return () => document.body.classList.remove('has-ms-ribbon');
  }, [visibleApps.length]);

  if (visibleApps.length === 0) return null;

  return (
    <>
      {/* Full-height vertical ribbon — docked to right edge */}
      <div className="fixed right-0 top-0 bottom-0 z-40 flex flex-col items-center gap-1 p-1.5 bg-card border-l border-border">
        {/* Microsoft four-square indicator */}
        <div className="flex items-center justify-center w-9 h-9 mt-1">
          <div className="grid grid-cols-2 gap-0.5">
            <div className="w-2 h-2 bg-[#F25022] rounded-sm" />
            <div className="w-2 h-2 bg-[#7FBA00] rounded-sm" />
            <div className="w-2 h-2 bg-[#00A4EF] rounded-sm" />
            <div className="w-2 h-2 bg-[#FFB900] rounded-sm" />
          </div>
        </div>
        <div className="h-px bg-border w-7 mb-1" />

        <div className="flex flex-col gap-1 flex-1 justify-center">
          {visibleApps.map(app => {
            const Icon = app.icon;
            const isActive = activePanel === app.id;
            return (
              <button
                key={app.id}
                onClick={() => togglePanel(app.id)}
                title={app.label}
                className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-lg transition-all',
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Slide-out panels */}
      <OutlookTeamsFloatingWidget open={activePanel === 'outlook'} onClose={() => setActivePanel(null)} />
      <TeamsFloatingWidget open={activePanel === 'teams'} onClose={() => setActivePanel(null)} />
      <OfficeEditorPanel open={['word', 'excel', 'powerpoint'].includes(activePanel)} onClose={() => setActivePanel(null)} docType={activePanel} />
    </>
  );
}