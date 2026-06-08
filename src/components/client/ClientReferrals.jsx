import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const INTERNAL_REFERRALS = [
  'Cleaning ARC',
  'Food Services Onsite',
  'Food Services Offsite',
  'Reception',
  'Childcare',
  'Employment Supports',
  'Navigation Supports'
];

const EXTERNAL_REFERRALS = [
  'Alberta Works',
  'Centre for Newcomers',
  'CCISS',
  'Boyle Street',
  'The Mustard Seed',
  'Homeward Trust',
  'Other'
];

export default function ClientReferrals({ client, onSave }) {
  const [selectedInternal, setSelectedInternal] = useState(client.internal_referrals || []);
  const [selectedExternal, setSelectedExternal] = useState(client.external_referrals || []);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Find newly added referrals
      const newInternal = selectedInternal.filter(r => !client.internal_referrals?.includes(r));
      const newExternal = selectedExternal.filter(r => !client.external_referrals?.includes(r));

      await onSave({ internal_referrals: selectedInternal, external_referrals: selectedExternal });

      // Send alerts for new referrals
      for (const referral of [...newInternal, ...newExternal]) {
        try {
          await base44.functions.invoke('sendAlertEmail', {
            client_id: client.id,
            client_name: `${client.first_name} ${client.last_name}`,
            referral_type: 'internal',
            referral_name: referral
          });
        } catch (error) {
          console.error('Failed to send alert for', referral);
        }
      }

      toast.success('Referrals updated');
    } catch (error) {
      toast.error('Failed to update referrals');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Internal Referrals</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {INTERNAL_REFERRALS.map(ref => (
              <div key={ref} className="flex items-center space-x-2">
                <Checkbox
                  id={`int-${ref}`}
                  checked={selectedInternal.includes(ref)}
                  onCheckedChange={(checked) => {
                    setSelectedInternal(checked ? [...selectedInternal, ref] : selectedInternal.filter(r => r !== ref));
                  }}
                />
                <Label htmlFor={`int-${ref}`} className="text-sm">{ref}</Label>
              </div>
            ))}
          </div>
          <Button onClick={handleSave} className="mt-4" disabled={saving}>
            {saving ? 'Saving...' : 'Save Referrals'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>External Referrals</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {EXTERNAL_REFERRALS.map(ref => (
              <div key={ref} className="flex items-center space-x-2">
                <Checkbox
                  id={`ext-${ref}`}
                  checked={selectedExternal.includes(ref)}
                  onCheckedChange={(checked) => {
                    setSelectedExternal(checked ? [...selectedExternal, ref] : selectedExternal.filter(r => r !== ref));
                  }}
                />
                <Label htmlFor={`ext-${ref}`} className="text-sm">{ref}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}