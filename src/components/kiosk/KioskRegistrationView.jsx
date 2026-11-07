import React, { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import KioskFrame from '@/components/kiosk/KioskFrame';

// Someone arriving for help at the resource centre types their own details here.
// What they enter becomes their client file, so reception does not retype it.
const EMPTY = {
  first_name: '',
  last_name: '',
  date_of_birth: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  preferred_language: '',
  needs: '',
};

export default function KioskRegistrationView({ prompt, onRespond, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = async () => {
    if (saving) return;
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('Please enter your first and last name.');
      return;
    }
    if (!form.phone.trim() && !form.email.trim()) {
      setError('Please leave a phone number or an email so we can reach you.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onRespond({
        person: {
          ...form,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
        },
      });
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Could not save your details. Please ask the reception team for help.');
      setSaving(false);
    }
  };

  return (
    <KioskFrame prompt={prompt} icon={ClipboardCheck} onClose={onClose}>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-base">First name</Label>
            <Input className="h-14 text-lg" value={form.first_name} onChange={set('first_name')} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-base">Last name</Label>
            <Input className="h-14 text-lg" value={form.last_name} onChange={set('last_name')} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-base">Date of birth</Label>
            <Input className="h-14 text-lg" type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-base">Phone</Label>
            <Input className="h-14 text-lg" type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-base">Email</Label>
            <Input className="h-14 text-lg" type="email" inputMode="email" value={form.email} onChange={set('email')} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-base">Preferred language</Label>
            <Input className="h-14 text-lg" value={form.preferred_language} onChange={set('preferred_language')} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-base">Street address</Label>
            <Input className="h-14 text-lg" value={form.address} onChange={set('address')} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-base">City or town</Label>
            <Input className="h-14 text-lg" value={form.city} onChange={set('city')} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-base">What can we help you with today?</Label>
          <Textarea rows={3} className="text-lg" value={form.needs} onChange={set('needs')} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={submit} disabled={saving} className="w-full h-16 text-xl font-semibold">
          {saving ? 'Saving…' : 'Submit my details'}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Reception will see your details straight away and come to help you.
        </p>
      </div>
    </KioskFrame>
  );
}