import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';

// Gold banner on the main Dashboard showing the Executive Director's
// scheduled briefings (morning / midday / end-of-day / Sunday week-ahead),
// generated automatically by the ED Briefing workflows.
export default function EdBriefingAlerts({ user }) {
  const qc = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['edBriefingNotifications', user?.email],
    queryFn: () => base44.entities.DashboardNotification.filter({ recipient_email: user?.email }, '-created_date', 20),
    enabled: !!user?.email,
  });

  const mine = notifications.filter(n =>
    !n.is_read &&
    n.kind === 'ed_briefing' &&
    (n.recipient_email || '').toLowerCase() === (user?.email || '').toLowerCase()
  ).slice(0, 3);

  if (!mine.length) return null;

  const dismiss = async (n) => {
    await base44.entities.DashboardNotification.update(n.id, { is_read: true });
    qc.invalidateQueries({ queryKey: ['edBriefingNotifications'] });
  };

  return (
    <div className="rounded-2xl border-2 border-primary bg-primary/10 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="font-bold text-primary">
          {mine.length > 1 ? `${mine.length} briefings from your assistant` : 'Briefing from your assistant'}
        </h2>
      </div>

      {mine.map(n => (
        <div key={n.id} className="rounded-xl border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold">{n.title}</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line mt-1">{n.message}</p>
            </div>
            <Button size="sm" variant="ghost" className="text-muted-foreground shrink-0" onClick={() => dismiss(n)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {n.link && (
            <Button size="sm" variant="outline" asChild className="mt-3">
              <Link to={n.link}>Open ED Portal</Link>
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}