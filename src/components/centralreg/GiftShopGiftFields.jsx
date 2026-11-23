import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { KIDS_GIFT_SHOP_GENDERS, KIDS_GIFT_SHOP_RECIPIENTS } from '@/lib/centralRegConstants';
import { giftShopAsksGiftGender } from '@/lib/giftShopFamilies';

// One gift block for a Kids Gift Shop child — who the gift is for first, then the
// gender only when Other or Caregiver is chosen, asked the same way the
// pre-registration link asks a family.
export default function GiftShopGiftFields({ title, gender, recipient, onGender, onRecipient, disabled = false }) {
  const asksGender = giftShopAsksGiftGender(recipient);

  return (
    <div className={cn('rounded-md border bg-muted/20 p-3 space-y-2', disabled && 'opacity-50')}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className={cn('grid gap-3', asksGender && 'grid-cols-2')}>
        <div className="space-y-1.5">
          <Label>Who is the gift for? *</Label>
          <Select value={recipient} onValueChange={onRecipient} disabled={disabled}>
            <SelectTrigger><SelectValue placeholder={disabled ? '—' : 'Select'} /></SelectTrigger>
            <SelectContent>{KIDS_GIFT_SHOP_RECIPIENTS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {asksGender && (
          <div className="space-y-1.5">
            <Label>The gift is for a… *</Label>
            <Select value={gender} onValueChange={onGender} disabled={disabled}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{KIDS_GIFT_SHOP_GENDERS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}