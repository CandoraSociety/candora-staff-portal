import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CaseEventsCalendar from '@/components/rc/CaseEventsCalendar';
import AppointmentDialog from '@/components/rc/AppointmentDialog';

const COLORS = { appointment: '#f59e0b', followup: '#ef4444' };
const dayKey = (d) => new Date(d).toLocaleDateString('en-CA');

// Per-client calendar for General Clients — this client's appointments and any
// follow-up dates flagged on their logged interactions.
export default function GeneralClientCalendar({ clientId, clientName, clientEmail }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: appointments = [] } = useQuery({
    queryKey: ['rc-appointments-client', clientId],
    queryFn: () => base44.entities.RCAppointment.filter({ client_id: clientId }, '-appointment_date'),
    enabled: !!clientId,
  });
  const { data: logs = [] } = useQuery({
    queryKey: ['rc-service-logs', clientId],
    queryFn: () => base44.entities.RCServiceLog.filter({ client_id: clientId }, '-service_date', 200),
    enabled: !!clientId,
  });

  const events = [];
  (appointments || []).forEach(a => {
    if (!a.appointment_date) return;
    events.push({
      date: dayKey(a.appointment_date),
      title: `Appointment${a.status && a.status !== 'scheduled' ? ` — ${a.status.replace('_', ' ')}` : ''}`,
      detail: [
        new Date(a.appointment_date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
        a.purpose, a.location_detail,
      ].filter(Boolean).join(' · '),
      color: COLORS.appointment,
    });
  });
  (logs || []).forEach(l => {
    if (l.follow_up_needed && l.follow_up_date) {
      events.push({ date: l.follow_up_date, title: 'Follow-up due', detail: l.description || '', color: COLORS.followup });
    }
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.appointment }} /> Appointment</span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.followup }} /> Follow-up due</span>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Schedule Appointment
        </Button>
      </div>
      <CaseEventsCalendar events={events} />
      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clientId={clientId}
        clientName={clientName}
        clientEmail={clientEmail}
        onSaved={() => {
          setDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: ['rc-appointments-client', clientId] });
          queryClient.invalidateQueries({ queryKey: ['rc-appointments'] });
        }}
      />
    </div>
  );
}