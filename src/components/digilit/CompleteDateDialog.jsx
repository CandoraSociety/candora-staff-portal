import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2, Check } from 'lucide-react';

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
const fmt = (d) => d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

export default function CompleteDateDialog({ session, open, onOpenChange, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  if (!session) return null;

  const dates = occurrenceDates(session).sort((a, b) => a - b);
  const completed = session.completed_dates || [];
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const markDate = async (d) => {
    setSaving(true);
    try {
      await base44.entities.DigiLitSession.update(session.id, { completed_dates: [...new Set([...completed, toIso(d)])] });
      toast({ title: `${fmt(d)} marked completed` });
      onSaved?.();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Complete a Session Date</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground -mt-1">{session.title} is a recurring session — completion is tracked per date.</p>
        <div className="max-h-72 overflow-y-auto border rounded-md divide-y">
          {dates.length === 0 && <p className="p-4 text-sm text-muted-foreground text-center">No occurrence dates found.</p>}
          {dates.map((d, i) => {
            const isDone = completed.includes(toIso(d));
            const isPast = d < today;
            return (
              <div key={i} className="flex items-center justify-between px-3 py-2">
                <span className="text-sm flex items-center gap-2">
                  {isDone && <Check className="h-4 w-4 text-success" />}
                  <span className={isDone || isPast ? 'text-muted-foreground' : 'font-medium'}>{fmt(d)}</span>
                </span>
                {isDone ? (
                  <span className="text-xs text-success font-medium">Completed</span>
                ) : (
                  <Button size="sm" variant="outline" disabled={saving} onClick={() => markDate(d)}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark completed
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}