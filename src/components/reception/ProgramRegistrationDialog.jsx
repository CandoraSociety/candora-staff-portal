import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { PROGRAM_PORTAL_OPTIONS, REG_STATUS_OPTIONS, ELIGIBILITY_OPTIONS } from '@/lib/receptionConstants';

const EMPTY = { participant_first_name: '', participant_last_name: '', participant_name: '', participant_phone: '', participant_email: '', program_portal: 'ell', program_name: '', registration_date: '', status: 'pending_approval', requires_approval: false, approver_name: '', approver_email: '', approval_notes: '', waitlist_position: 0, eligibility_assessed: false, eligibility_notes: '', eligibility_status: 'not_assessed', accommodation_needs: '', notes: '' };

export default function ProgramRegistrationDialog({ open, onOpenChange, registration, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) setForm(registration ? { ...registration } : { ...EMPTY, registration_date: new Date().toISOString().split('T')[0] });
  }, [open, registration]);

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleNameChange = (field, value) => {
    update(field, value);
    const firstName = field === 'participant_first_name' ? value : form.participant_first_name;
    const lastName = field === 'participant_last_name' ? value : form.participant_last_name;
    update('participant_name', `${firstName} ${lastName}`);
  };

  const handleSave = async () => {
    if (!form.participant_first_name || !form.participant_last_name || !form.program_portal || !form.registration_date) { toast({ title: 'Name, program, and date are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (registration) {
        await base44.entities.ProgramRegistration.update(registration.id, form);
      } else {
        const created = await base44.entities.ProgramRegistration.create(form);
        // Send approval email if needed
        if (form.requires_approval && form.approver_email) {
          try {
            await base44.integrations.Core.SendEmail({
              to: form.approver_email,
              subject: `Program Registration Approval Request — ${form.participant_name}`,
              body: `A new program registration requires your approval.\n\nParticipant: ${form.participant_name}\nProgram: ${PROGRAM_PORTAL_OPTIONS.find(p => p.value === form.program_portal)?.label || form.program_portal}${form.program_name ? ` — ${form.program_name}` : ''}\nRegistration Date: ${form.registration_date}\n${form.participant_phone ? `Phone: ${form.participant_phone}\n` : ''}${form.participant_email ? `Email: ${form.participant_email}\n` : ''}${form.accommodation_needs ? `Accommodation Needs: ${form.accommodation_needs}\n` : ''}${form.notes ? `Notes: ${form.notes}\n` : ''}\nPlease review and approve or decline this registration in the Reception portal.\n\nCandora Reception`
            });
            await base44.entities.ProgramRegistration.update(created.id, { approval_request_sent: true });
          } catch (emailErr) {
            console.error('Failed to send approval email:', emailErr);
          }
        }
      }
      toast({ title: registration ? 'Registration updated' : 'Registration created' });
      onSaved?.();
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{registration ? 'Edit Registration' : 'New Program Registration'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><p className="text-sm font-medium text-foreground mb-1">Participant Information</p></div>
          <div className="space-y-1.5"><Label>First Name *</Label><Input value={form.participant_first_name || ''} onChange={(e) => handleNameChange('participant_first_name', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Last Name *</Label><Input value={form.participant_last_name || ''} onChange={(e) => handleNameChange('participant_last_name', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={form.participant_phone || ''} onChange={(e) => update('participant_phone', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.participant_email || ''} onChange={(e) => update('participant_email', e.target.value)} /></div>
          <div className="col-span-2 mt-1"><p className="text-sm font-medium text-foreground mb-1">Program</p></div>
          <div className="space-y-1.5 col-span-2"><Label>Program Portal *</Label><Select value={form.program_portal} onValueChange={(v) => update('program_portal', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROGRAM_PORTAL_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5 col-span-2"><Label>Program / Cohort Name</Label><Input value={form.program_name || ''} onChange={(e) => update('program_name', e.target.value)} placeholder="e.g. EmpowerU Fall 2026" /></div>
          <div className="space-y-1.5"><Label>Registration Date *</Label><Input type="date" value={form.registration_date || ''} onChange={(e) => update('registration_date', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Status</Label><Select value={form.status || 'pending_approval'} onValueChange={(v) => update('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{REG_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="col-span-2 mt-1"><p className="text-sm font-medium text-foreground mb-1">Approval Workflow</p></div>
          <div className="flex items-center gap-2 col-span-2"><Checkbox id="req-approval" checked={form.requires_approval || false} onCheckedChange={(v) => update('requires_approval', v)} /><label htmlFor="req-approval" className="text-sm cursor-pointer">Requires facilitator/manager approval</label></div>
          {form.requires_approval && (
            <>
              <div className="space-y-1.5"><Label>Approver Name</Label><Input value={form.approver_name || ''} onChange={(e) => update('approver_name', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Approver Email</Label><Input type="email" value={form.approver_email || ''} onChange={(e) => update('approver_email', e.target.value)} /></div>
            </>
          )}
          <div className="space-y-1.5"><Label>Waitlist Position</Label><Input type="number" min="0" value={form.waitlist_position ?? 0} onChange={(e) => update('waitlist_position', parseInt(e.target.value) || 0)} /></div>
          <div className="col-span-2 mt-1"><p className="text-sm font-medium text-foreground mb-1">Eligibility</p></div>
          <div className="space-y-1.5"><Label>Eligibility Status</Label><Select value={form.eligibility_status || 'not_assessed'} onValueChange={(v) => update('eligibility_status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ELIGIBILITY_OPTIONS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="flex items-center gap-2 mt-6"><Checkbox id="elig-assessed" checked={form.eligibility_assessed || false} onCheckedChange={(v) => update('eligibility_assessed', v)} /><label htmlFor="elig-assessed" className="text-sm cursor-pointer">Eligibility assessed</label></div>
          <div className="space-y-1.5 col-span-2"><Label>Eligibility Notes</Label><Textarea value={form.eligibility_notes || ''} onChange={(e) => update('eligibility_notes', e.target.value)} rows={2} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Accommodation Needs</Label><Input value={form.accommodation_needs || ''} onChange={(e) => update('accommodation_needs', e.target.value)} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}