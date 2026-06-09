import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const PLACEMENT_TYPES = [
  { value: 'cleaning_arc',          label: 'Cleaning (ARC)' },
  { value: 'food_services_onsite',  label: 'Food Services (Onsite)' },
  { value: 'food_services_offsite', label: 'Food Services (Offsite)' },
  { value: 'reception',             label: 'Reception' },
  { value: 'childcare',             label: 'Childcare' },
];

const TRANSPORTATION_OPTIONS = [
  { value: 'has_own_vehicle',                  label: 'Has Own Vehicle' },
  { value: 'no_vehicle_willing_to_bus',         label: 'No Vehicle – Willing to Bus' },
  { value: 'no_vehicle_not_willing_to_bus',     label: 'No Vehicle – Not Willing to Bus' },
  { value: 'transit_pass_provided',             label: 'Transit Pass Provided' },
  { value: 'requires_transportation_support',   label: 'Requires Transportation Support' },
  { value: 'offsite_not_applicable',            label: 'Offsite – Not Applicable' },
];

export default function TrainingReferralForm({ client, onSaved, onCancel }) {
  const [form, setForm] = useState({
    placement_type: '',
    transportation: '',
    referral_date: new Date().toISOString().split('T')[0],
    training_goals: '',
    referral_notes: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSave = async () => {
    if (!form.placement_type) { toast.error('Placement type is required'); return; }
    setSaving(true);
    try {
      const me = await base44.auth.me().catch(() => null);
      await base44.entities.InternalTraining.create({
        ...form,
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
        assigned_worker: client.assigned_worker,
        assigned_worker_name: client.assigned_worker_name,
        status: 'referred',
      });
      toast.success('Referral created');
      onSaved();
    } catch (err) {
      toast.error('Failed to create referral');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-blue-800">New Internal Training Referral</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-semibold">Placement Type <span className="text-red-500">*</span></Label>
            <Select value={form.placement_type} onValueChange={v => set('placement_type', v)}>
              <SelectTrigger className="mt-1 bg-white"><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {PLACEMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold">Transportation</Label>
            <Select value={form.transportation} onValueChange={v => set('transportation', v)}>
              <SelectTrigger className="mt-1 bg-white"><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {TRANSPORTATION_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold">Referral Date</Label>
            <Input type="date" className="mt-1 bg-white" value={form.referral_date} onChange={e => set('referral_date', e.target.value)} />
          </div>
        </div>
        <div>
          <Label className="text-xs font-semibold">Training Goals</Label>
          <Textarea rows={2} className="mt-1 bg-white text-sm" value={form.training_goals} onChange={e => set('training_goals', e.target.value)} />
        </div>
        <div>
          <Label className="text-xs font-semibold">Referral Notes</Label>
          <Textarea rows={2} className="mt-1 bg-white text-sm" value={form.referral_notes} onChange={e => set('referral_notes', e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Create Referral'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}