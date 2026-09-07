import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { today } from '@/components/rc/intensive/caseConstants';

export const NEED_CATEGORY_OPTIONS = [
  { value: 'food_security', label: 'Food Security' },
  { value: 'housing', label: 'Housing' },
  { value: 'employment_income', label: 'Employment / Income' },
  { value: 'childcare', label: 'Child Care' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'mental_health', label: 'Mental Health' },
  { value: 'physical_health', label: 'Physical Health' },
  { value: 'documentation_id', label: 'Documentation / ID' },
  { value: 'family_support', label: 'Family Support / Parenting' },
  { value: 'finances', label: 'Finances' },
  { value: 'social_isolation', label: 'Social Isolation' },
  { value: 'other', label: 'Other' },
];

export const NEED_STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'addressed', label: 'Addressed' },
];

export const NEED_PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const EMPTY = {
  category: '', category_other: '', description: '',
  priority: 'medium', status: 'open', date_identified: '', notes: '',
};

// Lightweight structured assessment item for General Clients — one need / barrier.
export default function NeedBarrierDialog({ open, onOpenChange, clientId, clientName, record, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) {
      setForm(record ? {
        category: record.category || '',
        category_other: record.category_other || '',
        description: record.description || '',
        priority: record.priority || 'medium',
        status: record.status || 'open',
        date_identified: record.date_identified || today(),
        notes: record.notes || '',
      } : { ...EMPTY, date_identified: today() });
    }
  }, [open, record]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.category) {
      toast({ title: 'Category is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, client_id: clientId, client_name: clientName };
      if (record?.id) {
        await base44.entities.RCClientNeed.update(record.id, payload);
        toast({ title: 'Need / barrier updated' });
      } else {
        await base44.entities.RCClientNeed.create(payload);
        toast({ title: 'Need / barrier added' });
      }
      onSaved?.();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{record?.id ? 'Edit Need / Barrier' : 'Add Need / Barrier'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Category *</Label>
            <Select value={form.category || ''} onValueChange={(v) => update('category', v)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>{NEED_CATEGORY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Date Identified</Label>
            <Input type="date" value={form.date_identified || ''} onChange={(e) => update('date_identified', e.target.value)} />
          </div>
          {form.category === 'other' && (
            <div className="space-y-1.5 col-span-2"><Label>Specify Other Category</Label>
              <Input value={form.category_other || ''} onChange={(e) => update('category_other', e.target.value)} />
            </div>
          )}
          <div className="space-y-1.5"><Label>Priority</Label>
            <Select value={form.priority || 'medium'} onValueChange={(v) => update('priority', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{NEED_PRIORITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Status</Label>
            <Select value={form.status || 'open'} onValueChange={(v) => update('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{NEED_STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 col-span-2"><Label>Description</Label>
            <Textarea value={form.description || ''} onChange={(e) => update('description', e.target.value)} rows={2} placeholder="What is the need or barrier, in plain language" />
          </div>
          <div className="space-y-1.5 col-span-2"><Label>Notes</Label>
            <Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} placeholder="Context, actions taken, referrals made" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}