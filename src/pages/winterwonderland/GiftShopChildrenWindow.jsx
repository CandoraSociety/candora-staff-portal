import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer, RefreshCw, Users } from 'lucide-react';
import { KIDS_GIFT_SHOP_SLOT_CAPACITY } from '@/lib/centralRegConstants';
import { groupGiftShopFamilies, giftShopSlotLabel, giftShopTagGifts, giftShopChildFullName } from '@/lib/giftShopFamilies';
import { useGiftShopRegistrations } from '@/lib/useGiftShopRegistrations';

const statusPill = (status) => ['approved', 'enrolled'].includes(status)
  ? { label: 'Confirmed', className: 'bg-green-100 text-green-700' }
  : status === 'waitlisted'
    ? { label: 'Waitlist', className: 'bg-amber-100 text-amber-700' }
    : { label: status, className: 'bg-muted text-muted-foreground' };

// Registered children, opened in its own window from the Kids Gift Shop tab —
// a clean check-in list with each family's children together.
export default function GiftShopChildrenWindow() {
  const { data: registrations = [], isLoading, refetch, isFetching } = useGiftShopRegistrations();

  const active = registrations.filter(r => !['declined', 'withdrawn'].includes(r.status));
  const families = groupGiftShopFamilies(active).sort((a, b) => (a.time_slot || '').localeCompare(b.time_slot || ''));
  const children = active.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <h1 className="font-display font-bold text-sm leading-tight">Kids Gift Shop — Registered Children</h1>
              <p className="text-xs text-muted-foreground leading-tight">{families.length} {families.length === 1 ? 'family' : 'families'} · {children} {children === 1 ? 'child' : 'children'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button size="sm" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" /> Print</Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading registrations…</p>
        ) : families.length === 0 ? (
          <p className="text-sm text-muted-foreground">No children registered for the Kids Gift Shop yet.</p>
        ) : families.map(family => {
          const pill = statusPill(family.children.some(c => c.status === 'waitlisted') ? 'waitlisted' : family.children[0].status);
          return (
            <div key={family.key} className="rounded-xl border bg-card p-3">
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
                      <p className="text-xs text-muted-foreground">Age {child.child_age_band || '—'} · {giftShopTagGifts(child)}</p>
                    </div>
                  ))}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${pill.className}`}>{pill.label}</span>
              </div>
              <div className="mt-2 border-t pt-2 text-xs text-muted-foreground">
                {giftShopSlotLabel(family.time_slot)}
                {family.guardian_name ? ` · ${family.guardian_name}` : ''}
                {family.guardian_phone ? ` · ${family.guardian_phone}` : ''}
              </div>
            </div>
          );
        })}
        {families.length > 0 && (
          <p className="text-xs text-muted-foreground pt-1">Each slot holds {KIDS_GIFT_SHOP_SLOT_CAPACITY} registrations.</p>
        )}
      </div>
    </div>
  );
}