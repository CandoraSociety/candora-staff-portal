import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Gift, ShoppingBag } from 'lucide-react';
import { KIDS_GIFT_SHOP_TIME_SLOTS } from '@/lib/centralRegConstants';
import GiftShopSearchInput from '@/components/winterwonderland/GiftShopSearchInput';
import { filterFamilies } from '@/lib/giftShopSearch';
import { giftShopFamilyCompleted, giftShopFamilyShopping } from '@/lib/giftShopFamilies';

const countChildren = (families) => families.reduce((n, f) => n + (f.children?.length || 0), 0);
const allIn = (family) => (family.children || []).every(c => c.checked_in);

// Time-slot board for the Kids Gift Shop: pick a shopping time to see only the
// families booked into it, with the children already signed in kept apart from
// those still to arrive.
export default function GiftShopSlotBoard({ families, renderFamily, slot: controlledSlot, onSelectSlot, hideSlots = false, emptyText = 'No children registered for this time slot.' }) {
  const [internalSlot, setInternalSlot] = useState('');
  const [query, setQuery] = useState('');
  const slot = controlledSlot !== undefined ? controlledSlot : internalSlot;
  const setSlot = onSelectSlot || setInternalSlot;

  const slots = KIDS_GIFT_SHOP_TIME_SLOTS
    .map(s => {
      const inSlot = families.filter(f => (f.time_slot || '') === s.value);
      return { ...s, total: countChildren(inSlot), signed: countChildren(inSlot.filter(allIn)) };
    })
    .filter(s => s.total > 0);

  const matching = filterFamilies(families, query);
  const shown = slot ? matching.filter(f => (f.time_slot || '') === slot) : matching;
  // Children an elf has closed out are finished and go to their own section, so
  // the desk can see at a glance who is still shopping.
  // An elf has begun shopping with the family but not yet returned them, so the
  // desk can see who is out on the floor right now.
  const shopping = shown.filter(f => !giftShopFamilyCompleted(f) && giftShopFamilyShopping(f));
  const completed = shown.filter(giftShopFamilyCompleted);
  const waiting = shown.filter(f => !allIn(f) && !giftShopFamilyCompleted(f) && !giftShopFamilyShopping(f));
  const signedIn = shown.filter(f => allIn(f) && !giftShopFamilyCompleted(f) && !giftShopFamilyShopping(f));
  const searching = !!query.trim();

  return (
    <div className="space-y-4">
      <GiftShopSearchInput value={query} onChange={setQuery} />

      {!hideSlots && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={slot ? 'outline' : 'default'}
            onClick={() => setSlot('')}
          >
            All times
          </Button>
          {slots.map(s => (
            <Button
              key={s.value}
              size="sm"
              variant={slot === s.value ? 'default' : 'outline'}
              className="h-auto flex-col items-start gap-0 py-1.5"
              onClick={() => setSlot(slot === s.value ? '' : s.value)}
            >
              <span className="text-xs font-semibold">{s.label}</span>
              <span className="text-[10px] font-normal opacity-80">
                {s.signed} of {s.total} signed in
              </span>
            </Button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {searching && matching.length === 0
            ? `No family matches “${query.trim()}”.`
            : searching
              ? `No family in ${slot ? 'this time slot' : 'the list'} matches “${query.trim()}”.`
              : emptyText}
        </p>
      ) : (
        <div className="space-y-5">
          {waiting.length > 0 && (
            <section className="space-y-2">
              <h3 className="flex items-center gap-1.5 text-sm font-display font-semibold text-amber-700">
                <Clock className="h-4 w-4" /> Not signed in yet
                <span className="text-xs font-normal text-muted-foreground">({countChildren(waiting)})</span>
              </h3>
              {waiting.map(renderFamily)}
            </section>
          )}

          {signedIn.length > 0 && (
            <section className="space-y-2">
              <h3 className="flex items-center gap-1.5 text-sm font-display font-semibold text-green-700">
                <CheckCircle2 className="h-4 w-4" /> Signed in
                <span className="text-xs font-normal text-muted-foreground">({countChildren(signedIn)})</span>
              </h3>
              {signedIn.map(renderFamily)}
            </section>
          )}

          {shopping.length > 0 && (
            <section className="space-y-2">
              <h3 className="flex items-center gap-1.5 text-sm font-display font-semibold text-highlight">
                <ShoppingBag className="h-4 w-4" /> Shopping
                <span className="text-xs font-normal text-muted-foreground">({countChildren(shopping)})</span>
              </h3>
              {shopping.map(renderFamily)}
            </section>
          )}

          {completed.length > 0 && (
            <section className="space-y-2">
              <h3 className="flex items-center gap-1.5 text-sm font-display font-semibold text-accent">
                <Gift className="h-4 w-4" /> Completed
                <span className="text-xs font-normal text-muted-foreground">({countChildren(completed)})</span>
              </h3>
              {completed.map(renderFamily)}
            </section>
          )}
        </div>
      )}
    </div>
  );
}