import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import moment from 'moment-timezone';
import { AB_TIME_ZONE } from '@/lib/abTime';
import { MessageSquare, X } from 'lucide-react';

// Messages the front desk left for this staff member — someone came to see
// them, a question came up, something to follow up on.
export default function ReceptionMessageAlerts({ user }) {
  const qc = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['receptionMessageNotifications', user?.email],
    queryFn: () => base44.entities.DashboardNotification.filter({ recipient_email: user?.email }, '-created_date', 30),
    enabled: !!user?.email,
  });

  const mine = notifications.filter(n =>
    !n.is_read &&
    n.kind === 'reception_message' &&
    (n.recipient_email || '').toLowerCase() === (user?.email || '').toLowerCase());

  if (!mine.length) return null;

  const dismiss = async (n) => {
    await base44.entities.DashboardNotification.update(n.id, { is_read: true });
    qc.invalidateQueries({ queryKey: ['receptionMessageNotifications'] });
  };

  return (
    <div className="rounded-2xl border-2 border-primary bg-primary/10 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h2 className="font-bold text-foreground">
          {mine.length} message{mine.length > 1 ? 's' : ''} from the front desk
        </h2>
      </div>

      {mine.map(n => (
        <div key={n.id} className="rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
            <div className="min-w-0">
              <p className="font-semibold">{n.title}</p>
              <p className="text-sm text-foreground whitespace-pre-line mt-1">{n.message}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {n.from_name ? `${n.from_name} at the front desk · ` : ''}
                {n.created_date ? moment.utc(n.created_date).tz(AB_TIME_ZONE).format('ddd, MMM D · h:mm a [ABT]') : ''}
              </p>
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