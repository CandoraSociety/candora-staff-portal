import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Lightbulb, MessageSquare, X } from 'lucide-react';

// Dashboard banner for staff who submitted an app change request: tells them
// when it has been completed, or carries a message asking for clarification.
export default function AppChangeRequestAlerts({ user }) {
  const qc = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['appChangeRequestNotifications', user?.email],
    queryFn: () => base44.entities.DashboardNotification.filter({ recipient_email: user?.email }, '-created_date', 50),
    enabled: !!user?.email,
  });

  const mine = notifications.filter(n =>
    !n.is_read &&
    n.kind === 'app_change_request' &&
    (n.recipient_email || '').toLowerCase() === (user?.email || '').toLowerCase());

  if (!mine.length) return null;

  const dismiss = async (n) => {
    await base44.entities.DashboardNotification.update(n.id, { is_read: true });
    qc.invalidateQueries({ queryKey: ['appChangeRequestNotifications'] });
  };

  return (
    <div className="rounded-2xl border-2 border-highlight bg-highlight/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-highlight" />
        <h2 className="font-bold text-foreground">
          {mine.length} update{mine.length > 1 ? 's' : ''} on your app change request{mine.length > 1 ? 's' : ''}
        </h2>
      </div>

      {mine.map(n => (
        <div key={n.id} className="rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <MessageSquare className="h-5 w-5 text-highlight flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold">{n.title}</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{n.message}</p>
              {n.from_name && <p className="text-xs text-muted-foreground mt-1">— {n.from_name}</p>}
            </div>
            <div className="ml-auto">
              <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => dismiss(n)}>
                <X className="w-4 h-4 mr-1" /> Dismiss
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}