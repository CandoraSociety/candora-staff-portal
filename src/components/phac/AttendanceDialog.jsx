import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { sessionOccurrenceDates } from '@/lib/sessionOccurrences';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', active: 'bg-success text-success-foreground' },
  { value: 'absent', label: 'Absent', active: 'bg-destructive text-destructive-foreground' },
  { value: 'late', label: 'Late', active: 'bg-warning text-warning-foreground' },
  { value: 'excused', label: 'Excused', active: 'bg-muted text-muted-foreground' },
];

const fmtDate = (str) => str ? new Date(str + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '';

const familyLabel = (family) => {
  const child = [family.child_first_name, family.child_last_name].filter(Boolean).join(' ') || 'Family';
  return family.parent_guardian_name ? `${child} — ${family.parent_guardian_name}` : child;
};

export default function AttendanceDialog({ open, onOpenChange, session, onSaved }) {
  const { toast } = useToast();
  const [date, setDate] = useState('');
  const [marks, setMarks] = useState({});
  const [saving, setSaving] = useState(false);

  const { data: families = [] } = useQuery({
    queryKey: ['phac-participants'],
    queryFn: () => base44.entities.PHACParticipant.list('child_last_name', 500),
    enabled: open,
  });

  const dates = useMemo(() => sessionOccurrenceDates(session || {}), [session]);

  const participants = useMemo(() => {
    if (!session) return [];
    const rows = [];
    const seen = new Set();
    families
      .filter(f => f.status !== 'withdrawn')
      .forEach(f => {
        if (!f.id || seen.has(f.id)) return;
        seen.add(f.id);
        rows.push({ id: f.id, name: familyLabel(f) });
      });
    // Keep anyone already marked on this session even if their file moved on
    (session.attendance || []).forEach(a => {
      if (!a.participant_id || seen.has(a.participant_id)) return;
      seen.add(a.participant_id);
      rows.push({ id: a.participant_id, name: a.participant_name || 'Family' });
    });
    return rows.sort((a, b) => a.name.localeCompare(b.name));
  }, [families, session]);

  useEffect(() => {
    if (!open || !session) return;
    const list = sessionOccurrenceDates(session);
    const chosen = list.includes(session.session_date) ? list[list.length - 1] : (list[0] || session.session_date);
    setDate(chosen || session.session_date);
  }, [open, session]);

  useEffect(() => {
    if (!session || !date) return;
    const next = {};
    (session.attendance || []).filter(a => a.date === date).forEach(a => {
      if (a.participant_id) next[a.participant_id] = a.status || 'present';
    });
    setMarks(next);
  }, [session, date]);

  const setStatus = (id, status) => setMarks(prev => ({ ...prev, [id]: status }));
  const markAll = (status) => setMarks(Object.fromEntries(participants.map(p => [p.id, status])));

  const handleSave = async () => {
    if (!session) return;
    setSaving(true);
    try {
      const kept = (session.attendance || []).filter(a => a.date !== date);
      const taken = participants
        .filter(p => marks[p.id])
        .map(p => ({ date, participant_id: p.id, participant_name: p.name, status: marks[p.id] }));
      await base44.entities.PHACSession.update(session.id, { attendance: [...kept, ...taken] });
      toast({ title: `Attendance saved for ${fmtDate(date)}` });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Error saving attendance', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!session) return null;

  const counts = STATUS_OPTIONS.map(s => ({ ...s, count: Object.values(marks).filter(v => v === s.value).length }));
  const marked = Object.keys(marks).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attendance — {session.program_name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={date} onValueChange={setDate}>
            <SelectTrigger className="w-full sm:w-72"><SelectValue placeholder="Select date" /></SelectTrigger>
            <SelectContent>
              {dates.map(d => <SelectItem key={d} value={d}>{fmtDate(d)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={() => markAll('present')}>Mark all present</Button>
          <Button size="sm" variant="ghost" onClick={() => setMarks({})}>Clear</Button>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {counts.map(c => <span key={c.value}>{c.label}: <span className="font-semibold text-foreground">{c.count}</span></span>)}
          <span>· {marked} of {participants.length} marked</span>
        </div>

        {participants.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No families are registered yet. Add a family on the Families page and they will show here for marking.
          </p>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border">
            {participants.map(p => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2.5">
                <span className="text-sm text-foreground">{p.name}</span>
                <div className="flex gap-1">
                  {STATUS_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStatus(p.id, option.value)}
                      className={cn(
                        'rounded-md px-2 py-1 text-xs font-medium border transition-colors',
                        marks[p.id] === option.value
                          ? `${option.active} border-transparent`
                          : 'border-border text-muted-foreground hover:bg-muted'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || participants.length === 0}>{saving ? 'Saving...' : 'Save Attendance'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}