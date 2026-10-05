import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ACCOUNT_SETUP_STATUS_OPTIONS, ACCOUNT_SETUP_STATUS_DATE_FIELDS, DEFAULT_SAVINGS_AMOUNT } from '@/lib/empoweruConstants';

// Edits an existing account setup record. Records are created automatically
// when a participant is enrolled in a cohort — there is no manual add.
export default function AccountSetupDialog({ open, onOpenChange, record, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (record) setForm({ ...record });
  }, [open, record]);

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleStatusChange = (v) => setForm(p => {
    const next = { ...p, status: v };
    const dateField = ACCOUNT_SETUP_STATUS_DATE_FIELDS[v];
    if (dateField && !next[dateField]) next[dateField] = new Date().toISOString().slice(0, 10);
    return next;
  });

  const handleSave = async () => {
    if (!record || !form) return;
    setSaving(true);
    try {
      await base44.entities.EmpowerUAccountSetup.update(record.id, form);
      toast({ title: 'Account setup updated' });
      onSaved?.();
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  if (!record || !form) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Account Setup</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 p-3 rounded-lg bg-muted/50">
            <p className="font-medium text-sm">{form.participant_name}</p>
            <p className="text-xs text-muted-foreground">{form.cohort_name}</p>
            <p className="text-xs text-muted-foreground">{form.participant_phone} {form.participant_email ? `· ${form.participant_email}` : ''}</p>
          </div>
          <div className="space-y-1.5 col-span-2"><Label>Status</Label><Select value={form.status || 'not_started'} onValueChange={handleStatusChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ACCOUNT_SETUP_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>

          <div className="space-y-1.5"><Label>Next Action Date</Label><Input type="date" value={form.next_action_date || ''} onChange={(e) => update('next_action_date', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Savings Amount ($)</Label><Input type="number" value={form.savings_amount ?? DEFAULT_SAVINGS_AMOUNT} onChange={(e) => update('savings_amount', parseFloat(e.target.value) || 0)} /></div>
          <div className="col-span-2 mt-1"><p className="text-sm font-medium text-foreground">ATB Appointment</p></div>
          <div className="space-y-1.5"><Label>Appointment Date</Label><Input type="datetime-local" value={form.appointment_date ? form.appointment_date.slice(0, 16) : ''} onChange={(e) => update('appointment_date', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>ATB Branch</Label><Input value={form.atb_branch_location || ''} onChange={(e) => update('atb_branch_location', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>ATB Contact Name</Label><Input value={form.atb_contact_name || ''} onChange={(e) => update('atb_contact_name', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>ATB Contact Phone</Label><Input value={form.atb_contact_phone || ''} onChange={(e) => update('atb_contact_phone', e.target.value)} /></div>
          <div className="space-y-1.5 col-span-2"><Label>ATB Contact Email</Label><Input type="email" value={form.atb_contact_email || ''} onChange={(e) => update('atb_contact_email', e.target.value)} /></div>
          <div className="col-span-2 mt-1"><p className="text-sm font-medium text-foreground">Forms Tracking</p></div>
          <div className="space-y-1.5"><Label>Forms Sent Date</Label><Input type="date" value={form.forms_sent_date || ''} onChange={(e) => update('forms_sent_date', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Forms Completed Date</Label><Input type="date" value={form.forms_completed_date || ''} onChange={(e) => update('forms_completed_date', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Account Opened Date</Label><Input type="date" value={form.account_opened_date || ''} onChange={(e) => update('account_opened_date', e.target.value)} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}