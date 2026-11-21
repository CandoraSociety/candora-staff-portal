import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Printer, RefreshCw, Users } from 'lucide-react';
import { KIDS_GIFT_SHOP_SLOT_CAPACITY } from '@/lib/centralRegConstants';
import { groupGiftShopFamilies, giftShopSlotLabel, giftShopGiftSummary } from '@/lib/giftShopFamilies';

const statusPill = (status) => ['approved', 'enrolled'].includes(status)
  ? { label: 'Confirmed', className: 'bg-green-100 text-green-700' }
  : status === 'waitlisted'
    ? { label: 'Waitlist', className: 'bg-amber-100 text-amber-700' }
    : { label: status, className: 'bg-muted text-muted-foreground' };

// Registered children, opened in its own window from the Kids Gift Shop tab —
// a clean check-in list with each family's children together.
export default function GiftShopChildrenWindow() {
  const { data: registrations = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['kidsGiftShopRegistrations'],
    queryFn: () => base44.entities.ProgramRegistration.filter(
      { program_name: 'Kids Gift Shop' },
      { sort: 'time_slot', limit: 500 }
    ).then(res => res.items || []),
  });

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
                <div className="min-w-0">
                  <p className="font-medium text-sm">{family.guardian_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {giftShopSlotLabel(family.time_slot)}
                    {family.guardian_phone ? ` · ${family.guardian_phone}` : ''}
                    {family.children.length > 1 ? ` · ${family.children.length} children` : ''}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${pill.className}`}>{pill.label}</span>
              </div>
              <div className="mt-2 divide-y">
                {family.children.map(child => (
                  <div key={child.id} className="py-1.5 flex items-start justify-between gap-3 text-sm">
                    <div>
                      <p>{child.child_name || child.participant_name}</p>
                      <p className="text-xs text-muted-foreground">Age {child.child_age_band || '—'} · {giftShopGiftSummary(child)}</p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{giftShopSlotLabel(child.time_slot)}</span>
                  </div>
                ))}
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