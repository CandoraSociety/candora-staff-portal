import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import GiftFields from '@/components/centralreg/GiftShopGiftFields';
import { KIDS_GIFT_SHOP_TIME_SLOTS, KIDS_GIFT_SHOP_SLOT_CAPACITY, KIDS_GIFT_SHOP_AGE_BANDS } from '@/lib/centralRegConstants';
import { giftShopAsksGiftGender, giftShopGiftGender, giftShopSlotCounts } from '@/lib/giftShopFamilies';
import { useGiftShopRegistrations } from '@/lib/useGiftShopRegistrations';

const toForm = (reg) => ({
  guardian_name: reg?.parent_guardian_name || '',
  guardian_phone: reg?.parent_guardian_phone || reg?.participant_phone || '',
  guardian_email: reg?.parent_guardian_email || reg?.participant_email || '',
  child_name: reg?.child_name || reg?.participant_name || '',
  age_band: reg?.child_age_band || '',
  gift_count: String(reg?.gift_count || 1),
  gift_1: reg?.gift_1_gender || '',
  gift_1_rec: reg?.gift_1_recipient || '',
  gift_2: reg?.gift_2_gender || '',
  gift_2_rec: reg?.gift_2_recipient || '',
  time_slot: reg?.time_slot || '',
});

// Edit one child's Kids Gift Shop registration — guardian details, the child,
// who each gift is for, and the shopping slot.
export default function GiftShopRegistrationEditDialog({ registration, open, onOpenChange, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(toForm(registration));
  const [saving, setSaving] = useState(false);

  const { data: registrations = [], refresh } = useGiftShopRegistrations();
  const counts = giftShopSlotCounts(registrations);

  useEffect(() => {
    if (open) {
      setForm(toForm(registration));
      setSaving(false);
      refresh();
    }
  }, [open, registration?.id]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async () => {
    if (!form.child_name.trim()) return toast({ title: "The child's name is required", variant: 'destructive' });
    if (!form.age_band) return toast({ title: 'Select the age', variant: 'destructive' });
    if (!form.gift_1_rec) return toast({ title: 'Select who the first gift is for (for example Mother or Uncle)', variant: 'destructive' });
    if (giftShopAsksGiftGender(form.gift_1_rec) && !form.gift_1) return toast({ title: 'Select the gender of the first gift', variant: 'destructive' });
    if (form.gift_count === '2' && !form.gift_2_rec) return toast({ title: 'Select who the second gift is for (for example Mother or Uncle)', variant: 'destructive' });
    if (form.gift_count === '2' && giftShopAsksGiftGender(form.gift_2_rec) && !form.gift_2) return toast({ title: 'Select the gender of the second gift', variant: 'destructive' });
    if (!form.time_slot) return toast({ title: 'Select a time slot', variant: 'destructive' });

    // Moving this child into a different slot needs a place there.
    if (form.time_slot !== registration?.time_slot) {
      const taken = counts[form.time_slot] || 0;
      if (taken + 1 > KIDS_GIFT_SHOP_SLOT_CAPACITY) {
        return toast({ title: 'That time slot is full', description: 'Choose another slot.', variant: 'destructive' });
      }
    }

    const childName = form.child_name.trim();
    const childParts = childName.split(/\s+/);
    const guardianName = form.guardian_name.trim();
    const guardianParts = guardianName.split(/\s+/);
    const childLast = childParts.slice(1).join(' ') || (guardianParts.length > 1 ? guardianParts[guardianParts.length - 1] : '');

    setSaving(true);
    try {
      await base44.entities.ProgramRegistration.update(registration.id, {
        participant_first_name: childParts[0],
        participant_last_name: childLast,
        participant_name: childName,
        participant_phone: form.guardian_phone.trim(),
        participant_email: form.guardian_email.trim(),
        parent_guardian_name: guardianName,
        parent_guardian_phone: form.guardian_phone.trim(),
        parent_guardian_email: form.guardian_email.trim(),
        child_name: childName,
        child_age_band: form.age_band,
        gift_count: Number(form.gift_count),
        gift_1_gender: giftShopGiftGender(form.gift_1_rec, form.gift_1) || null,
        gift_2_gender: form.gift_count === '2' ? (giftShopGiftGender(form.gift_2_rec, form.gift_2) || null) : null,
        gift_1_recipient: form.gift_1_rec,
        gift_2_recipient: form.gift_count === '2' ? form.gift_2_rec : null,
        time_slot: form.time_slot,
      });
      toast({ title: 'Registration updated' });
      refresh();
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Could not update the registration', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit registration</DialogTitle>
          <DialogDescription>Change this child's details, gifts or shopping slot.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm font-semibold">Child</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Child's name *</Label><Input value={form.child_name} onChange={e => set('child_name', e.target.value)} /></div>
              <div className="space-y-1.5">
                <Label>Age *</Label>
                <Select value={form.age_band} onValueChange={v => set('age_band', v)}>
                  <SelectTrigger><SelectValue placeholder="Select age" /></SelectTrigger>
                  <SelectContent>{KIDS_GIFT_SHOP_AGE_BANDS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>How many gifts *</Label>
                <Select value={form.gift_count} onValueChange={v => set('gift_count', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 gift</SelectItem>
                    <SelectItem value="2">2 gifts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <GiftFields
              title="Gift 1"
              gender={form.gift_1}
              recipient={form.gift_1_rec}
              onGender={v => set('gift_1', v)}
              onRecipient={v => set('gift_1_rec', v)}
            />
            <GiftFields
              title="Gift 2"
              gender={form.gift_2}
              recipient={form.gift_2_rec}
              onGender={v => set('gift_2', v)}
              onRecipient={v => set('gift_2_rec', v)}
              disabled={form.gift_count !== '2'}
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold">Guardian</p>
            <div className="space-y-1.5"><Label>Guardian name</Label><Input value={form.guardian_name} onChange={e => set('guardian_name', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Contact number</Label><Input value={form.guardian_phone} onChange={e => set('guardian_phone', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.guardian_email} onChange={e => set('guardian_email', e.target.value)} /></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Time slot *</p>
              <p className="text-xs text-muted-foreground">Places left</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {KIDS_GIFT_SHOP_TIME_SLOTS.map(slot => {
                const remaining = Math.max(0, KIDS_GIFT_SHOP_SLOT_CAPACITY - (counts[slot.value] || 0));
                const isCurrent = form.time_slot === slot.value;
                const unavailable = !isCurrent && remaining < 1;
                return (
                  <button
                    key={slot.value}
                    type="button"
                    disabled={unavailable}
                    onClick={() => set('time_slot', slot.value)}
                    className={cn(
                      'rounded-md border px-2 py-1.5 text-xs font-medium transition-colors',
                      unavailable
                        ? 'bg-muted text-muted-foreground/60 cursor-not-allowed line-through'
                        : isCurrent
                          ? 'border-primary bg-primary/10'
                          : 'hover:bg-muted'
                    )}
                  >
                    <span className="block">{slot.label}</span>
                    <span className="block text-[10px] text-muted-foreground">{remaining}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}