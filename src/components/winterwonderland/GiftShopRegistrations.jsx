import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ExternalLink, Copy, Link2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { generalRegistrationLink } from '@/lib/giftShopInvites';
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
  const { toast } = useToast();
  const generalLink = generalRegistrationLink(window.location.origin);

  const copyGeneralLink = async () => {
    await navigator.clipboard.writeText(generalLink);
    toast({ title: 'Link copied', description: 'Paste it wherever you want to share it.' });
  };

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
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white">
        <CardContent className="pt-5 space-y-2">
          <div className="flex items-start gap-2">
            <span className="h-6 w-6 rounded-md bg-gradient-to-br from-amber-400 to-yellow-300 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Link2 className="h-3.5 w-3.5 text-white" />
            </span>
            <div>
              <p className="text-sm font-semibold">General registration link</p>
              <p className="text-sm text-muted-foreground">
                Open to everyone — share it however you like. It closes on December 9th, or as soon as every shopping time is full.
              </p>
            </div>
          </div>
          <p className="text-xs bg-white/80 border border-amber-200 rounded px-2 py-1 break-all text-amber-900">{generalLink}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={copyGeneralLink}><Copy className="h-3.5 w-3.5" /> Copy link</Button>
            <Button size="sm" variant="outline" onClick={() => window.open(generalLink, '_blank', 'noopener')}>
              <ExternalLink className="h-3.5 w-3.5" /> Open form
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-rose-200 bg-gradient-to-br from-rose-50 via-white to-white">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-rose-700">Registrations</p>
            <p className="text-2xl font-bold text-rose-700">{active.length}</p>
            <div className="mt-2 flex items-center gap-4 border-t border-rose-200/70 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Ages 0–5</span>
                <span className="border-l border-rose-200 pl-2 text-base font-bold leading-none text-pink-600">{ageBands['0-5']}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Ages 6–16</span>
                <span className="border-l border-rose-200 pl-2 text-base font-bold leading-none text-indigo-600">{ageBands['6-16']}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-emerald-700">Gifts requested</p>
            <p className="text-2xl font-bold text-emerald-700">{giftsRequested}</p>
          </CardContent>
        </Card>
        <Card className="border-sky-200 bg-gradient-to-br from-sky-50 via-white to-white">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-sky-700">Slots still open</p>
            <p className="text-2xl font-bold text-sky-700">{openSlots} <span className="text-sm font-semibold text-sky-600/80">of {KIDS_GIFT_SHOP_TIME_SLOTS.length}</span></p>
          </CardContent>
        </Card>
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
                className={`rounded-md border px-2 py-1.5 text-left transition-colors ${
                  full
                    ? 'border-rose-200 bg-rose-50/80'
                    : 'border-emerald-200 bg-emerald-50/70 hover:border-emerald-400'
                } ${active ? 'border-primary bg-primary/10 ring-2 ring-primary/40' : ''}`}
              >
                <p className="text-xs font-medium">{s.label}</p>
                <p className={`text-[10px] font-semibold ${full ? 'text-rose-600' : 'text-emerald-700'}`}>
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