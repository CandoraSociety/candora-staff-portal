import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import KidsGiftShopRegistrationDialog from '@/components/centralreg/KidsGiftShopRegistrationDialog';
import { KIDS_GIFT_SHOP_TIME_SLOTS, KIDS_GIFT_SHOP_SLOT_CAPACITY } from '@/lib/centralRegConstants';

const slotLabel = (value) => KIDS_GIFT_SHOP_TIME_SLOTS.find(s => s.value === value)?.label || value || 'No slot';
const genderLabel = (value) => (value === 'female' ? 'F' : value === 'male' ? 'M' : '—');

// Kids Gift Shop registration tab — the children signed up for a shopping slot,
// with each slot's remaining places.
export default function GiftShopRegistrations() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['kidsGiftShopRegistrations'],
    queryFn: () => base44.entities.ProgramRegistration.filter(
      { program_name: 'Kids Gift Shop' },
      { sort: '-created_date', limit: 500 }
    ).then(res => res.items || []),
  });

  const active = registrations.filter(r => !['declined', 'withdrawn'].includes(r.status));
  const giftsRequested = active.reduce((sum, r) => sum + (r.gift_count || 1), 0);
  const counts = active.reduce((acc, r) => {
    if (r.time_slot) acc[r.time_slot] = (acc[r.time_slot] || 0) + 1;
    return acc;
  }, {});
  const openSlots = KIDS_GIFT_SHOP_TIME_SLOTS.filter(s => (counts[s.value] || 0) < KIDS_GIFT_SHOP_SLOT_CAPACITY).length;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['kidsGiftShopRegistrations'] });
    qc.invalidateQueries({ queryKey: ['kgsSlotCounts'] });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Registrations</p><p className="text-2xl font-bold">{active.length}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Gifts requested</p><p className="text-2xl font-bold">{giftsRequested}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Slots still open</p><p className="text-2xl font-bold">{openSlots} of {KIDS_GIFT_SHOP_TIME_SLOTS.length}</p></CardContent></Card>
      </div>

      <div>
        <h2 className="text-lg font-display font-semibold mb-2">Time slots</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {KIDS_GIFT_SHOP_TIME_SLOTS.map(slot => {
            const taken = counts[slot.value] || 0;
            const full = taken >= KIDS_GIFT_SHOP_SLOT_CAPACITY;
            return (
              <div key={slot.value} className={`rounded-md border px-2 py-1.5 ${full ? 'bg-muted' : ''}`}>
                <p className="text-xs font-medium">{slot.label}</p>
                <p className={`text-[10px] ${full ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                  {full ? 'Full' : `${taken}/${KIDS_GIFT_SHOP_SLOT_CAPACITY}`}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-semibold">Registered children</h2>
        <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Register a child</Button>
      </div>

      {isLoading ? (
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Loading registrations…</p></CardContent></Card>
      ) : registrations.length === 0 ? (
        <Card><CardContent className="pt-6 text-center space-y-3"><p className="text-sm text-muted-foreground">No children registered for the Kids Gift Shop yet.</p><Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Register a child</Button></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {registrations.map(reg => {
            const gifts = `${reg.gift_count || 1} gift${(reg.gift_count || 1) > 1 ? 's' : ''} — ${genderLabel(reg.gift_1_gender)}${(reg.gift_count || 1) > 1 ? `, ${genderLabel(reg.gift_2_gender)}` : ''}`;
            return (
              <Card key={reg.id}>
                <CardContent className="pt-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{reg.child_name || reg.participant_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Age {reg.child_age_band || '—'} • {slotLabel(reg.time_slot)}
                      {reg.registration_date ? ` • ${new Date(reg.registration_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">{reg.parent_guardian_name}{reg.parent_guardian_phone ? ` • ${reg.parent_guardian_phone}` : ''}</p>
                    <p className="text-xs mt-1 text-foreground/80">{gifts}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${['approved', 'enrolled'].includes(reg.status) ? 'bg-green-100 text-green-700' : reg.status === 'waitlisted' ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}>
                    {['approved', 'enrolled'].includes(reg.status) ? 'Confirmed' : reg.status === 'waitlisted' ? 'Waitlist' : reg.status}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <KidsGiftShopRegistrationDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={refresh} />
    </div>
  );
}