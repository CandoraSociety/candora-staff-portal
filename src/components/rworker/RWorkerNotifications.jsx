import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, CalendarClock, ArrowLeftRight, ClipboardCheck } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/lib/AuthContext';
import { format } from 'date-fns';

// Bell in the Resource Worker ribbon — upcoming appointments, referrals waiting
// on us, and client visits assigned to the signed-in worker.
export default function RWorkerNotifications() {
  const { user } = useAuth();
  const email = (user?.email || '').toLowerCase();
  const name = (user?.full_name || '').toLowerCase();

  const { data: appointments = [] } = useQuery({
    queryKey: ['rw-appointments'],
    queryFn: () => base44.entities.RCAppointment.filter({ status: 'scheduled' }, { sort: 'appointment_date', limit: 100 }),
    select: (page) => page.items || [],
  });
  const { data: referrals = [] } = useQuery({
    queryKey: ['rw-referrals'],
    queryFn: () => base44.entities.RCReferral.filter({ status: 'pending' }, { limit: 50 }),
    select: (page) => page.items || [],
  });
  const { data: visits = [] } = useQuery({
    queryKey: ['rw-visits'],
    queryFn: () => base44.entities.RCClientVisit.filter({ status: 'pending' }, { limit: 100 }),
    select: (page) => page.items || [],
  });

  const now = Date.now();
  const upcoming = appointments
    .filter((a) => a.appointment_date && new Date(a.appointment_date).getTime() >= now)
    .slice(0, 5);
  const myVisits = visits.filter(
    (v) => (v.caseworker_email || '').toLowerCase() === email || (v.caseworker_name || '').toLowerCase() === name
  );

  const count = upcoming.length + referrals.length + myVisits.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative rounded-md p-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground" title="Notifications">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-3 py-2 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
        </div>
        <div className="max-h-96 overflow-y-auto divide-y divide-border/60">
          <Section title="Upcoming appointments" icon={CalendarClock} empty="No upcoming appointments">
            {upcoming.map((a) => (
              <p key={a.id} className="text-xs text-foreground">
                <span className="font-medium">{a.client_name}</span> · {format(new Date(a.appointment_date), 'MMM d, h:mm a')}
              </p>
            ))}
          </Section>
          <Section title="My pending visits" icon={ClipboardCheck} empty="No visits waiting on you">
            {myVisits.slice(0, 5).map((v) => (
              <p key={v.id} className="text-xs text-foreground">
                <span className="font-medium">{v.client_name}</span> · {v.visit_date ? format(new Date(v.visit_date), 'MMM d') : ''}
              </p>
            ))}
          </Section>
          <Section title="Referrals awaiting response" icon={ArrowLeftRight} empty="No pending referrals">
            {referrals.slice(0, 5).map((r) => (
              <p key={r.id} className="text-xs text-foreground">
                <span className="font-medium">{r.client_name}</span> · {r.organization || r.service_program || 'Referral'}
              </p>
            ))}
          </Section>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Section({ title, icon: Icon, empty, children }) {
  const hasChildren = React.Children.count(children) > 0;
  return (
    <div className="px-3 py-2 space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" /> {title}
      </p>
      {hasChildren ? children : <p className="text-xs text-muted-foreground">{empty}</p>}
    </div>
  );
}