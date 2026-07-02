import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import ClientFormCore from '@/components/rc/ClientFormCore';

const EMPTY = {
  first_name: '', last_name: '', date_of_birth: '', phone: '', email: '', address: '', city: '', postal_code: '',
  preferred_language: '', emergency_contact_name: '', emergency_contact_phone: '',
  funder_categories: [], has_children_0_6: false, children_count_0_6: 0, children_ages_detail: '',
  assigned_worker: '', case_status: 'intake', intake_date: '', presenting_needs: '', referral_source: '', notes: '',
};

export default function RCIntake() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY, intake_date: new Date().toISOString().split('T')[0] });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.first_name || !form.last_name) {
      toast({ title: 'First and last name are required', variant: 'destructive' });
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

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">New Client Intake</h1>
        <p className="text-muted-foreground text-sm mt-1">Register a new client in the Resource Centre database</p>
      </div>
      <Card><CardContent className="p-5"><ClientFormCore form={form} update={update} /></CardContent></Card>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate('/rc/clients')}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Complete Intake'}</Button>
      </div>
    </div>
  );
}