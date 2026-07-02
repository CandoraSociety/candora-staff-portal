import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Phone } from 'lucide-react';
import { ACCOUNT_SETUP_STATUS_OPTIONS, DEFAULT_SAVINGS_AMOUNT } from '@/lib/empoweruConstants';

export default function AccountSetupDialog({ open, onOpenChange, record, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  const { data: participants = [] } = useQuery({ queryKey: ['empoweru-participants'], queryFn: () => base44.entities.EmpowerUParticipant.list(), enabled: open && !record });
  const { data: cohorts = [] } = useQuery({ queryKey: ['empoweru-cohorts'], queryFn: () => base44.entities.EmpowerUCohort.list(), enabled: open && !record });

  useEffect(() => {
    if (record) setForm({ ...record });
    else setForm({ participant_id: '', participant_name: '', participant_email: '', participant_phone: '', cohort_id: '', cohort_name: '', status: 'not_started', atb_branch_location: '', appointment_date: '', forms_sent_date: '', forms_completed_date: '', account_opened_date: '', savings_amount: DEFAULT_SAVINGS_AMOUNT, atb_contact_name: '', atb_contact_phone: '', atb_contact_email: '', follow_up_attempts: 0, last_contact_attempt_date: '', next_action_date: '', notes: '' });
  }, [open, record]);

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleParticipantChange = (id) => { const p = participants.find(x => x.id === id); update('participant_id', id); update('participant_name', p ? `${p.first_name} ${p.last_name}` : ''); update('participant_email', p?.email || ''); update('participant_phone', p?.phone || ''); };
  const handleCohortChange = (id) => { const c = cohorts.find(x => x.id === id); update('cohort_id', id); update('cohort_name', c?.name || ''); };

  const handleLogContact = async () => {
    if (!record) return;
    try {
      const updated = { ...form, follow_up_attempts: (form.follow_up_attempts || 0) + 1, last_contact_attempt_date: new Date().toISOString() };
      await base44.entities.EmpowerUAccountSetup.update(record.id, { follow_up_attempts: updated.follow_up_attempts, last_contact_attempt_date: updated.last_contact_attempt_date });
      setForm(updated);
      toast({ title: 'Contact attempt logged', description: `${updated.follow_up_attempts} total attempts` });
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };

  const handleSave = async () => {
    if (!form.participant_id || !form.cohort_id) { toast({ title: 'Participant and cohort are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (record) await base44.entities.EmpowerUAccountSetup.update(record.id, form);
      else await base44.entities.EmpowerUAccountSetup.create(form);
      toast({ title: record ? 'Account setup updated' : 'Account setup created' });
      onSaved?.();
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  if (!form) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{record ? 'Edit Account Setup' : 'New Account Setup'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {!record && (
            <>
              <div className="space-y-1.5 col-span-2"><Label>Participant *</Label><Select value={form.participant_id} onValueChange={handleParticipantChange}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{participants.map(p => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5 col-span-2"><Label>Cohort *</Label><Select value={form.cohort_id} onValueChange={handleCohortChange}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{cohorts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            </>
          )}
          {record && (
            <div className="col-span-2 p-3 rounded-lg bg-muted/50">
              <p className="font-medium text-sm">{form.participant_name}</p>
              <p className="text-xs text-muted-foreground">{form.cohort_name}</p>
              <p className="text-xs text-muted-foreground">{form.participant_phone} {form.participant_email ? `· ${form.participant_email}` : ''}</p>
            </div>
          )}
          <div className="space-y-1.5 col-span-2"><Label>Status</Label><Select value={form.status || 'not_started'} onValueChange={(v) => update('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ACCOUNT_SETUP_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>

          {record && (
            <div className="col-span-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-amber-900">Contact Tracking</p><p className="text-xs text-amber-700">Attempts: {form.follow_up_attempts || 0}{form.last_contact_attempt_date ? ` · Last: ${new Date(form.last_contact_attempt_date).toLocaleDateString()}` : ' · Never contacted'}</p></div>
                <Button size="sm" variant="outline" onClick={handleLogContact}><Phone className="h-4 w-4" /> Log Contact</Button>
              </div>
            </div>
          )}
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