import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, X } from 'lucide-react';

// Handouts a facilitator shared for a training day. The file itself is stored
// privately, so opening one asks for a short-lived signed URL first.
export default function TrainingMaterialAlerts({ user }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState('');

  const { data: notifications = [] } = useQuery({
    queryKey: ['trainingMaterialNotifications', user?.email],
    queryFn: () => base44.entities.DashboardNotification.filter({ recipient_email: user?.email }, '-created_date', 30),
    enabled: !!user?.email,
  });

  const mine = notifications.filter(n =>
    !n.is_read &&
    n.kind === 'training_material' &&
    (n.recipient_email || '').toLowerCase() === (user?.email || '').toLowerCase());

  if (!mine.length) return null;

  const dismiss = async (n) => {
    await base44.entities.DashboardNotification.update(n.id, { is_read: true });
    qc.invalidateQueries({ queryKey: ['trainingMaterialNotifications'] });
  };

  const openFile = async (n) => {
    setBusy(n.id);
    try {
      const res = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: n.link, expires_in: 3600 });
      if (res?.signed_url) window.open(res.signed_url, '_blank', 'noopener');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="rounded-2xl border-2 border-accent bg-accent/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-accent" />
        <h2 className="font-bold text-foreground">
          {mine.length} training handout{mine.length > 1 ? 's' : ''} shared with you
        </h2>
      </div>

      {mine.map(n => (
        <div key={n.id} className="rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="min-w-0">
              <p className="font-semibold">{n.title}</p>
              <p className="text-sm text-muted-foreground">{n.message}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={busy === n.id} onClick={() => openFile(n)}>
                {busy === n.id ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <FileText className="w-4 h-4 mr-1.5" />}
                Open handout
              </Button>
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