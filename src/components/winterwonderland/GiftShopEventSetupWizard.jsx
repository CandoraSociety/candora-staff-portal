import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';

const STEPS = [
  { key: 'event', label: 'The event' },
  { key: 'registration', label: 'Registration & slots' },
  { key: 'people', label: 'People & notes' },
];

const EMPTY_FORM = {
  event_name: 'Kids Gift Shop',
  event_date: '',
  start_time: '10:30',
  end_time: '14:45',
  venue: '',
  desk_location: '',
  registration_opens: '',
  registration_closes: '',
  slot_minutes: '15',
  children_per_slot: '4',
  gifts_per_child: '1',
  gift_price: '',
  coordinator_name: '',
  coordinator_phone: '',
  coordinator_email: '',
  volunteers_needed: '',
  notes: '',
};

const numberOrNull = (value) => (String(value).trim() === '' ? null : Number(value));

// The setup wizard behind the Kids Gift Shop overview — it records the event's
// logistics (when it runs, where the desk sits, how registration and slots work,
// who coordinates it) and leaves every other tab exactly as it is.
export default function GiftShopEventSetupWizard({ open, onOpenChange, festival, setup, onSaved }) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setSaving(false);
    setForm({
      ...EMPTY_FORM,
      ...(setup
        ? Object.fromEntries(Object.entries(setup).map(([key, value]) => [
            key,
            value === null || value === undefined ? '' : String(value),
          ]))
        : {}),
    });
  }, [open, setup]);

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const isLast = step === STEPS.length - 1;

  const save = async () => {
    if (!festival?.id) return;
    setSaving(true);
    try {
      const me = await base44.auth.me().catch(() => null);
      const payload = {
        event_name: form.event_name.trim() || 'Kids Gift Shop',
        event_date: form.event_date || null,
        start_time: form.start_time || '',
        end_time: form.end_time || '',
        venue: form.venue.trim(),
        desk_location: form.desk_location.trim(),
        registration_opens: form.registration_opens || null,
        registration_closes: form.registration_closes || null,
        slot_minutes: numberOrNull(form.slot_minutes),
        children_per_slot: numberOrNull(form.children_per_slot),
        gifts_per_child: numberOrNull(form.gifts_per_child),
        gift_price: numberOrNull(form.gift_price),
        coordinator_name: form.coordinator_name.trim(),
        coordinator_phone: form.coordinator_phone.trim(),
        coordinator_email: form.coordinator_email.trim(),
        volunteers_needed: numberOrNull(form.volunteers_needed),
        notes: form.notes.trim(),
        updated_by_name: me?.full_name || me?.email || '',
      };
      if (setup?.id) {
        await base44.entities.GiftShopEventSetup.update(setup.id, payload);
      } else {
        await base44.entities.GiftShopEventSetup.create({
          ...payload,
          festival_id: festival.id,
          festival_year: festival.year,
        });
      }
      toast({ title: 'Event details saved' });
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'That could not be saved', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const eventStep = (
    <div className="grid gap-4">
      <div className="space-y-1.5">
        <Label>Event name</Label>
        <Input value={form.event_name} onChange={e => set('event_name', e.target.value)} placeholder="Kids Gift Shop" />
      </div>
      <div className="space-y-1.5">
        <Label>Event date</Label>
        <Input type="date" value={form.event_date} onChange={e => set('event_date', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>First slot</Label>
          <Input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Last slot</Label>
          <Input type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Venue</Label>
        <Input value={form.venue} onChange={e => set('venue', e.target.value)} placeholder="Riverview Crossing Shopping Centre" />
      </div>
      <div className="space-y-1.5">
        <Label>Check-in desk location</Label>
        <Input value={form.desk_location} onChange={e => set('desk_location', e.target.value)} placeholder="e.g. Unit 118 beside the food court" />
      </div>
    </div>
  );

  const registrationStep = (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Registration opens</Label>
          <Input type="date" value={form.registration_opens} onChange={e => set('registration_opens', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Registration closes</Label>
          <Input type="date" value={form.registration_closes} onChange={e => set('registration_closes', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Slot length</Label>
          <Select value={form.slot_minutes} onValueChange={value => set('slot_minutes', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['10', '15', '20', '30', '45', '60'].map(value => (
                <SelectItem key={value} value={value}>{value} minutes</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Children per slot</Label>
          <Input type="number" min="1" value={form.children_per_slot} onChange={e => set('children_per_slot', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Gifts per child</Label>
          <Select value={form.gifts_per_child} onValueChange={value => set('gifts_per_child', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 gift</SelectItem>
              <SelectItem value="2">2 gifts</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Gift price (CAD)</Label>
          <Input type="number" min="0" step="0.01" value={form.gift_price} onChange={e => set('gift_price', e.target.value)} placeholder="0.00" />
        </div>
      </div>
    </div>
  );

  const peopleStep = (
    <div className="grid gap-4">
      <div className="space-y-1.5">
        <Label>Coordinator</Label>
        <Input value={form.coordinator_name} onChange={e => set('coordinator_name', e.target.value)} placeholder="Who is running the gift shop" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Coordinator phone</Label>
          <Input value={form.coordinator_phone} onChange={e => set('coordinator_phone', e.target.value)} placeholder="587-000-0000" />
        </div>
        <div className="space-y-1.5">
          <Label>Coordinator email</Label>
          <Input type="email" value={form.coordinator_email} onChange={e => set('coordinator_email', e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Volunteers (elves) needed</Label>
        <Input type="number" min="0" value={form.volunteers_needed} onChange={e => set('volunteers_needed', e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Notes for the day</Label>
        <Textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Anything else staff need to know" />
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Event setup</DialogTitle>
          <DialogDescription>
            The logistics for this year's Kids Gift Shop. Saved here on the overview — the other tabs keep working as they do today.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          {STEPS.map((item, index) => (
            <div key={item.key} className="flex items-center gap-2">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  index <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {index < step ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </div>
              <span className={`text-xs ${index === step ? 'font-semibold' : 'text-muted-foreground'}`}>{item.label}</span>
              {index < STEPS.length - 1 && <div className="h-px w-4 bg-border" />}
            </div>
          ))}
        </div>

        <div className="py-1">
          {step === 0 && eventStep}
          {step === 1 && registrationStep}
          {step === 2 && peopleStep}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="outline"
            onClick={() => (step === 0 ? onOpenChange(false) : setStep(step - 1))}
            disabled={saving}
          >
            {step === 0 ? 'Cancel' : <><ArrowLeft className="h-4 w-4" /> Back</>}
          </Button>
          {isLast ? (
            <Button onClick={save} disabled={saving || !form.event_name.trim()}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Check className="h-4 w-4" /> Save details</>}
            </Button>
          ) : (
            <Button onClick={() => setStep(step + 1)}>
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}