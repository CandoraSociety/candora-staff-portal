import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { todayISO, WORKSHOP_CATEGORIES } from '@/lib/workshopSchedule';

const COLOR_CHOICES = ['#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2'];

const EMPTY = {
  title: '', description: '',
  facilitator_name: '', facilitator_email: '',
  location: '', capacity: 15,
  date: todayISO(), start_time: '10:00', end_time: '11:30',
  recurrence_pattern: 'none', recurrence_end_date: '',
  status: 'scheduled', color: '#2563eb',
  category: 'none',
};

export default function WorkshopDialog({ open, onClose, onSaved, workshop, preset, user }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) {
      setForm(workshop ? { ...EMPTY, ...workshop } : { ...EMPTY, ...preset });
      setErr('');
    }
  }, [open, workshop, preset]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title?.trim()) { setErr('Title is required'); return; }
    if (!form.date) { setErr('Date is required'); return; }
    if (form.end_time && form.start_time && form.end_time <= form.start_time) {
      setErr('End time must be after start time'); return;
    }
    if (form.recurrence_pattern !== 'none' && form.recurrence_end_date && form.recurrence_end_date < form.date) {
      setErr('Recurrence end date must be on or after the base date'); return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description?.trim() || '',
        facilitator_name: form.facilitator_name?.trim() || '',
        facilitator_email: form.facilitator_email?.trim() || '',
        location: form.location?.trim() || '',
        capacity: Number(form.capacity) || 0,
        date: form.date,
        start_time: form.start_time || '',
        end_time: form.end_time || '',
        recurrence_pattern: form.recurrence_pattern,
        recurrence_end_date: form.recurrence_pattern === 'none' ? '' : (form.recurrence_end_date || ''),
        status: form.status,
        color: form.color,
        category: form.category || 'none',
      };
      if (workshop) {
        await base44.entities.Workshop.update(workshop.id, payload);
      } else {
        payload.created_by_name = user?.full_name || '';
        payload.created_by_email = user?.email || '';
        await base44.entities.Workshop.create(payload);
      }
      onSaved?.();
      onClose?.();
    } catch (e) {
      setErr(e.message || 'Failed to save workshop');
    } finally {
      setSaving(false);
    }
  };

  const fieldCls = "mt-1";
  const recurrenceLabel = { none: 'One-off session', weekly: 'Weekly', biweekly: 'Every 2 weeks', monthly: 'Monthly' };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose?.()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{workshop ? 'Edit Workshop' : (preset?.title ? `New ${preset.title}` : 'New Workshop')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Resume Lab" className={fieldCls} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} className={fieldCls} />
          </div>
          <div>
            <Label>Action-plan category (optional)</Label>
            <select
              value={form.category}
              onChange={e => set('category', e.target.value)}
              className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {WORKSHOP_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <p className="text-[11px] text-muted-foreground mt-0.5">Links this workshop to a client's action-plan item so it gets highlighted in the client file and auto-completed on attendance.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Facilitator name</Label>
              <Input value={form.facilitator_name} onChange={e => set('facilitator_name', e.target.value)} className={fieldCls} />
            </div>
            <div>
              <Label>Facilitator email</Label>
              <Input type="email" value={form.facilitator_email} onChange={e => set('facilitator_email', e.target.value)} className={fieldCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Location</Label>
              <Input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Room / address" className={fieldCls} />
            </div>
            <div>
              <Label>Capacity</Label>
              <Input type="number" min={1} value={form.capacity} onChange={e => set('capacity', e.target.value)} className={fieldCls} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Base date</Label>
              <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={fieldCls} />
            </div>
            <div>
              <Label>Start time</Label>
              <Input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} className={fieldCls} />
            </div>
            <div>
              <Label>End time</Label>
              <Input type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} className={fieldCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Recurrence</Label>
              <select
                value={form.recurrence_pattern}
                onChange={e => set('recurrence_pattern', e.target.value)}
                className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {Object.entries(recurrenceLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <Label>Recurrence ends</Label>
              <Input
                type="date"
                value={form.recurrence_end_date}
                onChange={e => set('recurrence_end_date', e.target.value)}
                disabled={form.recurrence_pattern === 'none'}
                className={fieldCls}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <Label>Color</Label>
              <div className="mt-1 flex flex-wrap gap-1.5 pt-1">
                {COLOR_CHOICES.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set('color', c)}
                    className="w-6 h-6 rounded-full border-2 transition"
                    style={{ background: c, borderColor: form.color === c ? '#1e293b' : 'transparent' }}
                  />
                ))}
              </div>
            </div>
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Saving…' : (workshop ? 'Save changes' : (preset?.title ? `Create ${preset.title}` : 'Create workshop'))}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}