import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import ParticipantFormCore from '@/components/empoweru/ParticipantFormCore';
import { DELIVERY_MODE_OPTIONS } from '@/lib/empoweruConstants';

const EMPTY = { first_name: '', last_name: '', date_of_birth: '', phone: '', email: '', address: '', city: '', postal_code: '', preferred_language: '', emergency_contact_name: '', emergency_contact_phone: '', referral_source: '', notes: '' };

export default function EmpowerUIntake() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [regData, setRegData] = useState({ cohort_id: '', preferred_delivery_mode: 'no_preference', accommodation_needs: '', intake_notes: '' });

  const { data: cohorts = [] } = useQuery({ queryKey: ['empoweru-cohorts'], queryFn: () => base44.entities.EmpowerUCohort.list() });
  const openCohorts = cohorts.filter(c => c.registration_open);

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const updateReg = (f, v) => setRegData(p => ({ ...p, [f]: v }));

  const handleSave = async () => {
    if (!form.first_name || !form.last_name) { toast({ title: 'First and last name are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const participant = await base44.entities.EmpowerUParticipant.create(form);
      if (regData.cohort_id) {
        const cohort = cohorts.find(c => c.id === regData.cohort_id);
        await base44.entities.EmpowerURegistration.create({
          participant_id: participant.id, participant_name: `${form.first_name} ${form.last_name}`,
          cohort_id: regData.cohort_id, cohort_name: cohort?.name || '',
          registration_date: new Date().toISOString().split('T')[0], status: 'registered',
          preferred_delivery_mode: regData.preferred_delivery_mode, accommodation_needs: regData.accommodation_needs, intake_notes: regData.intake_notes,
        });
      }
      toast({ title: 'Participant registered' });
      navigate(`/empoweru/participants/${participant.id}`);
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div><h1 className="text-2xl font-heading font-bold text-foreground">New Participant Intake</h1><p className="text-muted-foreground text-sm mt-1">Register a new participant for EmpowerU</p></div>

      <Card><CardContent className="p-5"><ParticipantFormCore form={form} update={update} /></CardContent></Card>

      <Card><CardContent className="p-5">
        <p className="text-sm font-medium text-foreground mb-3">Registration</p>
        {openCohorts.length === 0 ? <p className="text-sm text-muted-foreground">No cohorts with open registration. You can still create the participant and register them later.</p> : (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2"><Label>Cohort</Label><Select value={regData.cohort_id} onValueChange={(v) => updateReg('cohort_id', v)}><SelectTrigger><SelectValue placeholder="Select cohort..." /></SelectTrigger><SelectContent>{openCohorts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Preferred Delivery Mode</Label><Select value={regData.preferred_delivery_mode} onValueChange={(v) => updateReg('preferred_delivery_mode', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="no_preference">No Preference</SelectItem>{DELIVERY_MODE_OPTIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Accommodation Needs</Label><Input value={regData.accommodation_needs || ''} onChange={(e) => updateReg('accommodation_needs', e.target.value)} placeholder="Childcare, accessibility, etc." /></div>
            <div className="space-y-1.5 col-span-2"><Label>Intake Notes</Label><Textarea value={regData.intake_notes || ''} onChange={(e) => updateReg('intake_notes', e.target.value)} rows={2} /></div>
          </div>
        )}
      </CardContent></Card>

      <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => navigate('/empoweru/participants')}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Complete Intake'}</Button></div>
    </div>
  );
}