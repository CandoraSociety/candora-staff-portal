import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Siren, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/rc/StatusBadge';
import UrgentAlertDialog from '@/components/reception/UrgentAlertDialog';
import { URGENCY_OPTIONS, URGENCY_LABELS, RECIPIENT_TYPE_LABELS } from '@/lib/receptionConstants';
import { useAuth } from '@/lib/AuthContext';

export default function ReceptionUrgentAlerts() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user } = useAuth();

  const { data: alerts = [], isLoading } = useQuery({ queryKey: ['urgent-alerts'], queryFn: () => base44.entities.UrgentAlert.list('-sent_date', 100) });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Urgent Alerts</h1><p className="text-muted-foreground text-sm mt-1">Send and track urgent messages to staff</p></div>
        <Button variant="destructive" onClick={() => setDialogOpen(true)}><Siren className="h-4 w-4" /> New Alert</Button>
      </div>
      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> :
       alerts.length === 0 ? <Card><CardContent className="p-8 text-center"><Siren className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><p className="text-muted-foreground">No urgent alerts sent yet</p></CardContent></Card> :
      (
        <div className="space-y-3">
          {alerts.map(a => {
            const urgency = URGENCY_OPTIONS.find(u => u.value === a.urgency_level);
            return (
              <Card key={a.id} className={a.urgency_level === 'critical' ? 'border-red-300' : a.urgency_level === 'urgent' ? 'border-amber-300' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: (urgency?.color || '#64748b') + '20' }}><Siren className="h-4 w-4" style={{ color: urgency?.color || '#64748b' }} /></div>
                      <div><p className="font-medium text-sm text-foreground">{a.title}</p><p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {a.sent_date ? new Date(a.sent_date).toLocaleString() : ''}</p></div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: (urgency?.color || '#64748b') + '20', color: urgency?.color || '#64748b' }}>{URGENCY_LABELS[a.urgency_level]}</span>
                  </div>
                  <p className="text-sm text-foreground mb-2">{a.message}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>From: {a.sent_by_name}</span>
                    <span>To: {RECIPIENT_TYPE_LABELS[a.recipient_type] || a.recipient_type}{a.recipient_names?.length > 0 ? ` (${a.recipient_names.length})` : ''}</span>
                  </div>
                  {a.recipient_names && a.recipient_names.length > 0 && a.recipient_names.length <= 10 && (
                    <div className="flex flex-wrap gap-1 mt-2">{a.recipient_names.map((n, i) => <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{n}</span>)}</div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <UrgentAlertDialog open={dialogOpen} onOpenChange={setDialogOpen} currentUser={user} onSaved={() => setDialogOpen(false)} />
    </div>
  );
}