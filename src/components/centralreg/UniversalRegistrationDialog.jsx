import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { REG_AREA_LABELS, VOLUNTEER_TYPE_OPTIONS, today } from '@/lib/centralRegConstants';

const EMPTY = { first_name: '', last_name: '', phone: '', email: '', notes: '', parent_guardian_name: '', parent_guardian_phone: '', parent_guardian_email: '', volunteer_type: 'community', waitlist: false };

// Registers a person into the SAME records their portal uses, so both places
// always show the same registration. Writes per area:
//  community → CommunityParticipant + CommunityRegistration
//  empoweru  → EmpowerUParticipant + EmpowerURegistration (auto-waitlist when the cohort is full)
//  phac      → PHACParticipant (child + parent/guardian)
//  ell       → ELLLearner (prospective)
//  digilit   → DigiLitParticipant
//  volunteer → Volunteer (pending application)
export default function UniversalRegistrationDialog({ open, onOpenChange, area, program, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) setForm({ ...EMPTY });
  }, [open]);

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const programLabel = program?.name || (area ? REG_AREA_LABELS[area] : '');

  const handleSave = async () => {
    if (!form.first_name || !form.last_name) { toast({ title: 'First and last name are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const name = `${form.first_name} ${form.last_name}`;
      if (area === 'community') {
        const participant = await base44.entities.CommunityParticipant.create({ first_name: form.first_name, last_name: form.last_name, phone: form.phone, email: form.email, notes: form.notes });
        await base44.entities.CommunityRegistration.create({ participant_id: participant.id, participant_name: name, program_id: program.id, program_name: program.name, registration_date: today(), status: 'registered', notes: form.notes });
      } else if (area === 'empoweru') {
        const regs = await base44.entities.EmpowerURegistration.filter({ cohort_id: program.id });
        const active = regs.filter(r => ['registered', 'enrolled'].includes(r.status)).length;
        const waitlistedCount = regs.filter(r => r.status === 'waitlisted').length;
        const isFull = program.capacity && active >= program.capacity;
        isWaitlistedRef.current = !!isFull;
        const participant = await base44.entities.EmpowerUParticipant.create({ first_name: form.first_name, last_name: form.last_name, phone: form.phone, email: form.email, notes: form.notes });
        await base44.entities.EmpowerURegistration.create({
          participant_id: participant.id, participant_name: name, cohort_id: program.id, cohort_name: program.name,
          registration_date: today(), status: isFull ? 'waitlisted' : 'registered',
          ...(isFull ? { waitlist_position: waitlistedCount + 1 } : {}),
          intake_notes: form.notes,
        });
      } else if (area === 'phac') {
        await base44.entities.PHACParticipant.create({
          child_first_name: form.first_name, child_last_name: form.last_name,
          parent_guardian_name: form.parent_guardian_name, parent_guardian_phone: form.parent_guardian_phone, parent_guardian_email: form.parent_guardian_email,
          notes: [program?.name ? `Registered for: ${program.name}` : '', form.notes].filter(Boolean).join('\n'),
        });
      } else if (area === 'ell') {
        isWaitlistedRef.current = !!form.waitlist;
        await base44.entities.ELLLearner.create({ first_name: form.first_name, last_name: form.last_name, phone: form.phone, email: form.email, intake_date: today(), enrollment_status: form.waitlist ? 'waitlisted' : 'prospective', notes: form.notes });
      } else if (area === 'digilit') {
        await base44.entities.DigiLitParticipant.create({ first_name: form.first_name, last_name: form.last_name, phone: form.phone, email: form.email, registration_date: today(), status: 'registered', notes: form.notes });
      } else if (area === 'volunteer') {
        isWaitlistedRef.current = !!form.waitlist;
        await base44.entities.Volunteer.create({ first_name: form.first_name, last_name: form.last_name, email: form.email, phone: form.phone, volunteer_type: form.volunteer_type, status: form.waitlist ? 'waitlist' : 'pending', notes: form.notes });
      }
      toast({ title: isWaitlistedRef.current ? 'Added to the waitlist' : 'Registration created', description: `${name} — ${programLabel}` });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Error creating registration', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  // Track whether the last empoweru save resulted in a waitlist placement (for the toast)
  const isWaitlistedRef = React.useRef(false);

  const isChild = area === 'phac';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Register — {programLabel}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>{isChild ? "Child's First Name *" : 'First Name *'}</Label><Input value={form.first_name || ''} onChange={(e) => update('first_name', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>{isChild ? "Child's Last Name *" : 'Last Name *'}</Label><Input value={form.last_name || ''} onChange={(e) => update('last_name', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email || ''} onChange={(e) => update('email', e.target.value)} /></div>
          {isChild && (
            <>
              <div className="space-y-1.5 col-span-2"><Label>Parent / Guardian Name</Label><Input value={form.parent_guardian_name || ''} onChange={(e) => update('parent_guardian_name', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Parent / Guardian Phone</Label><Input value={form.parent_guardian_phone || ''} onChange={(e) => update('parent_guardian_phone', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Parent / Guardian Email</Label><Input type="email" value={form.parent_guardian_email || ''} onChange={(e) => update('parent_guardian_email', e.target.value)} /></div>
            </>
          )}
          {area === 'volunteer' && (
            <div className="space-y-1.5 col-span-2"><Label>Volunteer Type</Label>
              <Select value={form.volunteer_type || 'community'} onValueChange={(v) => update('volunteer_type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{VOLUNTEER_TYPE_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select>
            </div>
          )}
          {(area === 'ell' || area === 'volunteer') && (
            <div className="col-span-2 flex items-center space-x-2">
              <Checkbox id="cr-waitlist" checked={!!form.waitlist} onCheckedChange={(v) => update('waitlist', v === true)} />
              <Label htmlFor="cr-waitlist" className="cursor-pointer">Add to the waitlist (no spot available yet)</Label>
            </div>
          )}
          <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Register'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}