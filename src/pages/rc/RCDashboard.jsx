import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Users, CalendarDays, ArrowLeftRight, Baby, ArrowRight, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/rc/StatusBadge';
import { CASE_STATUS_OPTIONS, APPOINTMENT_STATUS_OPTIONS, REFERRAL_STATUS_OPTIONS, IS_PHAC } from '@/lib/rcConstants';

export default function RCDashboard() {
  const { data: clients = [] } = useQuery({ queryKey: ['rc-clients'], queryFn: () => base44.entities.RCClient.list() });
  const { data: appointments = [] } = useQuery({ queryKey: ['rc-appointments'], queryFn: () => base44.entities.RCAppointment.list('-appointment_date', 200) });
  const { data: referrals = [] } = useQuery({ queryKey: ['rc-referrals'], queryFn: () => base44.entities.RCReferral.list('-referral_date', 200) });

  const activeClients = clients.filter(c => c.case_status !== 'closed');
  const phacClients = clients.filter(IS_PHAC);
  const now = new Date();
  const upcomingAppts = appointments.filter(a => a.status === 'scheduled' && new Date(a.appointment_date) >= now).sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
  const pendingReferrals = referrals.filter(r => r.status === 'pending');

  const stats = [
    { label: 'Active Clients', value: activeClients.length, icon: Users, path: '/rc/clients', color: '#0ea5e9' },
    { label: 'PHAC Clients (0-6)', value: phacClients.length, icon: Baby, path: '/rc/clients', color: '#22c55e' },
    { label: 'Upcoming Appts', value: upcomingAppts.length, icon: CalendarDays, path: '/rc/appointments', color: '#f59e0b' },
    { label: 'Pending Referrals', value: pendingReferrals.length, icon: ArrowLeftRight, path: '/rc/referrals', color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Resource Centre Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Client management, case work, and referrals</p>
        </div>
        <Link to="/rc/intake"><Card className="hover:shadow-md transition-shadow cursor-pointer border-primary/30"><CardContent className="p-3 flex items-center gap-2"><UserPlus className="h-4 w-4 text-primary" /><span className="text-sm font-medium">New Intake</span></CardContent></Card></Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} to={stat.path}>
              <Card className="hover:shadow-md transition-shadow"><CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.color + '15' }}><Icon className="h-5 w-5" style={{ color: stat.color }} /></div>
                <div><p className="text-2xl font-bold text-foreground">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div>
              </CardContent></Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Upcoming Appointments</CardTitle><Link to="/rc/appointments" className="text-xs text-primary flex items-center gap-1 hover:underline">View all <ArrowRight className="h-3 w-3" /></Link></CardHeader>
          <CardContent>
            {upcomingAppts.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No upcoming appointments</p> : (
              <div className="space-y-2">{upcomingAppts.slice(0, 5).map(a => (
                <div key={a.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                  <div><p className="text-sm font-medium text-foreground">{a.client_name}</p><p className="text-xs text-muted-foreground">{new Date(a.appointment_date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p></div>
                  <StatusBadge status={a.status} options={APPOINTMENT_STATUS_OPTIONS} />
                </div>
              ))}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Pending Referrals</CardTitle><Link to="/rc/referrals" className="text-xs text-primary flex items-center gap-1 hover:underline">View all <ArrowRight className="h-3 w-3" /></Link></CardHeader>
          <CardContent>
            {pendingReferrals.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No pending referrals</p> : (
              <div className="space-y-2">{pendingReferrals.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                  <div><p className="text-sm font-medium text-foreground">{r.client_name}</p><p className="text-xs text-muted-foreground capitalize">{r.direction} · {r.organization || r.service_program || 'N/A'}</p></div>
                  <StatusBadge status={r.status} options={REFERRAL_STATUS_OPTIONS} />
                </div>
              ))}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}