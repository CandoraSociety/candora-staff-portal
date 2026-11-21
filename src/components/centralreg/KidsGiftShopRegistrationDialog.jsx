import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  KIDS_GIFT_SHOP_TIME_SLOTS,
  KIDS_GIFT_SHOP_SLOT_CAPACITY,
  KIDS_GIFT_SHOP_AGE_BANDS,
  KIDS_GIFT_SHOP_GENDERS,
  today,
} from '@/lib/centralRegConstants';

const EMPTY_FORM = {
  guardian_name: '',
  guardian_phone: '',
  guardian_email: '',
  child_name: '',
  age_band: '',
  gift_count: '1',
  gift_1: '',
  gift_2: '',
  time_slot: '',
};

const countsBySlot = (registrations) => registrations
  .filter(r => !['declined', 'withdrawn'].includes(r.status))
  .reduce((acc, r) => {
    if (r.time_slot) acc[r.time_slot] = (acc[r.time_slot] || 0) + 1;
    return acc;
  }, {});

// Kids Gift Shop registration — guardian details, the child, the age band, how
// many gifts and for whom, and a shopping slot. A slot holds 25 registrations
// and closes itself once it is full.
export default function KidsGiftShopRegistrationDialog({ open, onOpenChange, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const { data: existing = [], refetch } = useQuery({
    queryKey: ['kgsSlotCounts'],
    queryFn: () => base44.entities.ProgramRegistration
      .filter({ program_name: 'Kids Gift Shop' }, { limit: 500 })
      .then(res => res.items || []),
    enabled: open,
  });

  const counts = countsBySlot(existing);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setSaving(false);
      refetch();
    }
  }, [open]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async () => {
    if (!form.guardian_name.trim()) return toast({ title: 'Guardian name is required', variant: 'destructive' });
    if (!form.guardian_phone.trim()) return toast({ title: 'Guardian contact number is required', variant: 'destructive' });
    if (!form.child_name.trim()) return toast({ title: "Child's name is required", variant: 'destructive' });
    if (!form.age_band) return toast({ title: "Select the child's age", variant: 'destructive' });
    if (!form.gift_1) return toast({ title: 'Select who gift one is for', variant: 'destructive' });
    if (form.gift_count === '2' && !form.gift_2) return toast({ title: 'Select who gift two is for', variant: 'destructive' });
    if (!form.time_slot) return toast({ title: 'Select a time slot', variant: 'destructive' });

    setSaving(true);
    try {
      // Re-check the slot right before saving so two people cannot take the last place.
      const slotRegistrations = await base44.entities.ProgramRegistration
        .filter({ program_name: 'Kids Gift Shop', time_slot: form.time_slot }, { limit: 100 })
        .then(res => res.items || []);
      const taken = countsBySlot(slotRegistrations)[form.time_slot] || 0;
      if (taken >= KIDS_GIFT_SHOP_SLOT_CAPACITY) {
        toast({ title: 'That time slot just filled up', description: 'Choose another slot.', variant: 'destructive' });
        refetch();
        setSaving(false);
        return;
      }

      const guardianName = form.guardian_name.trim();
      const childName = form.child_name.trim();
      const childParts = childName.split(/\s+/);
      const guardianParts = guardianName.split(/\s+/);
      const childLast = childParts.slice(1).join(' ') || (guardianParts.length > 1 ? guardianParts[guardianParts.length - 1] : '');

      await base44.entities.ProgramRegistration.create({
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
        child_age_band: form.age_band,
        gift_count: Number(form.gift_count),
        gift_1_gender: form.gift_1,
        gift_2_gender: form.gift_count === '2' ? form.gift_2 : undefined,
        time_slot: form.time_slot,
      });

      toast({
        title: 'Registration saved',
        description: `${childName} — ${KIDS_GIFT_SHOP_TIME_SLOTS.find(s => s.value === form.time_slot)?.label}`,
      });
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
          <DialogDescription>One child per registration. Each time slot holds {KIDS_GIFT_SHOP_SLOT_CAPACITY} registrations.</DialogDescription>
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
            <p className="text-sm font-semibold mb-2">Child</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Child's name *</Label><Input value={form.child_name} onChange={e => set('child_name', e.target.value)} /></div>
              <div className="space-y-1.5">
                <Label>Age *</Label>
                <Select value={form.age_band} onValueChange={v => set('age_band', v)}>
                  <SelectTrigger><SelectValue placeholder="Select age" /></SelectTrigger>
                  <SelectContent>{KIDS_GIFT_SHOP_AGE_BANDS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">Gifts</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>How many gifts *</Label>
                <Select value={form.gift_count} onValueChange={v => set('gift_count', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Gift one *</Label>
                <Select value={form.gift_1} onValueChange={v => set('gift_1', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{KIDS_GIFT_SHOP_GENDERS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Gift two{form.gift_count === '2' ? ' *' : ''}</Label>
                <Select value={form.gift_2} onValueChange={v => set('gift_2', v)} disabled={form.gift_count !== '2'}>
                  <SelectTrigger><SelectValue placeholder={form.gift_count === '2' ? 'Select' : '—'} /></SelectTrigger>
                  <SelectContent>{KIDS_GIFT_SHOP_GENDERS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Time slot *</p>
              <p className="text-xs text-muted-foreground">{KIDS_GIFT_SHOP_SLOT_CAPACITY} per slot</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {KIDS_GIFT_SHOP_TIME_SLOTS.map(slot => {
                const taken = counts[slot.value] || 0;
                const full = taken >= KIDS_GIFT_SHOP_SLOT_CAPACITY;
                const selected = form.time_slot === slot.value;
                return (
                  <button
                    key={slot.value}
                    type="button"
                    disabled={full}
                    onClick={() => set('time_slot', slot.value)}
                    className={cn(
                      'rounded-md border px-2 py-1.5 text-left transition-colors',
                      full
                        ? 'bg-muted text-muted-foreground/60 cursor-not-allowed'
                        : selected
                          ? 'border-primary bg-primary/10'
                          : 'hover:bg-muted'
                    )}
                  >
                    <span className={cn('block text-xs font-medium', full && 'line-through')}>{slot.label}</span>
                    <span className="block text-[10px] text-muted-foreground">{full ? 'Full' : `${taken}/${KIDS_GIFT_SHOP_SLOT_CAPACITY}`}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Register'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}