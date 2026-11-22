import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { giftShopChildFullName, giftShopSlotLabel, giftShopTagGifts } from '@/lib/giftShopFamilies';

const statusPill = (status) => {
  if (['approved', 'enrolled'].includes(status)) return { label: 'Confirmed', className: 'bg-green-100 text-green-700' };
  if (status === 'waitlisted') return { label: 'Waitlist', className: 'bg-amber-100 text-amber-700' };
  return { label: status, className: 'bg-muted text-muted-foreground' };
};

// One registration card per family: the children's names lead, the guardian sits
// underneath. Clicking it opens sign-in and editing for that family.
export default function GiftShopFamilyCard({ family, onClick }) {
  const waitlisted = family.children.some(c => c.status === 'waitlisted');
  const pill = statusPill(waitlisted ? 'waitlisted' : family.children[0].status);
  const allSignedIn = family.children.every(c => c.checked_in);

  return (
    <Card
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
      className={`cursor-pointer border-l-4 transition-all hover:shadow-md ${
        allSignedIn
          ? 'border-l-emerald-500 border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-white hover:border-emerald-300'
          : waitlisted
            ? 'border-l-amber-400 border-amber-200 bg-gradient-to-br from-amber-50/70 via-white to-white hover:border-amber-300'
            : 'border-l-primary border-rose-200 bg-gradient-to-br from-rose-50/70 via-white to-white hover:border-primary/60'
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
          {allSignedIn ? (
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