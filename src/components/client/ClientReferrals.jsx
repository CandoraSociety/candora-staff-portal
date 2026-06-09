import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const INTERNAL_REFERRAL_OPTIONS = [
  { value: 'ell',                 label: 'ELL (English Language Learning)' },
  { value: 'empoweru',            label: 'EmpowerU' },
  { value: 'digital_literacy',    label: 'Digital Literacy' },
  { value: 'family_programs',     label: 'Family Programs' },
  { value: 'childcare_program',   label: 'Childcare Program' },
  { value: 'settlement_services', label: 'Settlement Services' },
  { value: 'other_internal',      label: 'Other (Internal)' },
];

const EXTERNAL_REFERRAL_OPTIONS = [
  { value: 'christcity_lighthouse', label: 'Christcity Lighthouse – Counselling' },
  { value: 'other_external',        label: 'Other (External)' },
];

export default function ClientReferrals({ client, onSave }) {
  const [form, setForm] = useState({
    internal_referrals: client?.internal_referrals || [],
    external_referrals: client?.external_referrals || [],
  });
  const [saving, setSaving] = useState(false);
  const [prevInternal] = useState(client?.internal_referrals || []);
  const [prevExternal] = useState(client?.external_referrals || []);

  const toggleItem = (field, value) => {
    setForm(prev => {
      const arr = prev[field];
      return { ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const newInternal = form.internal_referrals.filter(v => !prevInternal.includes(v));
      const newExternal = form.external_referrals.filter(v => !prevExternal.includes(v));

      await onSave(form);

      if (newInternal.length > 0) {
        await base44.functions.invoke('sendAlertEmail', {
          alert_type: 'internal_referrals',
          client_name: `${client.first_name} ${client.last_name}`,
          client_id: client.id,
          referrals: newInternal,
        });
      }
      if (newExternal.length > 0) {
        await base44.functions.invoke('sendAlertEmail', {
          alert_type: 'external_referrals',
          client_name: `${client.first_name} ${client.last_name}`,
          client_id: client.id,
          referrals: newExternal,
        });
      }

      toast.success('Referrals saved');
    } catch (err) {
      toast.error('Failed to save referrals');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Internal Referrals */}
      <Card>
        <CardHeader>
          <CardTitle>Internal Referrals</CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Select all internal referrals made. Staff responsible for each program will be notified automatically.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {INTERNAL_REFERRAL_OPTIONS.map(opt => (
              <div key={opt.value} className="flex items-center gap-3">
                <Checkbox
                  id={`int-${opt.value}`}
                  checked={form.internal_referrals.includes(opt.value)}
                  onCheckedChange={() => toggleItem('internal_referrals', opt.value)}
                />
                <Label htmlFor={`int-${opt.value}`} className="text-sm font-normal cursor-pointer">
                  {opt.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* External Referrals */}
      <Card>
        <CardHeader>
          <CardTitle>External Referrals</CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Select all external referrals made. Where available, the external partner will be notified automatically.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {EXTERNAL_REFERRAL_OPTIONS.map(opt => (
              <div key={opt.value} className="flex items-center gap-3">
                <Checkbox
                  id={`ext-${opt.value}`}
                  checked={form.external_referrals.includes(opt.value)}
                  onCheckedChange={() => toggleItem('external_referrals', opt.value)}
                />
                <Label htmlFor={`ext-${opt.value}`} className="text-sm font-normal cursor-pointer">
                  {opt.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-1" />
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}