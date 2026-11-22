import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';
import GiftFields from '@/components/centralreg/GiftShopGiftFields';
import {
  KIDS_GIFT_SHOP_TIME_SLOTS,
  KIDS_GIFT_SHOP_SLOT_CAPACITY,
  KIDS_GIFT_SHOP_AGE_BANDS,
  today,
} from '@/lib/centralRegConstants';
import { giftShopSlotCounts } from '@/lib/giftShopFamilies';
import { useGiftShopRegistrations } from '@/lib/useGiftShopRegistrations';

let childKey = 0;
const emptyChild = () => ({
  key: `c${++childKey}`,
  child_name: '',
  age_band: '',
  gift_count: '1',
  gift_1: '',
  gift_1_rec: '',
  gift_2: '',
  gift_2_rec: '',
});
const emptyForm = () => ({ guardian_name: '', guardian_phone: '', guardian_email: '', time_slot: '', children: [emptyChild()] });

// Kids Gift Shop registration — one guardian, one or more children (same family),
// each with their age band, how many gifts and who each gift is for, and one
// shared shopping slot. A slot holds 25 registrations and closes itself once it
// is full.
export default function KidsGiftShopRegistrationDialog({ open, onOpenChange, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // The same live registration list the rest of the gift shop uses, so places
  // taken through a pre-registration link are already counted here.
  const { data: existing = [], refresh } = useGiftShopRegistrations();

  const counts = giftShopSlotCounts(existing);
  const placesNeeded = form.children.length;

  useEffect(() => {
    if (open) {
      setForm(emptyForm());
      setSaving(false);
      refresh();
    }
  }, [open]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const setChild = (key, field, value) => setForm(f => ({
    ...f,
    children: f.children.map(c => c.key === key ? { ...c, [field]: value } : c),
  }));
  const addChild = () => setForm(f => ({ ...f, children: [...f.children, emptyChild()] }));
  const removeChild = (key) => setForm(f => ({ ...f, children: f.children.filter(c => c.key !== key) }));

  const handleSave = async () => {
    if (!form.guardian_name.trim()) return toast({ title: 'Guardian name is required', variant: 'destructive' });
    if (!form.guardian_phone.trim()) return toast({ title: 'Guardian contact number is required', variant: 'destructive' });
    for (const [i, child] of form.children.entries()) {
      const label = form.children.length > 1 ? `Child ${i + 1}: ` : '';
      if (!child.child_name.trim()) return toast({ title: `${label}name is required`, variant: 'destructive' });
      if (!child.age_band) return toast({ title: `${label}select the age`, variant: 'destructive' });
      if (!child.gift_1) return toast({ title: `${label}select who gift one is for`, variant: 'destructive' });
      if (!child.gift_1_rec) return toast({ title: `${label}select who the first gift is for (for example Mother or Uncle)`, variant: 'destructive' });
      if (child.gift_count === '2' && !child.gift_2) return toast({ title: `${label}select who gift two is for`, variant: 'destructive' });
      if (child.gift_count === '2' && !child.gift_2_rec) return toast({ title: `${label}select who the second gift is for (for example Mother or Uncle)`, variant: 'destructive' });
    }
    if (!form.time_slot) return toast({ title: 'Select a time slot', variant: 'destructive' });

    setSaving(true);
    try {
      // Re-check the slot right before saving so a family cannot take more places than are left.
      const slotRegistrations = await base44.entities.ProgramRegistration
        .filter({ program_name: 'Kids Gift Shop', time_slot: form.time_slot }, { limit: 100 })
        .then(res => res.items || []);
      const taken = giftShopSlotCounts(slotRegistrations)[form.time_slot] || 0;
      if (taken + placesNeeded > KIDS_GIFT_SHOP_SLOT_CAPACITY) {
        toast({
          title: 'That time slot does not have enough places left',
          description: `${KIDS_GIFT_SHOP_SLOT_CAPACITY - taken} of ${placesNeeded} places available. Choose another slot.`,
          variant: 'destructive',
        });
        refresh();
        setSaving(false);
        return;
      }

      const guardianName = form.guardian_name.trim();
      const guardianParts = guardianName.split(/\s+/);
      const records = form.children.map(child => {
        const childName = child.child_name.trim();
        const childParts = childName.split(/\s+/);
        const childLast = childParts.slice(1).join(' ') || (guardianParts.length > 1 ? guardianParts[guardianParts.length - 1] : '');
        return {
          participant_first_name: childParts[0],
          participant_last_name: childLast,
          participant_name: childName,
          participant_phone: form.guardian_phone.trim(),
          participant_email: form.guardian_email.trim(),
          program_portal: 'other',
          program_name: 'Kids Gift Shop',
          registration_date: today(),
          status: 'approved',
          parent_guardian_name: guardianName,
          parent_guardian_phone: form.guardian_phone.trim(),
          parent_guardian_email: form.guardian_email.trim(),
          child_name: childName,
          child_age_band: child.age_band,
          gift_count: Number(child.gift_count),
          gift_1_gender: child.gift_1,
          gift_2_gender: child.gift_count === '2' ? child.gift_2 : undefined,
          gift_1_recipient: child.gift_1_rec,
          gift_2_recipient: child.gift_count === '2' ? child.gift_2_rec : undefined,
          time_slot: form.time_slot,
        };
      });

      await base44.entities.ProgramRegistration.bulkCreate(records);

      toast({
        title: records.length > 1 ? `${records.length} children registered` : 'Registration saved',
        description: `${guardianName} — ${KIDS_GIFT_SHOP_TIME_SLOTS.find(s => s.value === form.time_slot)?.label}`,
      });
      refresh();
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Error saving registration', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kids Gift Shop Registration</DialogTitle>
          <DialogDescription>Register one child or several from the same family. Each time slot holds {KIDS_GIFT_SHOP_SLOT_CAPACITY} registrations.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold mb-2">Guardian</p>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Guardian name *</Label><Input value={form.guardian_name} onChange={e => set('guardian_name', e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Contact number *</Label><Input value={form.guardian_phone} onChange={e => set('guardian_phone', e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.guardian_email} onChange={e => set('guardian_email', e.target.value)} /></div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Children *</p>
              <Button type="button" size="sm" variant="outline" onClick={addChild}><Plus className="h-3.5 w-3.5" /> Add another child</Button>
            </div>
            <div className="space-y-3">
              {form.children.map((child, index) => (
                <div key={child.key} className="rounded-lg border p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {form.children.length > 1 ? `Child ${index + 1}` : 'Child'}
                    </p>
                    {form.children.length > 1 && (
                      <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-red-600" onClick={() => removeChild(child.key)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5"><Label>Child's name *</Label><Input value={child.child_name} onChange={e => setChild(child.key, 'child_name', e.target.value)} /></div>
                    <div className="space-y-1.5">
                      <Label>Age *</Label>
                      <Select value={child.age_band} onValueChange={v => setChild(child.key, 'age_band', v)}>
                        <SelectTrigger><SelectValue placeholder="Select age" /></SelectTrigger>
                        <SelectContent>{KIDS_GIFT_SHOP_AGE_BANDS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>How many gifts *</Label>
                      <Select value={child.gift_count} onValueChange={v => setChild(child.key, 'gift_count', v)}>
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
                    gender={child.gift_1}
                    recipient={child.gift_1_rec}
                    onGender={v => setChild(child.key, 'gift_1', v)}
                    onRecipient={v => setChild(child.key, 'gift_1_rec', v)}
                  />
                  {child.gift_count === '2' && (
                    <GiftFields
                      title="Gift 2"
                      gender={child.gift_2}
                      recipient={child.gift_2_rec}
                      onGender={v => setChild(child.key, 'gift_2', v)}
                      onRecipient={v => setChild(child.key, 'gift_2_rec', v)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Time slot *</p>
              <p className="text-xs text-muted-foreground">
                Places left{placesNeeded > 1 ? ` • needs ${placesNeeded}` : ''}
              </p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {KIDS_GIFT_SHOP_TIME_SLOTS.map(slot => {
                const taken = counts[slot.value] || 0;
                const remaining = Math.max(0, KIDS_GIFT_SHOP_SLOT_CAPACITY - taken);
                const unavailable = remaining < placesNeeded;
                const selected = form.time_slot === slot.value;
                return (
                  <button
                    key={slot.value}
                    type="button"
                    disabled={unavailable}
                    onClick={() => set('time_slot', slot.value)}
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
                    <span className="block text-[10px] font-semibold text-muted-foreground">{remaining}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : placesNeeded > 1 ? `Register ${placesNeeded} children` : 'Register'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}