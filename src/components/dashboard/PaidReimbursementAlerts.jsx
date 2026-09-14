import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { BellRing, Banknote, X } from 'lucide-react';

// Green banner on the main Dashboard telling staff when Finance has paid out
// one of their reimbursement requests or MasterCard receipt submissions.
export default function PaidReimbursementAlerts({ user }) {
  const qc = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['dashboardNotifications', user?.email],
    queryFn: () => base44.entities.DashboardNotification.filter({ recipient_email: user?.email }, '-created_date', 50),
    enabled: !!user?.email,
  });

  const mine = notifications.filter(n =>
    !n.is_read &&
    (n.kind === 'reimbursement_paid' || n.kind === 'cc_receipts_paid') &&
    (n.recipient_email || '').toLowerCase() === (user?.email || '').toLowerCase());

  if (!mine.length) return null;

  const dismiss = async (n) => {
    await base44.entities.DashboardNotification.update(n.id, { is_read: true });
    qc.invalidateQueries({ queryKey: ['dashboardNotifications'] });
  };

  return (
    <div className="rounded-2xl border-2 border-success bg-success/10 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <BellRing className="h-5 w-5 text-success animate-pulse" />
        <h2 className="font-bold text-success">
          {mine.length} payment notification{mine.length > 1 ? 's' : ''}
        </h2>
      </div>

      {mine.map(n => (
        <div key={n.id} className="rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <Banknote className="h-5 w-5 text-success" />
            <div>
              <p className="font-semibold">{n.title}</p>
              <p className="text-sm text-muted-foreground">{n.message}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {n.link && (
                <Button size="sm" variant="outline" asChild>
                  <a href={n.link}>View</a>
                </Button>
              )}
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