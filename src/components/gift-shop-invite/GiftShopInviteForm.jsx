import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  KIDS_GIFT_SHOP_TIME_SLOTS,
  KIDS_GIFT_SHOP_AGE_BANDS,
  KIDS_GIFT_SHOP_GENDERS,
  KIDS_GIFT_SHOP_SLOT_CAPACITY,
} from '@/lib/centralRegConstants';

let childKey = 0;
const emptyChild = () => ({ key: `c${++childKey}`, child_name: '', age_band: '', gift_count: '1', gift_1: '', gift_2: '' });

// The private pre-registration form. The link is the invitation, and the family
// has to confirm the email or phone it was sent to — so a forwarded link is no
// use to anyone else. Everything is re-checked on the server.
export default function GiftShopInviteForm({ invite, slots = [], onDone }) {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const maxChildren = Math.min(Math.max(Number(invite?.children_allowed) || 3, 1), 6);

  const [guardianName, setGuardianName] = useState(invite?.guardian_name || '');
  const [contact, setContact] = useState('');
  const [children, setChildren] = useState([emptyChild()]);
  const [timeSlot, setTimeSlot] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const setChild = (key, field, value) => setChildren(list =>
    list.map(c => (c.key === key ? { ...c, [field]: value } : c))
  );
  const addChild = () => setChildren(list => (list.length >= maxChildren ? list : [...list, emptyChild()]));
  const removeChild = (key) => setChildren(list => list.filter(c => c.key !== key));

  const placesNeeded = children.length;
  const slotOptions = slots.length
    ? slots
    : KIDS_GIFT_SHOP_TIME_SLOTS.map(s => ({ ...s, remaining: KIDS_GIFT_SHOP_SLOT_CAPACITY }));

  const submit = async () => {
    setError('');
    if (!guardianName.trim()) return setError('Enter the parent or guardian’s name.');
    if (!contact.trim()) return setError('Enter the email address or phone number this invitation was sent to.');
    for (const [index, child] of children.entries()) {
      const label = children.length > 1 ? `Child ${index + 1}: ` : '';
      if (!child.child_name.trim()) return setError(`${label}enter the child’s name.`);
      if (!child.age_band) return setError(`${label}select the age.`);
      if (!child.gift_1) return setError(`${label}select who the first gift is for.`);
      if (child.gift_count === '2' && !child.gift_2) return setError(`${label}select who the second gift is for.`);
    }
    if (!timeSlot) return setError('Choose a shopping time.');

    setSaving(true);
    const payload = {
      token,
      guardian_name: guardianName.trim(),
      contact: contact.trim(),
      time_slot: timeSlot,
      children: children.map(c => ({
        child_name: c.child_name.trim(),
        age_band: c.age_band,
        gift_count: Number(c.gift_count),
        gift_1_gender: c.gift_1,
        gift_2_gender: c.gift_count === '2' ? c.gift_2 : null,
      })),
    };

    const res = await base44.functions
      .invoke('submitGiftShopInvite', payload)
      .catch(err => ({ data: { error: err?.response?.data?.error || 'Something went wrong. Please try again or call the office.' } }));

    setSaving(false);
    if (res.data?.state === 'registered') {
      onDone?.(res.data);
      return;
    }
    setError(res.data?.error || 'Something went wrong. Please try again or call the office.');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start gap-2 rounded-lg bg-primary/10 px-3 py-2.5">
            <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-foreground/80">
              This is a private invitation for {invite?.guardian_name || 'your family'}, covering up to {maxChildren}{' '}
              {maxChildren === 1 ? 'child' : 'children'}. To use it, confirm the email address or phone number the invitation was sent to.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Parent or guardian’s name *</Label>
              <Input value={guardianName} onChange={e => setGuardianName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email or phone this invitation was sent to *</Label>
              <Input
                value={contact}
                onChange={e => setContact(e.target.value)}
                placeholder="you@example.com or 780-555-1234"
              />
              <p className="text-xs text-muted-foreground">
                Either one works — whichever the invitation came to.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Children *</p>
              <p className="text-xs text-muted-foreground">Add each child coming to shop.</p>
            </div>
            {children.length < maxChildren && (
              <Button type="button" size="sm" variant="outline" onClick={addChild}>
                <Plus className="h-3.5 w-3.5" /> Add another child
              </Button>
            )}
          </div>

          {children.map((child, index) => (
            <div key={child.key} className="rounded-lg border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {children.length > 1 ? `Child ${index + 1}` : 'Child'}
                </p>
                {children.length > 1 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-red-600"
                    onClick={() => removeChild(child.key)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Child’s name *</Label>
                  <Input value={child.child_name} onChange={e => setChild(child.key, 'child_name', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Age *</Label>
                  <Select value={child.age_band} onValueChange={v => setChild(child.key, 'age_band', v)}>
                    <SelectTrigger><SelectValue placeholder="Select age" /></SelectTrigger>
                    <SelectContent>
                      {KIDS_GIFT_SHOP_AGE_BANDS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>How many gifts *</Label>
                  <Select value={child.gift_count} onValueChange={v => setChild(child.key, 'gift_count', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Gift one *</Label>
                  <Select value={child.gift_1} onValueChange={v => setChild(child.key, 'gift_1', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {KIDS_GIFT_SHOP_GENDERS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Gift two{child.gift_count === '2' ? ' *' : ''}</Label>
                  <Select
                    value={child.gift_2}
                    onValueChange={v => setChild(child.key, 'gift_2', v)}
                    disabled={child.gift_count !== '2'}
                  >
                    <SelectTrigger><SelectValue placeholder={child.gift_count === '2' ? 'Select' : '—'} /></SelectTrigger>
                    <SelectContent>
                      {KIDS_GIFT_SHOP_GENDERS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Shopping time *</p>
            <p className="text-xs text-muted-foreground">
              {placesNeeded > 1 ? `Needs ${placesNeeded} places` : 'One place'}
            </p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slotOptions.map(slot => {
              const unavailable = (slot.remaining ?? 0) < placesNeeded;
              const selected = timeSlot === slot.value;
              return (
                <button
                  key={slot.value}
                  type="button"
                  disabled={unavailable}
                  onClick={() => setTimeSlot(slot.value)}
                  className={cn(
                    'rounded-md border px-2 py-1.5 text-left transition-colors',
                    unavailable
                      ? 'bg-muted text-muted-foreground/60 cursor-not-allowed'
                      : selected
                        ? 'border-primary bg-primary/10'
                        : 'hover:bg-muted'
                  )}
                >
                  <span className={cn('block text-xs font-medium', unavailable && 'line-through')}>{slot.label}</span>
                  <span className="block text-[10px] text-muted-foreground">
                    {slot.remaining <= 0 ? 'Full' : `${slot.remaining} left`}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5">
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Button className="w-full" size="lg" onClick={submit} disabled={saving}>
        {saving ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>) : placesNeeded > 1 ? `Register ${placesNeeded} children` : 'Complete registration'}
      </Button>
    </div>
  );
}