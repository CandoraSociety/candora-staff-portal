import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { PROGRAM_OPTIONS, calculateBilling, RATE_PER_HOUR } from '@/lib/childmindingConstants';

const EMPTY = { child_first_name: '', parent_first_name: '', parent_last_name: '', parent_name: '', date: '', check_in_time: '', check_out_time: '', hours: 0, program: 'pathways', program_other: '', billing_amount: 0, billing_status: 'unbilled', notes: '', session_id: '' };

// Hours from check-in/out times, rounded UP to the nearest 15-minute increment.
function calcHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) return null;
  const [ih, im] = checkIn.split(':').map(Number);
  const [oh, om] = checkOut.split(':').map(Number);
  let mins = (oh * 60 + om) - (ih * 60 + im);
  if (mins <= 0) return 0;
  mins = Math.ceil(mins / 15) * 15;
  return mins / 60;
}

function formatHours(h) {
  if (!h) return '0m';
  const totalMin = Math.round(h * 60);
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  if (hh && mm) return `${hh}h ${mm}m`;
  if (hh) return `${hh}h`;
  return `${mm}m`;
}

export default function ChildmindingDialog({ open, onOpenChange, record, onSaved, sessionId, presetDate }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) {
      if (record) setForm({ ...record });
      else setForm({ ...EMPTY, date: presetDate || new Date().toISOString().split('T')[0], session_id: sessionId || '' });
    }
  }, [open, record, sessionId, presetDate]);

  const update = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      // Auto-calculate hours from check-in/out times (rounded up to 15 min)
      if (field === 'check_in_time' || field === 'check_out_time') {
        const h = calcHours(next.check_in_time, next.check_out_time);
        if (h !== null) next.hours = h;
      }
      // Auto-calculate billing when program or hours change
      if (field === 'program' || field === 'check_in_time' || field === 'check_out_time') {
        next.billing_amount = calculateBilling(next.program, next.hours);
      }
      // Auto-fill parent_name
      if (field === 'parent_first_name' || field === 'parent_last_name') {
        next.parent_name = `${field === 'parent_first_name' ? value : next.parent_first_name} ${field === 'parent_last_name' ? value : next.parent_last_name}`.trim();
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.child_first_name || !form.parent_first_name || !form.parent_last_name || !form.date || !form.program) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    if (form.program === 'other' && !form.program_other) {
      toast({ title: 'Please specify the program name', variant: 'destructive' });
      return;
    }
    if (!record && (!form.check_in_time || !form.check_out_time)) {
      toast({ title: 'Please enter check-in and check-out times', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...form,
        session_id: sessionId || form.session_id || '',
        parent_name: `${form.parent_first_name} ${form.parent_last_name}`.trim(),
        billing_amount: calculateBilling(form.program, form.hours),
      };
      if (record) await base44.entities.ChildmindingRecord.update(record.id, data);
      else await base44.entities.ChildmindingRecord.create(data);
      toast({ title: record ? 'Record updated' : 'Record created' });
      onSaved?.();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{record ? 'Edit Childminding Record' : 'New Childminding Intake'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2"><Label>Child's First Name *</Label><Input value={form.child_first_name || ''} onChange={(e) => update('child_first_name', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Parent/Guardian First Name *</Label><Input value={form.parent_first_name || ''} onChange={(e) => update('parent_first_name', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Parent/Guardian Last Name *</Label><Input value={form.parent_last_name || ''} onChange={(e) => update('parent_last_name', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Date *</Label><Input type="date" value={form.date || ''} onChange={(e) => update('date', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Check In Time *</Label><Input type="time" value={form.check_in_time || ''} onChange={(e) => update('check_in_time', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Check Out Time *</Label><Input type="time" value={form.check_out_time || ''} onChange={(e) => update('check_out_time', e.target.value)} /></div>
          <div className="col-span-2 text-xs text-muted-foreground -mt-1">Calculated hours: <span className="font-medium text-foreground">{form.check_in_time && form.check_out_time ? `${formatHours(form.hours)} (${form.hours} hrs)` : '—'}</span></div>
          <div className="space-y-1.5 col-span-2"><Label>Program (parent/guardian attending) *</Label><Select value={form.program} onValueChange={(v) => update('program', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROGRAM_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent></Select></div>
          {form.program === 'other' && <div className="space-y-1.5 col-span-2"><Label>Program Name *</Label><Input value={form.program_other || ''} onChange={(e) => update('program_other', e.target.value)} placeholder="Specify program name" /></div>}
          {form.program === 'pathways' && (
            <div className="col-span-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-blue-900">Billing Amount</p><p className="text-xs text-blue-600">${RATE_PER_HOUR}/child/hour × {form.hours || 0} hrs</p></div>
                <p className="text-xl font-bold text-blue-900">${(calculateBilling('pathways', form.hours)).toFixed(2)}</p>
              </div>
            </div>
          )}
          <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}