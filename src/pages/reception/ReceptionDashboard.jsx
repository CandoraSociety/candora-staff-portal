import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { CalendarDays, DoorOpen, Users, ClipboardList, Search, Siren, Plus, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/rc/StatusBadge';
import ClickToCallButton from '@/components/reception/ClickToCallButton';
import UrgentAlertDialog from '@/components/reception/UrgentAlertDialog';
import { APPT_STATUS_OPTIONS, DROPIN_STATUS_OPTIONS, REG_STATUS_OPTIONS } from '@/lib/receptionConstants';
import { useAuth } from '@/lib/AuthContext';

export default function ReceptionDashboard() {
  const [urgentOpen, setUrgentOpen] = useState(false);
  const { user } = useAuth();

  const { data: appointments = [] } = useQuery({ queryKey: ['reception-appointments'], queryFn: () => base44.entities.ReceptionAppointment.list('-appointment_date', 200) });
  const { data: dropIns = [] } = useQuery({ queryKey: ['reception-dropins'], queryFn: () => base44.entities.DropInVisit.list('-visit_date', 200) });
  const { data: registrations = [] } = useQuery({ queryKey: ['reception-registrations'], queryFn: () => base44.entities.ProgramRegistration.list('-registration_date', 200) });

  const today = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.appointment_date?.startsWith(today));
  const todayDropIns = dropIns.filter(d => d.visit_date === today);
  const checkedInDropIns = todayDropIns.filter(d => d.status === 'checked_in');
  const pendingRegs = registrations.filter(r => r.status === 'pending_approval');

  const stats = [
    { label: "Today's Appointments", value: todayAppts.length, icon: CalendarDays, path: '/reception/appointments', color: '#3b82f6' },
    { label: 'Drop-ins Today', value: todayDropIns.length, icon: DoorOpen, path: '/reception/dropins', color: '#22c55e' },
    { label: 'Currently Checked In', value: checkedInDropIns.length, icon: Users, path: '/reception/dropins', color: '#f59e0b' },
    { label: 'Pending Approvals', value: pendingRegs.length, icon: ClipboardList, path: '/reception/registration', color: '#a855f7' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Reception Dashboard</h1><p className="text-muted-foreground text-sm mt-1">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
        <Button variant="destructive" onClick={() => setUrgentOpen(true)}><Siren className="h-4 w-4" /> Urgent Alert</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => { const Icon = stat.icon; return (
          <Link key={stat.label} to={stat.path}>
            <Card className="hover:shadow-md transition-shadow"><CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.color + '15' }}><Icon className="h-5 w-5" style={{ color: stat.color }} /></div>
              <div><p className="text-2xl font-bold text-foreground">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div>
            </CardContent></Card>
          </Link>
        ); })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Today's Appointments</CardTitle><Link to="/reception/appointments" className="text-xs text-primary flex items-center gap-1 hover:underline">View all <ArrowRight className="h-3 w-3" /></Link></CardHeader>
          <CardContent>
            {todayAppts.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No appointments today</p> : (
              <div className="space-y-2">{todayAppts.sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date)).map(a => (
                <div key={a.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                  <div><p className="text-sm font-medium text-foreground">{a.visitor_name}</p><p className="text-xs text-muted-foreground">{new Date(a.appointment_date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} · {a.staff_member || a.purpose || 'N/A'}</p></div>
                  <StatusBadge status={a.status} options={APPT_STATUS_OPTIONS} />
                </div>
              ))}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Checked In Now</CardTitle><Link to="/reception/dropins" className="text-xs text-primary flex items-center gap-1 hover:underline">View all <ArrowRight className="h-3 w-3" /></Link></CardHeader>
          <CardContent>
            {checkedInDropIns.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No one checked in</p> : (
              <div className="space-y-2">{checkedInDropIns.map(d => (
                <div key={d.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                  <div><p className="text-sm font-medium text-foreground">{d.visitor_name}</p><p className="text-xs text-muted-foreground">{d.arrival_time} · {d.purpose || d.staff_visited || 'N/A'}</p></div>
                  <StatusBadge status={d.status} options={DROPIN_STATUS_OPTIONS} />
                </div>
              ))}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Link to="/reception/staff"><Card className="hover:shadow-md transition-shadow cursor-pointer"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center"><Users className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm font-medium text-foreground">Staff Directory</p><p className="text-xs text-muted-foreground">Find staff &amp; call</p></div></CardContent></Card></Link>
        <Link to="/reception/resources"><Card className="hover:shadow-md transition-shadow cursor-pointer"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center"><Search className="h-5 w-5 text-green-600" /></div><div><p className="text-sm font-medium text-foreground">Resource Finder</p><p className="text-xs text-muted-foreground">Find programs &amp; services</p></div></CardContent></Card></Link>
        <Link to="/reception/registration"><Card className="hover:shadow-md transition-shadow cursor-pointer"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center"><ClipboardList className="h-5 w-5 text-purple-600" /></div><div><p className="text-sm font-medium text-foreground">Program Registration</p><p className="text-xs text-muted-foreground">{pendingRegs.length} pending approval</p></div></CardContent></Card></Link>
      </div>

      <UrgentAlertDialog open={urgentOpen} onOpenChange={setUrgentOpen} currentUser={user} onSaved={() => setUrgentOpen(false)} />
    </div>
  );
}