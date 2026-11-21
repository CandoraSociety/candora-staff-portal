import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Baby } from 'lucide-react';
import KidsGiftShopRegistrationDialog from '@/components/centralreg/KidsGiftShopRegistrationDialog';
import { KIDS_GIFT_SHOP_TIME_SLOTS } from '@/lib/centralRegConstants';

const STATUS_LABELS = {
  approved: 'Confirmed',
  enrolled: 'Confirmed',
  waitlisted: 'Waitlisted',
  pending_approval: 'Pending',
  declined: 'Declined',
  completed: 'Completed',
  withdrawn: 'Withdrawn',
};

const slotLabel = (value) => KIDS_GIFT_SHOP_TIME_SLOTS.find(s => s.value === value)?.label || value || 'No slot';

// Kids Gift Shop registration tab — the families signed up for a shopping slot,
// created through the same registration record Central Registration uses.
export default function GiftShopRegistrations() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['kidsGiftShopRegistrations'],
    queryFn: () => base44.entities.ProgramRegistration.filter(
      { program_name: 'Kids Gift Shop' },
      { sort: '-created_date', limit: 200 }
    ).then(res => res.items || []),
  });

  const confirmed = registrations.filter(r => ['approved', 'enrolled'].includes(r.status));
  const waitlisted = registrations.filter(r => r.status === 'waitlisted');
  const childCount = confirmed.reduce((sum, r) => sum + (r.children?.length || 0), 0);

  const bySlot = KIDS_GIFT_SHOP_TIME_SLOTS.map(slot => ({
    ...slot,
    count: confirmed.filter(r => r.time_slot === slot.value).reduce((sum, r) => sum + (r.children?.length || 0), 0),
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Confirmed families</p><p className="text-2xl font-bold">{confirmed.length}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Children registered</p><p className="text-2xl font-bold">{childCount}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">On the waitlist</p><p className="text-2xl font-bold">{waitlisted.length}</p></CardContent></Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {bySlot.map(slot => (
          <Card key={slot.value}>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">{slot.label}</p>
              <p className="text-lg font-semibold">{slot.count} {slot.count === 1 ? 'child' : 'children'}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-semibold">Registered families</h2>
        <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Register a family</Button>
      </div>

      {isLoading ? (
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Loading registrations…</p></CardContent></Card>
      ) : registrations.length === 0 ? (
        <Card><CardContent className="pt-6 text-center space-y-3"><p className="text-sm text-muted-foreground">No families registered for the Kids Gift Shop yet.</p><Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Register a family</Button></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {registrations.map(reg => (
            <Card key={reg.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{reg.parent_guardian_name || reg.participant_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {slotLabel(reg.time_slot)}
                      {reg.registration_date ? ` • Registered ${new Date(reg.registration_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                    </p>
                    {(reg.parent_guardian_phone || reg.parent_guardian_email) && (
                      <p className="text-xs text-muted-foreground">{[reg.parent_guardian_phone, reg.parent_guardian_email].filter(Boolean).join(' • ')}</p>
                    )}
                    {reg.children?.length > 0 && (
                      <p className="text-xs mt-1 flex items-center gap-1 text-muted-foreground">
                        <Baby className="h-3 w-3" />
                        {reg.children.map(c => `${c.first_name}${c.age !== undefined && c.age !== null ? ` (${c.age})` : ''}`).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${['approved', 'enrolled'].includes(reg.status) ? 'bg-green-100 text-green-700' : reg.status === 'waitlisted' ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}>
                    {STATUS_LABELS[reg.status] || reg.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <KidsGiftShopRegistrationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={() => qc.invalidateQueries({ queryKey: ['kidsGiftShopRegistrations'] })}
      />
    </div>
  );
}