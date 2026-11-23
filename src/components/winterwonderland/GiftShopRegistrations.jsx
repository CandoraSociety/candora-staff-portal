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
import { groupGiftShopFamilies, giftShopSlotCounts, giftShopAgeBandCounts, giftShopGiftTally, giftShopRecipientLabel } from '@/lib/giftShopFamilies';
import { useGiftShopRegistrations } from '@/lib/useGiftShopRegistrations';
import { useGiftShopTexts } from '@/lib/useGiftShopTexts';

// Kids Gift Shop registration tab — the children signed up for a shopping slot,
// with each slot's remaining places.
export default function GiftShopRegistrations() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [slot, setSlot] = useState('');
  const { toast } = useToast();
  // Always the published app's address — never the builder preview's, which
  // would hand families a link that only works for the builder.
  const generalLink = generalRegistrationLink();

  const copyGeneralLink = async () => {
    await navigator.clipboard.writeText(generalLink);
    toast({ title: 'Link copied', description: 'Paste it wherever you want to share it.' });
  };

  const { data: registrations = [], isLoading, refresh } = useGiftShopRegistrations();
  const { texts, refresh: refreshTexts } = useGiftShopTexts();

  const active = registrations.filter(r => !['declined', 'withdrawn'].includes(r.status));
  const giftsRequested = active.reduce((sum, r) => sum + (r.gift_count || 1), 0);
  const giftTally = giftShopGiftTally(active);
  const byRecipient = Object.entries(giftTally.recipients)
    .map(([value, count]) => ({ value, count, label: giftShopRecipientLabel(value) }))
    .sort((a, b) => b.count - a.count);
  const counts = giftShopSlotCounts(active);
  const ageBands = giftShopAgeBandCounts(active);
  const openSlots = KIDS_GIFT_SHOP_TIME_SLOTS.filter(s => (counts[s.value] || 0) < KIDS_GIFT_SHOP_SLOT_CAPACITY).length;
  // Siblings registered by the same guardian into the same slot share one card.
  const families = groupGiftShopFamilies(active).sort((a, b) => (a.time_slot || '').localeCompare(b.time_slot || ''));

  return (
    <div className="space-y-4">
      <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardContent className="pt-5 space-y-2">
          <div className="flex items-start gap-2">
            <span className="h-6 w-6 rounded-md bg-gradient-to-br from-accent to-highlight flex items-center justify-center flex-shrink-0 shadow-sm">
              <Link2 className="h-3.5 w-3.5 text-white" />
            </span>
            <div>
              <p className="text-sm font-semibold">General registration link</p>
              <p className="text-sm text-muted-foreground">
                Open to everyone — share it however you like. It closes on December 9th, or as soon as every shopping time is full.
              </p>
            </div>
          </div>
          <p className="text-xs bg-card border border-primary/30 rounded px-2 py-1 break-all text-accent">{generalLink}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={copyGeneralLink}><Copy className="h-3.5 w-3.5" /> Copy link</Button>
            <Button size="sm" variant="outline" onClick={() => window.open(generalLink, '_blank', 'noopener')}>
              <ExternalLink className="h-3.5 w-3.5" /> Open form
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-accent">Registrations</p>
            <p className="text-2xl font-bold text-accent">{active.length}</p>
            <div className="mt-2 flex items-center gap-4 border-t border-primary/30 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Ages 0–5</span>
                <span className="border-l border-primary/40 pl-2 text-base font-bold leading-none text-accent">{ageBands['0-5']}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Ages 6–16</span>
                <span className="border-l border-primary/40 pl-2 text-base font-bold leading-none text-highlight">{ageBands['6-16']}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-highlight/30 bg-gradient-to-br from-highlight/10 via-card to-card">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-highlight">Gifts requested</p>
            <p className="text-2xl font-bold text-highlight">{giftsRequested}</p>
            <div className="mt-2 flex items-center gap-4 border-t border-highlight/30 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Female gifts</span>
                <span className="border-l border-highlight/30 pl-2 text-base font-bold leading-none text-highlight">{giftTally.female}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Male gifts</span>
                <span className="border-l border-highlight/30 pl-2 text-base font-bold leading-none text-accent">{giftTally.male}</span>
              </div>
            </div>
            {byRecipient.length > 0 && (
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                {byRecipient.map(r => `${r.label} ${r.count}`).join(' · ')}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-accent/25 bg-gradient-to-br from-accent/10 via-card to-card">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-accent">Slots still open</p>
            <p className="text-2xl font-bold text-accent">{openSlots} <span className="text-sm font-semibold text-accent/70">of {KIDS_GIFT_SHOP_TIME_SLOTS.length}</span></p>
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
                    ? 'border-destructive/30 bg-destructive/5'
                    : 'border-primary/40 bg-primary/5 hover:border-primary'
                } ${active ? 'border-primary bg-primary/15 ring-2 ring-primary/40' : ''}`}
              >
                <p className="text-xs font-medium">{s.label}</p>
                <p className={`text-[10px] font-semibold ${full ? 'text-destructive' : 'text-accent'}`}>
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
              <GiftShopFamilyCard
                key={family.key}
                family={family}
                texts={texts}
                onTextsChanged={refreshTexts}
                onClick={() => setSelectedKey(family.key)}
              />
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