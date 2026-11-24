import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, MapPin, Users, Gift, Ticket, Phone, Mail, Settings2, StickyNote } from 'lucide-react';
import GiftShopEventSetupWizard from '@/components/winterwonderland/GiftShopEventSetupWizard';

const dateLabel = (value) => (value ? moment(value).format('dddd, MMMM D, YYYY') : '');
const shortDate = (value) => (value ? moment(value).format('MMM D, YYYY') : '');

const timeLabel = (value) => {
  const [hour, minute] = String(value || '').split(':').map(Number);
  if (Number.isNaN(hour)) return value || '';
  const suffix = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 === 0 ? 12 : hour % 12}:${String(minute || 0).padStart(2, '0')} ${suffix}`;
};

function Line({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
      <p><span className="text-muted-foreground">{label}: </span><span className="font-medium">{value}</span></p>
    </div>
  );
}

// The Kids Gift Shop's own logistics — filled in through the setup wizard and
// shown here on the overview. Nothing on the other tabs reads from it yet.
export default function GiftShopEventOverview({ festival }) {
  const qc = useQueryClient();
  const [wizardOpen, setWizardOpen] = useState(false);

  const { data: setups } = useQuery({
    queryKey: ['giftShopEventSetup', festival?.id],
    queryFn: () => base44.entities.GiftShopEventSetup.filter({ festival_id: festival.id }),
    enabled: !!festival?.id,
  });
  const setup = setups?.[0];

  const refresh = () => qc.invalidateQueries({ queryKey: ['giftShopEventSetup'] });

  if (!festival) return null;

  const wizard = (
    <GiftShopEventSetupWizard
      open={wizardOpen}
      onOpenChange={setWizardOpen}
      festival={festival}
      setup={setup}
      onSaved={refresh}
    />
  );

  if (!setup) {
    return (
      <>
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center space-y-3">
            <div className="mx-auto h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Set up this year's event details</p>
              <p className="text-sm text-muted-foreground mt-1">
                The date, shopping times, venue, check-in desk, registration window, slot capacity and who coordinates the day.
              </p>
            </div>
            <Button onClick={() => setWizardOpen(true)}><Settings2 className="h-4 w-4" /> Set up event details</Button>
          </CardContent>
        </Card>
        {wizard}
      </>
    );
  }

  const slotRange = setup.start_time || setup.end_time
    ? `${timeLabel(setup.start_time)}${setup.end_time ? ` – ${timeLabel(setup.end_time)}` : ''}`
    : '';

  const registrationWindow = setup.registration_opens || setup.registration_closes
    ? `${setup.registration_opens ? shortDate(setup.registration_opens) : 'Now'} – ${setup.registration_closes ? shortDate(setup.registration_closes) : 'Until the event'}`
    : '';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-display font-semibold">{setup.event_name || 'Kids Gift Shop'} details</h2>
          {setup.event_date && <p className="text-sm text-muted-foreground">{dateLabel(setup.event_date)}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={() => setWizardOpen(true)}>
          <Settings2 className="h-3.5 w-3.5" /> Edit details
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CalendarDays className="h-4 w-4" /> The event</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            <Line icon={CalendarDays} label="Date" value={dateLabel(setup.event_date)} />
            <Line icon={Clock} label="Shopping times" value={slotRange} />
            <Line icon={MapPin} label="Venue" value={setup.venue} />
            <Line icon={MapPin} label="Check-in desk" value={setup.desk_location} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Ticket className="h-4 w-4" /> Registration & slots</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            <Line icon={CalendarDays} label="Registration" value={registrationWindow} />
            <Line icon={Clock} label="Slot length" value={setup.slot_minutes ? `${setup.slot_minutes} minutes` : ''} />
            <Line icon={Users} label="Children per slot" value={setup.children_per_slot} />
            <Line icon={Gift} label="Gifts per child" value={setup.gifts_per_child} />
            <Line icon={Gift} label="Gift price" value={setup.gift_price !== null && setup.gift_price !== undefined && setup.gift_price !== '' ? `$${Number(setup.gift_price).toFixed(2)}` : ''} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" /> People</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            <Line icon={Users} label="Coordinator" value={setup.coordinator_name} />
            <Line icon={Phone} label="Phone" value={setup.coordinator_phone} />
            <Line icon={Mail} label="Email" value={setup.coordinator_email} />
            <Line icon={Users} label="Volunteers (elves) needed" value={setup.volunteers_needed} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><StickyNote className="h-4 w-4" /> Notes for the day</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
              {setup.notes || 'No notes yet.'}
            </p>
          </CardContent>
        </Card>
      </div>

      {wizard}
    </div>
  );
}