import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ClipboardList, UserPlus, CalendarClock, ArrowRight, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/AuthContext';
import MyCaseManagement from '@/components/rc/MyCaseManagement';
import { format } from 'date-fns';

export default function RWorkerDashboard() {
  const { user } = useAuth();
  const myName = (user?.full_name || '').toLowerCase();
  const myEmail = (user?.email || '').toLowerCase();

  const { data: clients = [] } = useQuery({
    queryKey: ['rw-clients'],
    queryFn: () => base44.entities.RCClient.filter({ case_status: { $ne: 'closed' } }, { limit: 300 }),
    select: (page) => page.items || [],
  });
  const { data: appointments = [] } = useQuery({
    queryKey: ['rw-upcoming-appointments'],
    queryFn: () => base44.entities.RCAppointment.filter({ status: 'scheduled' }, { sort: 'appointment_date', limit: 100 }),
    select: (page) => page.items || [],
  });
  const { data: visits = [] } = useQuery({
    queryKey: ['rw-visits'],
    queryFn: () => base44.entities.RCClientVisit.filter({ status: 'pending' }, { limit: 100 }),
    select: (page) => page.items || [],
  });

  const isMine = (worker) => {
    const w = (worker || '').trim().toLowerCase();
    return !!w && (w === myName || w === myEmail);
  };

  const myClients = clients.filter((c) => isMine(c.assigned_worker));
  const myVisits = visits.filter(
    (v) => (v.caseworker_email || '').toLowerCase() === myEmail || (v.caseworker_name || '').toLowerCase() === myName
  );
  const now = Date.now();
  const upcoming = appointments
    .filter((a) => a.appointment_date && new Date(a.appointment_date).getTime() >= now)
    .slice(0, 5);

  const stats = [
    { label: 'My Active Clients', value: myClients.length, icon: Users, color: '#0ea5e9' },
    { label: 'Pending Visits', value: myVisits.length, icon: Clock, color: '#f59e0b' },
    { label: 'Upcoming Appointments', value: upcoming.length, icon: CalendarClock, color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          {user?.full_name ? `Welcome back, ${user.full_name.split(' ')[0]}` : 'Resource Worker Dashboard'}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/rworker/case-management">
          <Card className="h-full hover:shadow-md hover:border-primary/40 transition-all cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                <ClipboardList className="h-7 w-7 text-sky-600" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-heading font-bold text-foreground">Case Management</p>
                <p className="text-sm text-muted-foreground">Intensive services, general clients, and caregiver capacity files.</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link to="/rworker/client-visit">
          <Card className="h-full hover:shadow-md hover:border-primary/40 transition-all cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <UserPlus className="h-7 w-7 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-heading font-bold text-foreground">Client Visit</p>
                <p className="text-sm text-muted-foreground">Start a drop-in or scheduled visit and record the service.</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.color + '15' }}>
                  <Icon className="h-5 w-5" style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Upcoming Appointments</CardTitle></CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No upcoming appointments</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-2 rounded-md border border-border/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">{a.client_name}</p>
                      <p className="text-xs text-muted-foreground">{a.purpose || 'Appointment'}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{format(new Date(a.appointment_date), 'MMM d, h:mm a')}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div>
          <MyCaseManagement />
        </div>
      </div>
    </div>
  );
}