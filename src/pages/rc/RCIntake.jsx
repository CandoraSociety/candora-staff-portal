import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import ClientFormCore from '@/components/rc/ClientFormCore';
import ClientPicker from '@/components/centralreg/ClientPicker';
import { generateTestClientName, TEST_CLIENT_BG, TEST_CLIENT_TEXT } from '@/lib/rcTestClients';

const EMPTY = {
  first_name: '', last_name: '', date_of_birth: '', phone: '', email: '', address: '', city: '', postal_code: '',
  preferred_language: '', additional_languages: '', emergency_contact_name: '', emergency_contact_phone: '',
  service_category: '', has_children_0_6: false, children_count_0_6: 0, children_ages_detail: '',
  english_proficiency: '', english_proficiency_notes: '', indigenous_first_nations: false, newcomer: false,
  reason_for_accessing: '', reason_for_accessing_other: '', identified_needs: '',
  assigned_worker: '', case_status: 'intake', intake_date: '', referral_source: '', notes: '',
};

export default function RCIntake() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY, intake_date: new Date().toISOString().split('T')[0] });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleTestClient = async () => {
    setSaving(true);
    try {
      const { first_name, last_name } = generateTestClientName();
      const created = await base44.entities.RCClient.create({
        first_name,
        last_name,
        intake_date: new Date().toISOString().split('T')[0],
        case_status: 'intake',
        notes: 'Test client — created for testing purposes.',
      });
      toast({ title: 'Test client created', description: `${first_name} ${last_name}` });
      navigate(`/rc/clients/${created.id}`);
    } catch (err) {
      toast({ title: 'Error creating test client', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!form.first_name || !form.last_name) {
      toast({ title: 'First and last name are required', variant: 'destructive' });
      return;
    }
    if (!form.service_category) {
      toast({ title: 'Service category is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const created = await base44.entities.RCClient.create(form);
      toast({ title: 'Client intake complete' });
      navigate(`/rc/clients/${created.id}`);
    } catch (err) {
      toast({ title: 'Error during intake', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSelectExisting = (client) => {
    toast({ title: 'Opening client profile', description: `${client.first_name} ${client.last_name}` });
    navigate(`/rc/clients/${client.id}`);
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">New Client Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Register a new client in the Candora Central Database</p>
      </div>
      <Card>
        <CardContent className="p-5 space-y-2">
          <p className="text-sm font-medium text-foreground">Existing client — select for service</p>
          <ClientPicker onSelect={handleSelectExisting} placeholder="Type an existing client's name..." />
        </CardContent>
      </Card>
      <Card><CardContent className="p-5"><ClientFormCore form={form} update={update} /></CardContent></Card>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleTestClient} disabled={saving} style={{ backgroundColor: TEST_CLIENT_BG, color: TEST_CLIENT_TEXT, borderColor: TEST_CLIENT_BG, fontWeight: 700 }}>Create Test Client</Button>
        <Button variant="outline" onClick={() => navigate('/rc/clients')}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Complete Intake'}</Button>
      </div>
    </div>
  );
}