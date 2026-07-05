import React, { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, ChevronDown, ChevronUp, X, Megaphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const priorityDot = {
  urgent: 'bg-destructive',
  high: 'bg-accent-foreground',
  normal: 'bg-primary',
  low: 'bg-muted-foreground',
};

export default function AnnouncementRibbon({ announcements = [] }) {
  const [expanded, setExpanded] = useState(false);

  const active = useMemo(
    () =>
      announcements
        .filter(a => a.is_active)
        .sort((a, b) => {
          const order = { urgent: 0, high: 1, normal: 2, low: 3 };
          return (order[a.priority] || 2) - (order[b.priority] || 2);
        }),
    [announcements]
  );

  const count = active.length;
  const marqueeText = active.map(a => a.title).join('   •   ');

  return (
    <div className="w-full">
      {/* Ribbon bar */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="group w-full flex items-center gap-3 px-4 py-2 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all"
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
            <p className="text-sm text-muted-foreground truncate">No new announcements</p>
          )}
        </div>

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
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="mt-2 p-3 rounded-xl border border-border bg-card shadow-sm space-y-2 max-h-[320px] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Notifications</span>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
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
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}