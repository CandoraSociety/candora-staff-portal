import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CaseEventsCalendar from '@/components/rc/CaseEventsCalendar';
import AppointmentDialog from '@/components/rc/AppointmentDialog';

const COLORS = {
  appointment: '#f59e0b', // amber
  deadline: '#ef4444',    // red
  stage: '#3b82f6',        // blue
  milestone: '#22c55e',   // green
};
const dayKey = (d) => new Date(d).toLocaleDateString('en-CA');

const LEGEND = [
  { color: COLORS.appointment, label: 'Appointment' },
  { color: COLORS.deadline, label: 'Deadline' },
  { color: COLORS.stage, label: 'Stage / Goal' },
  { color: COLORS.milestone, label: 'Milestone / Review' },
];

// Per-client calendar inside the intensive case file — one view of this client's
// appointments, workflow stage dates, task deadlines, review dates and follow-ups.
export default function CaseCalendarTab({ clientId, clientName, clientEmail, draft }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: appointments = [] } = useQuery({
    queryKey: ['rc-appointments-client', clientId],
    queryFn: () => base44.entities.RCAppointment.filter({ client_id: clientId }, '-appointment_date'),
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

  const d = draft || {};
  if (d.next_contact_due) events.push({ date: d.next_contact_due, title: 'Next participant contact due', color: COLORS.deadline });
  if (d.next_review_due) events.push({ date: d.next_review_due, title: 'Service plan review due', color: COLORS.deadline });
  (d.stages || []).forEach(s => {
    if (s.start_date) events.push({ date: s.start_date, title: `${s.label} — stage started`, color: COLORS.stage });
    if (s.completed_date) events.push({ date: s.completed_date, title: `${s.label} — stage completed`, color: COLORS.milestone });
  });
  (d.tasks || []).forEach(t => {
    if (t.due_date) events.push({ date: t.due_date, title: `Task due: ${t.title}`, color: COLORS.deadline });
  });
  (d.objectives || []).forEach(o => {
    if (o.target_date) events.push({ date: o.target_date, title: `Goal target: ${(o.text || '').slice(0, 60)}${(o.text || '').length > 60 ? '…' : ''}`, color: COLORS.stage });
  });
  (d.reviews || []).forEach(r => {
    if (r.next_review_date) events.push({ date: r.next_review_date, title: 'Follow-up review scheduled', color: COLORS.milestone });
  });
  (d.followups || []).forEach(f => {
    if (f.date) events.push({ date: f.date, title: 'Post-service follow-up', color: COLORS.milestone });
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          {LEGEND.map(l => (
            <span key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} /> {l.label}
            </span>
          ))}
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