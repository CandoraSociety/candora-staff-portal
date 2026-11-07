import React, { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import KioskFrame from '@/components/kiosk/KioskFrame';

// Everything reception would type in when registering someone at the front
// desk. Nothing here creates a client file — the details go back to reception,
// who verifies them (and checks for an existing file) before adding them to the
// Central Database.
const EMPTY = {
  first_name: '',
  last_name: '',
  date_of_birth: '',
  gender: '',
  marital_status: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  postal_code: '',
  preferred_language: '',
  additional_languages: '',
  dependants_count: '',
  dependants_detail: '',
  indigenous_first_nations: false,
  newcomer: false,
  senior: false,
  youth_under_25: false,
  english_proficiency: '',
  english_proficiency_notes: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  reason_for_accessing: '',
  reason_for_accessing_other: '',
  identified_needs: '',
  notes: '',
};

const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
];

const MARITAL_STATUS_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'common_law', label: 'Common law' },
  { value: 'separated', label: 'Separated' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
];

const ENGLISH_OPTIONS = [
  { value: 'strong', label: 'Strong' },
  { value: 'acceptable', label: 'Okay' },
  { value: 'low', label: 'I need help' },
];

const REASON_OPTIONS = [
  { value: 'emergency_food', label: 'Food' },
  { value: 'emergency_clothing', label: 'Clothing' },
  { value: 'bus_tickets', label: 'Bus tickets' },
  { value: 'housing_concerns', label: 'Housing' },
  { value: 'financial_assistance', label: 'Money or income help' },
  { value: 'mental_health_wellbeing', label: 'Mental health and wellbeing' },
  { value: 'family_parenting_support', label: 'Family and parenting support' },
  { value: 'advocacy_navigation', label: 'Help dealing with services or paperwork' },
  { value: 'documentation_id', label: 'ID or documents' },
  { value: 'employment_income', label: 'Work or job help' },
  { value: 'settlement_immigration', label: 'Settlement or immigration' },
  { value: 'health_medical', label: 'Health and medical' },
  { value: 'crisis_safety', label: 'Safety concerns' },
  { value: 'program_registration', label: 'Signing up for a program' },
  { value: 'other', label: 'Something else' },
];

const DEMOGRAPHICS = [
  { field: 'indigenous_first_nations', label: 'Indigenous / First Nations' },
  { field: 'newcomer', label: 'New to Canada' },
  { field: 'senior', label: 'Senior' },
  { field: 'youth_under_25', label: 'Under 25' },
];

function Section({ title, hint, children }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-base font-semibold text-foreground">{title}</p>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export default function KioskRegistrationView({ prompt, onRespond, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const pick = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

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
          dependants_count: form.dependants_count === '' ? '' : Number(form.dependants_count) || 0,
        },
      });
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Could not send your details. Please ask the reception team for help.');
      setSaving(false);
    }
  };

  return (
    <KioskFrame prompt={prompt} icon={ClipboardCheck} onClose={onClose}>
      <div className="space-y-6">
        <Section title="About you">
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
              <Label className="text-base">Gender</Label>
              <Select value={form.gender} onValueChange={(v) => pick('gender', v)}>
                <SelectTrigger className="h-14 text-lg"><SelectValue placeholder="Choose" /></SelectTrigger>
                <SelectContent>{GENDER_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-base">Marital status</Label>
              <Select value={form.marital_status} onValueChange={(v) => pick('marital_status', v)}>
                <SelectTrigger className="h-14 text-lg"><SelectValue placeholder="Choose" /></SelectTrigger>
                <SelectContent>{MARITAL_STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-base">Number of dependants</Label>
              <Input className="h-14 text-lg" type="number" min="0" inputMode="numeric" value={form.dependants_count} onChange={set('dependants_count')} placeholder="0" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-base">Who do you care for?</Label>
              <Input className="h-14 text-lg" value={form.dependants_detail} onChange={set('dependants_detail')} placeholder="e.g. 2 children (ages 3 and 7)" />
            </div>
          </div>
        </Section>

        <Section title="How we can reach you">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-base">Phone</Label>
              <Input className="h-14 text-lg" type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-base">Email</Label>
              <Input className="h-14 text-lg" type="email" inputMode="email" value={form.email} onChange={set('email')} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-base">Street address</Label>
              <Input className="h-14 text-lg" value={form.address} onChange={set('address')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-base">City or town</Label>
              <Input className="h-14 text-lg" value={form.city} onChange={set('city')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-base">Postal code</Label>
              <Input className="h-14 text-lg" value={form.postal_code} onChange={set('postal_code')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-base">Main language</Label>
              <Input className="h-14 text-lg" value={form.preferred_language} onChange={set('preferred_language')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-base">Other languages</Label>
              <Input className="h-14 text-lg" value={form.additional_languages} onChange={set('additional_languages')} />
            </div>
          </div>
        </Section>

        <Section title="A little more about you" hint="You can skip anything you would rather not answer.">
          <div className="grid gap-3 sm:grid-cols-2">
            {DEMOGRAPHICS.map((item) => (
              <label key={item.field} className="flex items-center gap-3 rounded-xl border p-4 cursor-pointer">
                <Checkbox checked={!!form[item.field]} onCheckedChange={(v) => pick(item.field, !!v)} />
                <span className="text-base">{item.label}</span>
              </label>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-base">How is your English?</Label>
              <Select value={form.english_proficiency} onValueChange={(v) => pick('english_proficiency', v)}>
                <SelectTrigger className="h-14 text-lg"><SelectValue placeholder="Choose" /></SelectTrigger>
                <SelectContent>{ENGLISH_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-base">Anything we should know?</Label>
              <Input className="h-14 text-lg" value={form.english_proficiency_notes} onChange={set('english_proficiency_notes')} />
            </div>
          </div>
        </Section>

        <Section title="Someone we can call in an emergency">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-base">Their name</Label>
              <Input className="h-14 text-lg" value={form.emergency_contact_name} onChange={set('emergency_contact_name')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-base">Their phone</Label>
              <Input className="h-14 text-lg" type="tel" inputMode="tel" value={form.emergency_contact_phone} onChange={set('emergency_contact_phone')} />
            </div>
          </div>
        </Section>

        <Section title="What can we help you with today?">
          <div className="space-y-2">
            <Label className="text-base">Reason for your visit</Label>
            <Select value={form.reason_for_accessing} onValueChange={(v) => pick('reason_for_accessing', v)}>
              <SelectTrigger className="h-14 text-lg"><SelectValue placeholder="Choose a reason" /></SelectTrigger>
              <SelectContent>{REASON_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {form.reason_for_accessing === 'other' && (
            <div className="space-y-1.5">
              <Label className="text-base">Please tell us more</Label>
              <Input className="h-14 text-lg" value={form.reason_for_accessing_other} onChange={set('reason_for_accessing_other')} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-base">In your own words</Label>
            <Textarea rows={4} className="text-lg" value={form.identified_needs} onChange={set('identified_needs')} />
          </div>
        </Section>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={submit} disabled={saving} className="w-full h-16 text-xl font-semibold">
          {saving ? 'Sending…' : 'Send to the front desk'}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          The front desk will go over these details with you before adding you to our records.
        </p>
      </div>
    </KioskFrame>
  );
}