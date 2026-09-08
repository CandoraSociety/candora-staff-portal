import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Check, ChevronLeft, ClipboardList, Pencil } from 'lucide-react';

const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

// Occurrence dates a recurring session covers (base date stepped by pattern, capped at the repeat-until date)
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

const STATUS_CHOICES = [
  { value: 'present', label: 'Present', active: 'bg-success/15 text-success border-success/40', idle: 'text-muted-foreground' },
  { value: 'absent', label: 'Absent', active: 'bg-destructive/10 text-destructive border-destructive/40', idle: 'text-muted-foreground' },
  { value: 'late', label: 'Late', active: 'bg-warning/10 text-warning border-warning/40', idle: 'text-muted-foreground' },
];

export default function CompleteDateDialog({ session, open, onOpenChange, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [selectedIso, setSelectedIso] = useState(null);
  const [statuses, setStatuses] = useState({});

  const { data: participants = [] } = useQuery({
    queryKey: ['digilit-participants'],
    queryFn: () => base44.entities.DigiLitParticipant.list('-registration_date', 500),
    enabled: open && !!session,
  });

  if (!session) return null;

  const dates = occurrenceDates(session).sort((a, b) => a - b);
  const completed = session.completed_dates || [];
  const attendanceRecords = session.attendance || [];
  const registered = session.registered_participant_ids || [];
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const nameOf = (id) => {
    const p = participants.find((p) => p.id === id);
    return p ? `${p.first_name} ${p.last_name}` : 'Unknown participant';
  };

  const pickDate = (iso) => {
    const existing = attendanceRecords.find((a) => a.date === iso);
    const init = {};
    registered.forEach((id) => { init[id] = existing?.statuses?.[id] || 'present'; });
    setStatuses(init);
    setSelectedIso(iso);
  };

  const setStatus = (id, value) => setStatuses((s) => ({ ...s, [id]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      let myName = '';
      try { const me = await base44.auth.me(); myName = me?.full_name || ''; } catch (e) { /* name stays blank */ }
      const entry = { id: `att-${selectedIso}`, date: selectedIso, statuses, recorded_by_name: myName, recorded_date: new Date().toISOString() };
      await base44.entities.DigiLitSession.update(session.id, {
        attendance: [...attendanceRecords.filter((a) => a.date !== selectedIso), entry],
        completed_dates: [...new Set([...completed, selectedIso])],
      });
      toast({ title: `${fmt(selectedIso)} — attendance saved and date completed` });
      setSelectedIso(null);
      onSaved?.();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setSelectedIso(null); onOpenChange(false); } else onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        {selectedIso ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setSelectedIso(null)}><ChevronLeft className="h-4 w-4" /></Button>
                <DialogTitle>Attendance — {fmt(selectedIso)}</DialogTitle>
              </div>
            </DialogHeader>
            {registered.length === 0 ? (
              <p className="text-sm text-muted-foreground">No participants registered for this session — the date will just be marked completed.</p>
            ) : (
              <div className="max-h-72 overflow-y-auto border rounded-md divide-y">
                {registered.map((id) => (
                  <div key={id} className="px-3 py-2 flex items-center justify-between gap-2">
                    <span className="text-sm truncate">{nameOf(id)}</span>
                    <div className="flex gap-1 shrink-0">
                      {STATUS_CHOICES.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setStatus(id, c.value)}
                          className={`text-xs px-2 py-1 rounded-md border transition-colors ${statuses[id] === c.value ? c.active : `border-transparent ${c.idle} hover:bg-muted`}`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedIso(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save & Complete Date'}</Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader><DialogTitle>Complete a Session Date</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground -mt-1">{session.title} is a recurring session — pick a date, record who attended, and it will be marked completed.</p>
            <div className="max-h-72 overflow-y-auto border rounded-md divide-y">
              {dates.length === 0 && <p className="p-4 text-sm text-muted-foreground text-center">No occurrence dates found.</p>}
              {dates.map((d) => {
                const iso = toIso(d);
                const isDone = completed.includes(iso);
                const record = attendanceRecords.find((a) => a.date === iso);
                const attendedCount = record ? Object.values(record.statuses || {}).filter((s) => s !== 'absent').length : null;
                const isPast = d < today;
                return (
                  <div key={iso} className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm flex items-center gap-2 min-w-0">
                      {isDone && <Check className="h-4 w-4 text-success shrink-0" />}
                      <span className={isDone || isPast ? 'text-muted-foreground' : 'font-medium'}>{fmt(iso)}</span>
                      {attendedCount !== null && <span className="text-xs text-muted-foreground">· {attendedCount} attended</span>}
                    </span>
                    <Button size="sm" variant={record ? 'ghost' : 'outline'} className="shrink-0" onClick={() => pickDate(iso)}>
                      {record ? <><Pencil className="h-3.5 w-3.5" /> Edit</> : <><ClipboardList className="h-3.5 w-3.5" /> Record Attendance</>}
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