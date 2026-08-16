import { useState, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { todayISO, formatDateLong } from '@/lib/workshopSchedule';
import { syncSessionCompletionToRoadmap } from '@/lib/workshopCompletion';
import { UserMinus, UserPlus, Users, ClipboardCheck } from 'lucide-react';

const STATUS_META = {
  registered: { label: 'Registered', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  attended: { label: 'Attended', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
  no_show: { label: 'No-show', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};

// Present (arrival) is a separate concept from the final 'attended' outcome.
// While still 'registered', a checked present box shows as "Present".
function badgeFor(s) {
  if (s.present && s.status === 'registered') return { label: 'Present', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
  return STATUS_META[s.status] || STATUS_META.registered;
}

export default function SessionRosterDialog({ open, onClose, workshop, sessionDate, signups, clients, onChanged }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [completing, setCompleting] = useState(false);

  const sessionSignups = useMemo(
    () => (signups || []).filter(s => s.workshop_id === workshop?.id && s.session_date === sessionDate),
    [signups, workshop, sessionDate]
  );

  const activeCount = sessionSignups.filter(s => s.status === 'registered' || s.status === 'attended').length;
  const capacity = workshop?.capacity || 0;
  const full = capacity > 0 && activeCount >= capacity;

  const reset = () => { setName(''); setEmail(''); };

  const addAttendee = async (e) => {
    e?.preventDefault();
    if (!name.trim()) return;
    if (full) return;
    setAdding(true);
    try {
      const matched = (clients || []).find(c =>
        `${c.first_name} ${c.last_name}`.toLowerCase() === name.trim().toLowerCase()
      );
      await base44.entities.WorkshopSignup.create({
        workshop_id: workshop.id,
        session_date: sessionDate,
        client_id: matched?.id || '',
        attendee_name: name.trim(),
        attendee_email: email.trim() || matched?.email || '',
        signup_date: todayISO(),
        status: 'registered',
        present: false,
      });
      reset();
      onChanged?.();
    } catch (err) {
      alert('Could not add attendee: ' + (err.message || 'Unknown error'));
    } finally {
      setAdding(false);
    }
  };

  const togglePresent = async (signup) => {
    try {
      await base44.entities.WorkshopSignup.update(signup.id, { present: !signup.present });
      onChanged?.();
    } catch (err) {
      alert('Could not update: ' + (err.message || 'Unknown error'));
    }
  };

  const setStatus = async (signup, status) => {
    try {
      await base44.entities.WorkshopSignup.update(signup.id, { status });
      onChanged?.();
    } catch (err) {
      alert('Could not update: ' + (err.message || 'Unknown error'));
    }
  };

  const remove = async (signup) => {
    if (!confirm(`Remove ${signup.attendee_name} from this session?`)) return;
    try {
      await base44.entities.WorkshopSignup.delete(signup.id);
      onChanged?.();
    } catch (err) {
      alert('Could not remove: ' + (err.message || 'Unknown error'));
    }
  };

  // Complete Session — the facilitator clicks this once the class concludes:
  //   present → 'attended', registered-not-present → 'no_show',
  //   then WD/DEA clients who attended get the matching EDA marked complete.
  const completeSession = async () => {
    const pending = sessionSignups.filter(s => s.status === 'registered');
    if (pending.length === 0) { alert('No registered attendees to record.'); return; }
    const presentCount = pending.filter(s => s.present).length;
    if (!confirm(
      `Record attendance for this session?\n\n` +
      `• ${presentCount} checked-in → Attended\n` +
      `• ${pending.length - presentCount} not checked → No-show\n` +
      `WD/DEA clients who attended will have the matching EDA marked complete in their progress tab and action plan.`
    )) return;
    setCompleting(true);
    try {
      const attendedCount = pending.filter(s => s.present).length;
      const updates = pending.map(s => ({ id: s.id, status: s.present ? 'attended' : 'no_show' }));
      await base44.entities.WorkshopSignup.bulkUpdate(updates);
      let syncResult = null;
      try { syncResult = await syncSessionCompletionToRoadmap(workshop.id, sessionDate); } catch (_) {}
      // Record on the CRT Deliverables sheet: +1 Workshops Delivered, +attended Clients Attended.
      let delivResult = null;
      try {
        delivResult = await base44.functions.invoke('syncWorkshopDeliverablesToCrt', { sessionDate, attendedCount, workshopTitle: workshop?.title });
      } catch (_) {}
      onChanged?.();
      onClose?.();
      const bits = ['Attendance recorded.'];
      if (syncResult?.updated) bits.push(`${syncResult.updated} EDA(s) marked complete.`);
      const dv = delivResult?.data;
      if (dv?.status === 'success') bits.push(`CRT Deliverables updated (${dv.workshopsDelivered} delivered, ${dv.clientsAttended} attended).`);
      else if (dv && dv.status !== 'success') bits.push(`Deliverables: ${dv.message || dv.status}.`);
      alert(bits.join(' '));
    } catch (e) {
      alert('Could not complete session: ' + (e.message || 'Unknown error'));
    } finally {
      setCompleting(false);
    }
  };

  const clientOptions = (clients || [])
    .filter(c => c.first_name || c.last_name)
    .map(c => `${c.first_name} ${c.last_name}`.trim())
    .sort();

  const hasPending = sessionSignups.some(s => s.status === 'registered');

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose?.()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {workshop?.title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{formatDateLong(sessionDate)} · {workshop?.start_time}–{workshop?.end_time}</p>
          {workshop?.location && <p className="text-xs text-muted-foreground">{workshop.location}</p>}
        </DialogHeader>

        <div className="flex items-center justify-between text-xs text-muted-foreground py-1">
          <span>Roster: <span className="font-semibold text-foreground">{activeCount}</span>{capacity > 0 ? ` / ${capacity}` : ''}</span>
          {full && <span className="text-red-600 font-medium">Full</span>}
        </div>

        <p className="text-[11px] text-muted-foreground -mt-1">
          Check the box beside each name as clients arrive. When the class concludes, click <span className="font-semibold text-emerald-700">Complete Session</span> to record attendance.
        </p>

        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {(() => {
            const clientsById = {};
            (clients || []).forEach(c => { if (c.id) clientsById[c.id] = c; });
            const isPathways = (s) => {
              if (!s.client_id) return false;
              const c = clientsById[s.client_id];
              return c && (c.service_type === 'pathways' || c.service_type === 'direct_to_employment');
            };
            const pathways = sessionSignups.filter(isPathways);
            const others = sessionSignups.filter(s => !isPathways(s));
            if (sessionSignups.length === 0) return <p className="text-center text-sm text-muted-foreground py-6">No sign-ups yet for this session.</p>;
            const renderRow = (s) => {
              const badge = badgeFor(s);
              const c = s.client_id ? clientsById[s.client_id] : null;
              const locked = s.status === 'attended' || s.status === 'no_show' || s.status === 'cancelled';
              return (
                <div key={s.id} className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2">
                  <Checkbox
                    checked={!!s.present || s.status === 'attended'}
                    disabled={locked}
                    onCheckedChange={() => togglePresent(s)}
                    className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate flex items-center gap-1.5">
                      {s.attendee_name}
                      {c?.service_type === 'pathways' && <span className="text-[9px] font-bold bg-purple-100 text-purple-700 px-1 py-px rounded">WD</span>}
                      {c?.service_type === 'direct_to_employment' && <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1 py-px rounded">DEA</span>}
                    </p>
                    {s.attendee_email && <p className="text-xs text-muted-foreground truncate">{s.attendee_email}</p>}
                  </div>
                  <span className={`text-[10px] font-semibold border rounded px-1.5 py-0.5 ${badge.cls}`}>{badge.label}</span>
                  <div className="flex items-center gap-0.5">
                    <button title="Cancel registration" onClick={() => setStatus(s, 'cancelled')}
                      className="p-1 rounded hover:bg-slate-100 text-slate-500"><UserMinus className="w-3.5 h-3.5" /></button>
                    <button title="Remove" onClick={() => remove(s)}
                      className="p-1 rounded hover:bg-red-50 text-red-500"><TrashIcon /></button>
                  </div>
                </div>
              );
            };
            return (
              <>
                {pathways.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Pathways Clients (WD / DEA)</p>
                    <div className="space-y-1.5">{pathways.map(renderRow)}</div>
                  </div>
                )}
                {others.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Other Participants</p>
                    <div className="space-y-1.5">{others.map(renderRow)}</div>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        <form onSubmit={addAttendee} className="space-y-2 border-t border-border pt-3 mt-1">
          <p className="text-sm font-semibold flex items-center gap-1.5"><UserPlus className="w-4 h-4" /> Add to roster</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Name</Label>
              <Input
                list="ws-client-list"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Attendee name"
                disabled={full || adding}
              />
              <datalist id="ws-client-list">
                {clientOptions.map((n, i) => <option key={i} value={n} />)}
              </datalist>
            </div>
            <div>
              <Label className="text-xs">Email (optional)</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={full || adding} />
            </div>
          </div>
          <Button type="submit" size="sm" disabled={full || adding || !name.trim()} className="w-full">
            {adding ? 'Adding…' : 'Add attendee'}
          </Button>
        </form>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            onClick={completeSession}
            disabled={completing || !hasPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <ClipboardCheck className="w-4 h-4" />
            {completing ? 'Recording…' : 'Complete Session'}
          </Button>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}