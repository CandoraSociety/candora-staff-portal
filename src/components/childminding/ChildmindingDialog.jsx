import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { PROGRAM_OPTIONS, calculateBilling, RATE_PER_HOUR, BILLING_STATUS_OPTIONS } from '@/lib/childmindingConstants';

const EMPTY = { child_first_name: '', parent_first_name: '', parent_last_name: '', parent_name: '', date: '', hours: 0, program: 'pathways', program_other: '', billing_amount: 0, billing_status: 'unbilled', notes: '' };

export default function ChildmindingDialog({ open, onOpenChange, record, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) setForm(record ? { ...record } : { ...EMPTY, date: new Date().toISOString().split('T')[0] });
  }, [open, record]);

  const update = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      // Auto-calculate billing when program or hours changes
      if (field === 'program' || field === 'hours') {
        next.billing_amount = calculateBilling(next.program, next.hours);
        if (next.program !== 'pathways') next.billing_status = 'n/a';
        else if (next.billing_status === 'n/a') next.billing_status = 'unbilled';
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
    setSaving(true);
    try {
      const data = {
        ...form,
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
          <div className="space-y-1.5"><Label>Hours of Childminding *</Label><Input type="number" min="0" step="0.5" value={form.hours ?? 0} onChange={(e) => update('hours', parseFloat(e.target.value) || 0)} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Program (parent/guardian attending) *</Label><Select value={form.program} onValueChange={(v) => update('program', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROGRAM_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent></Select></div>
          {form.program === 'other' && <div className="space-y-1.5 col-span-2"><Label>Program Name *</Label><Input value={form.program_other || ''} onChange={(e) => update('program_other', e.target.value)} placeholder="Specify program name" /></div>}
          {form.program === 'pathways' && (
            <div className="col-span-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-blue-900">Billing Amount</p><p className="text-xs text-blue-600">${RATE_PER_HOUR}/child/hour × {form.hours || 0} hrs</p></div>
                <p className="text-xl font-bold text-blue-900">${(calculateBilling('pathways', form.hours)).toFixed(2)}</p>
              </div>
              <div className="mt-2"><Label className="text-xs">Billing Status</Label><Select value={form.billing_status || 'unbilled'} onValueChange={(v) => update('billing_status', v)}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent>{BILLING_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
            </div>
          )}
          <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}