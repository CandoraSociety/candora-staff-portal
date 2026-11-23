import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Gift, ShoppingBag } from 'lucide-react';
import { giftShopChildFullName, giftShopFamilyCompleted, giftShopFamilyShopping, giftShopIsCompleted, giftShopIsShopping, giftShopElfName, giftShopSlotLabel, giftShopTagGifts } from '@/lib/giftShopFamilies';

const statusPill = (status) => {
  if (['approved', 'enrolled'].includes(status)) return { label: 'Confirmed', className: 'bg-green-100 text-green-700' };
  if (status === 'waitlisted') return { label: 'Waitlist', className: 'bg-amber-100 text-amber-700' };
  return { label: status, className: 'bg-muted text-muted-foreground' };
};

// One registration card per family: the children's names lead, the guardian sits
// underneath. Clicking it opens sign-in and editing for that family.
export default function GiftShopFamilyCard({ family, onClick }) {
  const waitlisted = family.children.some(c => c.status === 'waitlisted');
  // An elf closed the children out from the tag form: they finished shopping and
  // went back to their parent or guardian.
  const done = giftShopFamilyCompleted(family);
  // An elf pressed Begin shopping on the tag form, so the children are out on the
  // floor with them.
  const shopping = !done && giftShopFamilyShopping(family);
  const elfName = family.children.map(giftShopElfName).find(Boolean) || '';
  const pill = done
    ? { label: 'Completed', className: 'bg-accent/10 text-accent' }
    : shopping
      ? { label: 'Shopping', className: 'bg-highlight/15 text-highlight' }
      : statusPill(waitlisted ? 'waitlisted' : family.children[0].status);
  const allSignedIn = family.children.every(c => c.checked_in);
  // A family only reads as completed once every child is back, so show how many
  // are already returned while one is still shopping.
  const returnedCount = family.children.filter(giftShopIsCompleted).length;

  return (
    <Card
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
      className={`cursor-pointer border-l-4 transition-all hover:shadow-md ${
        done
          ? 'border-l-accent border-accent/25 bg-gradient-to-br from-accent/10 via-card to-card hover:border-accent/50'
          : allSignedIn
          ? 'border-l-highlight border-highlight/25 bg-gradient-to-br from-highlight/10 via-card to-card hover:border-highlight/50'
          : waitlisted
            ? 'border-l-muted-foreground/40 border-border bg-gradient-to-br from-muted/60 via-card to-card hover:border-muted-foreground/40'
            : 'border-l-primary border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card hover:border-primary/60'
      }`}
    >
      <CardContent className="pt-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            {family.children.map(child => (
              <div key={child.id}>
                <p className="font-display font-bold text-base leading-tight flex items-center gap-2">
                  <span className="truncate">{giftShopChildFullName(child)}</span>
                  {child.checked_in && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-600 text-white flex-shrink-0">
                      #{child.check_in_sequence}
                    </span>
                  )}
                  {giftShopIsShopping(child) && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-highlight/15 text-highlight flex-shrink-0">
                      Shopping
                    </span>
                  )}
                  {giftShopIsCompleted(child) && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent/15 text-accent flex-shrink-0">
                      Returned
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Age {child.child_age_band || '—'} • {giftShopTagGifts(child)}
                </p>
              </div>
            ))}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${pill.className}`}>{pill.label}</span>
        </div>
        <div className="border-t pt-2 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground truncate">
            {giftShopSlotLabel(family.time_slot)} • {family.guardian_name}
            {family.guardian_phone ? ` • ${family.guardian_phone}` : ''}
          </p>
          {done ? (
            <span className="text-[10px] font-semibold text-accent flex items-center gap-1 flex-shrink-0">
              <Gift className="h-3 w-3" /> Returned{elfName ? ` · ${elfName}` : ''}
            </span>
          ) : returnedCount > 0 ? (
            <span className="text-[10px] font-semibold text-accent flex items-center gap-1 flex-shrink-0">
              <Gift className="h-3 w-3" /> {returnedCount} of {family.children.length} returned
            </span>
          ) : shopping ? (
            <span className="text-[10px] font-semibold text-highlight flex items-center gap-1 flex-shrink-0">
              <ShoppingBag className="h-3 w-3" /> Out shopping{elfName ? ` · ${elfName}` : ''}
            </span>
          ) : allSignedIn ? (
            <span className="text-[10px] font-semibold text-green-700 flex items-center gap-1 flex-shrink-0">
              <CheckCircle2 className="h-3 w-3" /> Signed in
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground flex-shrink-0">Tap to sign in</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}