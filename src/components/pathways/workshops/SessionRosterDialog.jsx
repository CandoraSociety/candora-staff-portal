import { useState, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { todayISO, formatDateLong } from '@/lib/workshopSchedule';
import { Check, X, UserMinus, UserPlus, Users } from 'lucide-react';

const STATUS_META = {
  registered: { label: 'Registered', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  attended: { label: 'Attended', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
  no_show: { label: 'No-show', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export default function SessionRosterDialog({ open, onClose, workshop, sessionDate, signups, clients, onChanged }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);

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
      // match a client by name if typed exactly
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
      });
      reset();
      onChanged?.();
    } catch (err) {
      alert('Could not add attendee: ' + (err.message || 'Unknown error'));
    } finally {
      setAdding(false);
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

  const clientOptions = (clients || [])
    .filter(c => c.first_name || c.last_name)
    .map(c => `${c.first_name} ${c.last_name}`.trim())
    .sort();

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

        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {sessionSignups.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">No sign-ups yet for this session.</p>
          ) : sessionSignups.map(s => {
            const meta = STATUS_META[s.status] || STATUS_META.registered;
            return (
              <div key={s.id} className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.attendee_name}</p>
                  {s.attendee_email && <p className="text-xs text-muted-foreground truncate">{s.attendee_email}</p>}
                </div>
                <span className={`text-[10px] font-semibold border rounded px-1.5 py-0.5 ${meta.cls}`}>{meta.label}</span>
                <div className="flex items-center gap-0.5">
                  <button title="Mark attended" onClick={() => setStatus(s, 'attended')}
                    className="p-1 rounded hover:bg-emerald-50 text-emerald-600"><Check className="w-3.5 h-3.5" /></button>
                  <button title="Mark no-show" onClick={() => setStatus(s, 'no_show')}
                    className="p-1 rounded hover:bg-amber-50 text-amber-600"><X className="w-3.5 h-3.5" /></button>
                  <button title="Cancel registration" onClick={() => setStatus(s, 'cancelled')}
                    className="p-1 rounded hover:bg-slate-100 text-slate-500"><UserMinus className="w-3.5 h-3.5" /></button>
                  <button title="Remove" onClick={() => remove(s)}
                    className="p-1 rounded hover:bg-red-50 text-red-500"><TrashIcon /></button>
                </div>
              </div>
            );
          })}
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

        <DialogFooter>
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