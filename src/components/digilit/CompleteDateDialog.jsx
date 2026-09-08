import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Check, ChevronLeft, ClipboardCheck, UserPlus } from 'lucide-react';

const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

// Occurrence dates a session covers (base date stepped by pattern, capped at the repeat-until date)
export function occurrenceDates(session) {
  const base = new Date(session.session_date + 'T00:00:00');
  if (isNaN(base)) return [];
  const end = session.recurrence_end_date ? new Date(session.recurrence_end_date + 'T00:00:00') : null;
  const dates = [];
  let cursor = new Date(base);
  let guard = 0;
  while (guard < 104) {
    if (end && cursor > end) break;
    dates.push(new Date(cursor));
    if (session.recurrence_pattern === 'weekly') cursor = addDays(cursor, 7);
    else if (session.recurrence_pattern === 'biweekly') cursor = addDays(cursor, 14);
    else if (session.recurrence_pattern === 'monthly') { const x = new Date(cursor); x.setMonth(x.getMonth() + 1); cursor = x; }
    else break;
    guard++;
  }
  return dates;
}

const toIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fmt = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

// Same badge language as the Pathways workshop roster
const BADGES = {
  registered: { label: 'Registered', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  present: { label: 'Present', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  attended: { label: 'Attended', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  no_show: { label: 'No-show', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export default function CompleteDateDialog({ session, open, onOpenChange, onSaved, onChanged }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [selectedIso, setSelectedIso] = useState(null);
  const [addId, setAddId] = useState('');

  const { data: participants = [] } = useQuery({
    queryKey: ['digilit-participants'],
    queryFn: () => base44.entities.DigiLitParticipant.list('-registration_date', 500),
    enabled: open && !!session,
  });
  // Work off the freshest cached copy so roster/attendance updates show immediately
  const { data: sessions = [] } = useQuery({
    queryKey: ['digilit-sessions'],
    queryFn: () => base44.entities.DigiLitSession.list('-session_date', 200),
    enabled: open && !!session,
  });
  const s = sessions.find((x) => x.id === session?.id) || session;
  if (!s) return null;

  const isRecurring = s.recurrence_pattern && s.recurrence_pattern !== 'none';
  const dates = occurrenceDates(s).sort((a, b) => a - b);
  const completed = s.completed_dates || [];
  const attendanceRecords = s.attendance || [];
  const registered = s.registered_participant_ids || [];

  const record = selectedIso ? attendanceRecords.find((a) => a.date === selectedIso) : null;
  const isDone = selectedIso ? completed.includes(selectedIso) : false;

  const nameOf = (id) => {
    const p = participants.find((p) => p.id === id);
    return p ? `${p.first_name} ${p.last_name}` : 'Unknown participant';
  };

  const statusOf = (id) => {
    const st = record?.statuses?.[id];
    if (isDone) return st === 'attended' || st === 'no_show' ? st : 'registered';
    return st === 'present' ? 'present' : 'registered';
  };

  // Check-in toggle — persisted right away, like the workshop roster
  const togglePresent = async (id) => {
    if (isDone) return;
    setSaving(true);
    try {
      const statuses = { ...(record?.statuses || {}) };
      if (statuses[id] === 'present') delete statuses[id]; else statuses[id] = 'present';
      const entry = { id: `att-${selectedIso}`, date: selectedIso, statuses, recorded_by_name: record?.recorded_by_name || '' };
      await base44.entities.DigiLitSession.update(s.id, {
        attendance: [...attendanceRecords.filter((a) => a.date !== selectedIso), entry],
      });
      onChanged?.();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const addToRoster = async () => {
    if (!addId) return;
    setSaving(true);
    try {
      await base44.entities.DigiLitSession.update(s.id, { registered_participant_ids: [...registered, addId] });
      toast({ title: `${nameOf(addId)} added to the roster` });
      setAddId('');
      onChanged?.();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  // Complete Session — checked-in → attended, not checked-in → no-show (mirrors the workshop roster flow)
  const completeSession = async () => {
    if (registered.length === 0) { alert('No registered participants to record.'); return; }
    const presentIds = Object.entries(record?.statuses || {}).filter(([, v]) => v === 'present').map(([k]) => k);
    const attended = presentIds.filter((id) => registered.includes(id));
    const noShows = registered.filter((id) => !presentIds.includes(id));
    if (!confirm(
      `Record attendance for this session?\n\n` +
      `• ${attended.length} checked-in → Attended\n` +
      `• ${noShows.length} not checked → No-show`
    )) return;
    setCompleting(true);
    try {
      let myName = '';
      try { const me = await base44.auth.me(); myName = me?.full_name || ''; } catch (_) { /* name stays blank */ }
      const finalStatuses = {};
      registered.forEach((id) => { finalStatuses[id] = presentIds.includes(id) ? 'attended' : 'no_show'; });
      const entry = { id: `att-${selectedIso}`, date: selectedIso, statuses: finalStatuses, recorded_by_name: myName, recorded_date: new Date().toISOString() };
      const payload = {
        attendance: [...attendanceRecords.filter((a) => a.date !== selectedIso), entry],
        completed_dates: [...new Set([...completed, selectedIso])],
      };
      if (!isRecurring) {
        payload.status = 'completed';
        payload.attended_participant_ids = attended;
      }
      await base44.entities.DigiLitSession.update(s.id, payload);
      toast({ title: 'Attendance recorded.', description: `${attended.length} attended, ${noShows.length} no-show.` });
      setSelectedIso(null);
      onSaved?.();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setCompleting(false); }
  };

  const available = participants.filter((p) => !registered.includes(p.id));

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setSelectedIso(null); onOpenChange(false); } else onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {selectedIso ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setSelectedIso(null)}><ChevronLeft className="h-4 w-4" /></Button>
                <DialogTitle>{s.title}</DialogTitle>
              </div>
              <p className="text-sm text-muted-foreground">{fmt(selectedIso)} · {s.start_time}{s.end_time ? `–${s.end_time}` : ''}</p>
            </DialogHeader>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Roster: <span className="font-semibold text-foreground">{registered.length}</span>{s.max_participants ? ` / ${s.max_participants}` : ''}</span>
            </div>
            <p className="text-[11px] text-muted-foreground -mt-1">
              Check the box beside each name as participants arrive. When the session concludes, click <span className="font-semibold text-emerald-700">Complete Session</span> to record attendance.
            </p>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {registered.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">No participants on the roster yet.</p>}
              {registered.map((id) => {
                const st = statusOf(id);
                const badge = BADGES[st];
                return (
                  <div key={id} className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2">
                    <Checkbox
                      checked={st === 'present' || st === 'attended'}
                      disabled={isDone || saving}
                      onCheckedChange={() => togglePresent(id)}
                      className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                    <span className="flex-1 min-w-0 text-sm font-medium truncate">{nameOf(id)}</span>
                    <span className={`text-[10px] font-semibold border rounded px-1.5 py-0.5 ${badge.cls}`}>{badge.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border pt-3 mt-1 space-y-2">
              <p className="text-sm font-semibold flex items-center gap-1.5"><UserPlus className="w-4 h-4" /> Add to roster</p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs">Participant</Label>
                  <Select value={addId} onValueChange={setAddId} disabled={saving || available.length === 0}>
                    <SelectTrigger className="w-full h-9 text-sm"><SelectValue placeholder={available.length === 0 ? 'All participants are on the roster' : 'Select a participant…'} /></SelectTrigger>
                    <SelectContent>
                      {available.map((p) => <SelectItem key={p.id} value={p.id}>{`${p.first_name} ${p.last_name}`}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" className="mt-6" disabled={saving || !addId} onClick={addToRoster}>{saving ? 'Adding…' : 'Add'}</Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                onClick={completeSession}
                disabled={completing || isDone || registered.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <ClipboardCheck className="w-4 h-4" />
                {completing ? 'Recording…' : 'Complete Session'}
              </Button>
              <Button variant="outline" onClick={() => setSelectedIso(null)}>Close</Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader><DialogTitle>Session Roster &amp; Attendance</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground -mt-1">
              {isRecurring
                ? `${s.title} is a recurring session — pick a date to take attendance for just that date.`
                : 'Take attendance for this session, then complete it.'}
            </p>
            <div className="max-h-72 overflow-y-auto border rounded-md divide-y">
              {dates.length === 0 && <p className="p-4 text-sm text-muted-foreground text-center">No occurrence dates found.</p>}
              {dates.map((d) => {
                const iso = toIso(d);
                const done = completed.includes(iso);
                const rec = attendanceRecords.find((a) => a.date === iso);
                const attendedCount = rec ? Object.values(rec.statuses || {}).filter((v) => v === 'attended').length : null;
                const noShowCount = rec ? Object.values(rec.statuses || {}).filter((v) => v === 'no_show').length : null;
                const isPast = d < new Date(new Date().setHours(0, 0, 0, 0));
                return (
                  <div key={iso} className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm flex items-center gap-2 min-w-0">
                      {done && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
                      <span className={done || isPast ? 'text-muted-foreground' : 'font-medium'}>{fmt(iso)}</span>
                      {attendedCount !== null && <span className="text-xs text-muted-foreground">· {attendedCount} attended{noShowCount ? ` · ${noShowCount} no-show` : ''}</span>}
                    </span>
                    <Button size="sm" variant={done ? 'ghost' : 'outline'} className="shrink-0" onClick={() => setSelectedIso(iso)}>
                      {done ? 'View' : <><ClipboardCheck className="h-3.5 w-3.5" /> Record Attendance</>}
                    </Button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}