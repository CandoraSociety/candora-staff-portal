import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ExternalLink } from 'lucide-react';
import KidsGiftShopRegistrationDialog from '@/components/centralreg/KidsGiftShopRegistrationDialog';
import GiftShopFamilyCard from '@/components/winterwonderland/GiftShopFamilyCard';
import GiftShopCheckInDialog from '@/components/winterwonderland/GiftShopCheckInDialog';
import GiftShopSlotBoard from '@/components/winterwonderland/GiftShopSlotBoard';
import { KIDS_GIFT_SHOP_TIME_SLOTS, KIDS_GIFT_SHOP_SLOT_CAPACITY } from '@/lib/centralRegConstants';
import { groupGiftShopFamilies, giftShopSlotCounts, giftShopAgeBandCounts } from '@/lib/giftShopFamilies';
import { useGiftShopRegistrations } from '@/lib/useGiftShopRegistrations';

// Kids Gift Shop registration tab — the children signed up for a shopping slot,
// with each slot's remaining places.
export default function GiftShopRegistrations() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [slot, setSlot] = useState('');

  const { data: registrations = [], isLoading, refresh } = useGiftShopRegistrations();

  const active = registrations.filter(r => !['declined', 'withdrawn'].includes(r.status));
  const giftsRequested = active.reduce((sum, r) => sum + (r.gift_count || 1), 0);
  const counts = giftShopSlotCounts(active);
  const ageBands = giftShopAgeBandCounts(active);
  const openSlots = KIDS_GIFT_SHOP_TIME_SLOTS.filter(s => (counts[s.value] || 0) < KIDS_GIFT_SHOP_SLOT_CAPACITY).length;
  // Siblings registered by the same guardian into the same slot share one card.
  const families = groupGiftShopFamilies(active).sort((a, b) => (a.time_slot || '').localeCompare(b.time_slot || ''));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Registrations</p>
            <p className="text-2xl font-bold">{active.length}</p>
            <div className="mt-2 flex gap-4 border-t pt-2">
              <p className="text-xs text-muted-foreground">Ages 0–5 <span className="font-semibold text-foreground">{ageBands['0-5']}</span></p>
              <p className="text-xs text-muted-foreground">Ages 6–16 <span className="font-semibold text-foreground">{ageBands['6-16']}</span></p>
            </div>
          </CardContent>
        </Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Gifts requested</p><p className="text-2xl font-bold">{giftsRequested}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Slots still open</p><p className="text-2xl font-bold">{openSlots} of {KIDS_GIFT_SHOP_TIME_SLOTS.length}</p></CardContent></Card>
      </div>

      <div>
        <h2 className="text-lg font-display font-semibold mb-2">Time slots</h2>
        <p className="text-xs text-muted-foreground mb-2">Tap a time to see only the children booked into it.</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {KIDS_GIFT_SHOP_TIME_SLOTS.map(s => {
            const remaining = Math.max(0, KIDS_GIFT_SHOP_SLOT_CAPACITY - (counts[s.value] || 0));
            const full = remaining === 0;
            const active = slot === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setSlot(active ? '' : s.value)}
                className={`rounded-md border px-2 py-1.5 text-left transition-colors ${full ? 'bg-muted' : 'hover:border-primary/50'} ${active ? 'border-primary ring-2 ring-primary/30' : ''}`}
              >
                <p className="text-xs font-medium">{s.label}</p>
                <p className={`text-[10px] ${full ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                  {remaining}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-semibold">Registered children</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => window.open('/winter-wonderland/kids-gift-shop/children', '_blank', 'noopener')}>
            <ExternalLink className="h-3.5 w-3.5" /> Open in new window
          </Button>
          <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Register a child</Button>
        </div>
      </div>

      {isLoading ? (
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Loading registrations…</p></CardContent></Card>
      ) : families.length === 0 ? (
        <Card><CardContent className="pt-6 text-center space-y-3"><p className="text-sm text-muted-foreground">No children registered for the Kids Gift Shop yet.</p><Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Register a child</Button></CardContent></Card>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Tap a registration to sign the children in and print their name tags.</p>
          <GiftShopSlotBoard
            families={families}
            slot={slot}
            onSelectSlot={setSlot}
            hideSlots
            emptyText="No children registered for this time slot."
            renderFamily={(family) => (
              <GiftShopFamilyCard key={family.key} family={family} onClick={() => setSelectedKey(family.key)} />
            )}
          />
        </div>
      )}

      <KidsGiftShopRegistrationDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={refresh} />

      <GiftShopCheckInDialog
        family={selectedKey ? families.find(f => f.key === selectedKey) : null}
        open={!!selectedKey}
        onOpenChange={(o) => { if (!o) setSelectedKey(null); }}
        onChanged={refresh}
      />
    </div>
  );
}