import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, ExternalLink, QrCode, Users } from 'lucide-react';
import GiftShopFamilyCard from '@/components/winterwonderland/GiftShopFamilyCard';
import GiftShopCheckInDialog from '@/components/winterwonderland/GiftShopCheckInDialog';
import GiftShopCheckinQrDialog from '@/components/winterwonderland/GiftShopCheckinQrDialog';
import GiftShopSlotBoard from '@/components/winterwonderland/GiftShopSlotBoard';
import { useGiftShopRegistrations } from '@/lib/useGiftShopRegistrations';
import { useGiftShopTexts } from '@/lib/useGiftShopTexts';
import { groupGiftShopFamilies, giftShopAgeBandCounts } from '@/lib/giftShopFamilies';

// Sign-In tab — the same registration cards, sorted by shopping time, for
// working the door. Signing a child in here writes to the same registration, so
// every other area updates with it.
export default function GiftShopSignIn({ standalone = false }) {
  const [selectedKey, setSelectedKey] = useState(null);
  const [qrOpen, setQrOpen] = useState(false);
  const { data: registrations = [], isLoading, refresh } = useGiftShopRegistrations();
  const { texts, refresh: refreshTexts } = useGiftShopTexts();

  const active = registrations.filter(r => !['declined', 'withdrawn'].includes(r.status));
  const families = groupGiftShopFamilies(active).sort((a, b) => (a.time_slot || '').localeCompare(b.time_slot || ''));
  const signedIn = active.filter(r => r.checked_in).length;
  const waiting = active.length - signedIn;
  const ageBands = giftShopAgeBandCounts(active);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-highlight/30 bg-gradient-to-br from-highlight/10 via-card to-card">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-highlight flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Checked In</p>
            <p className="text-2xl font-bold text-highlight">{signedIn} <span className="text-sm font-semibold text-highlight/70">of {active.length}</span></p>
            <div className="mt-2 flex items-center gap-4 border-t border-highlight/30 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Ages 0–5</span>
                <span className="border-l border-highlight/40 pl-2 text-base font-bold leading-none text-accent">{ageBands['0-5']}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Ages 6–16</span>
                <span className="border-l border-highlight/40 pl-2 text-base font-bold leading-none text-highlight">{ageBands['6-16']}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-accent flex items-center gap-1"><Clock className="h-3 w-3" /> Still to sign in</p>
            <p className="text-2xl font-bold text-accent">{waiting}</p>
          </CardContent>
        </Card>
        <Card className="border-accent/25 bg-gradient-to-br from-accent/10 via-card to-card">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-accent flex items-center gap-1"><Users className="h-3 w-3" /> Families</p>
            <p className="text-2xl font-bold text-accent">{families.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-display font-semibold">Check-in</h2>
          <p className="text-xs text-muted-foreground">
            Pick a shopping time, then tap a family to sign the children in and print their name tags. Sign-ins update on every screen as they happen.
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <Button size="sm" onClick={() => setQrOpen(true)}>
            <QrCode className="h-3.5 w-3.5" /> Check-in QR
          </Button>
          {!standalone && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open('/winter-wonderland/kids-gift-shop/sign-in', '_blank', 'noopener')}
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open in new window
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Loading registrations…</p></CardContent></Card>
      ) : families.length === 0 ? (
        <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">No children registered for the Kids Gift Shop yet.</p></CardContent></Card>
      ) : (
        <GiftShopSlotBoard
          families={families}
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
      )}

      <GiftShopCheckInDialog
        family={selectedKey ? families.find(f => f.key === selectedKey) : null}
        open={!!selectedKey}
        onOpenChange={(o) => { if (!o) setSelectedKey(null); }}
        onChanged={refresh}
      />

      <GiftShopCheckinQrDialog open={qrOpen} onOpenChange={setQrOpen} />
    </div>
  );
}