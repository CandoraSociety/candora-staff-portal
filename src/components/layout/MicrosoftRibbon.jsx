import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Mail, MessageSquare, FileText, Table, Presentation, Notebook } from 'lucide-react';
import { cn } from '@/lib/utils';
import OutlookTeamsFloatingWidget from '@/components/outlook/OutlookTeamsFloatingWidget';
import TeamsFloatingWidget from '@/components/teams/TeamsFloatingWidget';
import OneNoteFloatingWidget from '@/components/onenote/OneNoteFloatingWidget';
import OfficeEditorPanel from '@/components/layout/OfficeEditorPanel';

const ALL_APPS = [
  { id: 'outlook', label: 'Outlook', icon: Mail },
  { id: 'teams', label: 'Teams', icon: MessageSquare },
  { id: 'onenote', label: 'OneNote', icon: Notebook },
  { id: 'word', label: 'New Word', icon: FileText },
  { id: 'excel', label: 'New Excel', icon: Table },
  { id: 'powerpoint', label: 'New PowerPoint', icon: Presentation },
];

export default function MicrosoftRibbon() {
  const [activePanel, setActivePanel] = useState(null);

  const { data: preferences } = useQuery({
    queryKey: ['microsoftRibbonPrefs'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        if (!user) return null;
        const data = await base44.entities.UserDashboardPreference.filter({ user_id: user.id });
        return data[0] || null;
      } catch {
        return null;
      }
    },
  });

  const enabledApps = preferences?.enabled_microsoft_apps;
  const apps = (!enabledApps || enabledApps.length === 0)
    ? ALL_APPS
    : ALL_APPS.filter(app => enabledApps.includes(app.id));

  const togglePanel = (id) => {
    setActivePanel(prev => prev === id ? null : id);
  };

  return (
    <>
      {/* Vertical ribbon — fixed on right edge, vertically centered */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-1 p-1.5 bg-card border border-r-0 border-border rounded-l-xl shadow-lg">
        {/* Microsoft four-square indicator */}
        <div className="flex items-center justify-center w-9 h-9 mb-1">
          <div className="grid grid-cols-2 gap-0.5">
            <div className="w-2 h-2 bg-[#F25022] rounded-sm" />
            <div className="w-2 h-2 bg-[#7FBA00] rounded-sm" />
            <div className="w-2 h-2 bg-[#00A4EF] rounded-sm" />
            <div className="w-2 h-2 bg-[#FFB900] rounded-sm" />
          </div>
        </div>
        <div className="h-px bg-border mx-2 mb-1" />

        {apps.map(app => {
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

      {/* Slide-out panels */}
      <OutlookTeamsFloatingWidget open={activePanel === 'outlook'} onClose={() => setActivePanel(null)} />
      <TeamsFloatingWidget open={activePanel === 'teams'} onClose={() => setActivePanel(null)} />
      <OneNoteFloatingWidget open={activePanel === 'onenote'} onClose={() => setActivePanel(null)} />
      <OfficeEditorPanel open={['word', 'excel', 'powerpoint'].includes(activePanel)} onClose={() => setActivePanel(null)} docType={activePanel} />
    </>
  );
}