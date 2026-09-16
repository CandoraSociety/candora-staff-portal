import React, { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, ChevronDown, ChevronUp, X, Megaphone, CheckCheck } from 'lucide-react';

const priorityDot = {
  urgent: 'bg-destructive',
  high: 'bg-accent-foreground',
  normal: 'bg-primary',
  low: 'bg-muted-foreground',
};

export default function AnnouncementRibbon({ announcements = [], user }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const { data: prefs } = useQuery({
    queryKey: ['userPreferences', user?.id],
    queryFn: async () => {
      const p = await base44.entities.UserDashboardPreference.filter({ user_id: user?.id });
      return p[0] || null;
    },
    enabled: !!user?.id,
  });

  const dismissed = prefs?.dismissed_announcement_ids || [];
  const cleared = prefs?.cleared_announcement_ids || [];

  // All live announcements this user hasn't permanently dismissed
  const active = useMemo(
    () =>
      announcements
        .filter(a => a.is_active && !dismissed.includes(a.id))
        .sort((a, b) => {
          const order = { urgent: 0, high: 1, normal: 2, low: 3 };
          return (order[a.priority] || 2) - (order[b.priority] || 2);
        }),
    [announcements, dismissed]
  );

  // Unseen ones drive the bell badge + marquee; clearing the bell keeps them in the list
  const unseen = active.filter(a => !cleared.includes(a.id));
  const count = unseen.length;
  const marqueeText = unseen.map(a => a.title).join('   •   ');

  const savePrefs = async (updates) => {
    if (prefs) {
      await base44.entities.UserDashboardPreference.update(prefs.id, updates);
    } else if (user?.id) {
      await base44.entities.UserDashboardPreference.create({ user_id: user.id, ...updates });
    }
    queryClient.invalidateQueries(['userPreferences', user?.id]);
  };

  const handleDismiss = (id) =>
    savePrefs({ dismissed_announcement_ids: [...new Set([...dismissed, id])] });

  const handleClearBell = () =>
    savePrefs({ cleared_announcement_ids: [...new Set([...cleared, ...active.map(a => a.id)])] });

  return (
    <div className="w-full">
      {/* Ribbon bar */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(v => !v)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setExpanded(v => !v); }}
        className="group w-full flex items-center gap-3 px-4 py-2 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer"
      >
        {/* Bell + badge */}
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Bell className="w-4 h-4 text-primary" />
          </div>
          {count > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {count}
            </span>
          )}
        </div>

        {/* Scrolling marquee text */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {count > 0 ? (
            <div className="ann-marquee">
              <span className="ann-marquee-track text-sm text-foreground whitespace-nowrap">
                {marqueeText}
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground truncate">
              {active.length > 0 ? 'Announcements' : 'No new announcements'}
            </p>
          )}
        </div>

        {/* Clear bell (mark all as seen) — keeps the notifications, just clears the badge */}
        {count > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); handleClearBell(); }}
            title="Clear bell (notifications stay in the list)"
            className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary px-2 py-1 rounded-md hover:bg-primary/10 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}

        {/* Expand indicator */}
        <div className="flex-shrink-0 flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
            {expanded ? 'Hide' : 'View'}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="mt-2 p-3 rounded-xl border border-border bg-card shadow-sm space-y-2 max-h-[320px] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Notifications</span>
            </div>
            <div className="flex items-center gap-2">
              {count > 0 && (
                <button
                  onClick={handleClearBell}
                  className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all as seen
                </button>
              )}
              <button
                onClick={() => setExpanded(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No announcements right now
            </p>
          ) : (
            active.map(ann => (
              <div
                key={ann.id}
                className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors"
              >
                <span
                  className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                    priorityDot[ann.priority] || priorityDot.normal
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ann.title}</p>
                  {ann.content && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {ann.content}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    {formatDistanceToNow(new Date(ann.created_date), { addSuffix: true })}
                  </p>
                </div>
                <button
                  onClick={() => handleDismiss(ann.id)}
                  title="Dismiss this notification (hide it permanently)"
                  className="flex-shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}