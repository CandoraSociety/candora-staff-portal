import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Briefcase, Calendar, Clock, CheckSquare, Cake, UserCheck, ClipboardList, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { getUnawardedMilestones } from '@/lib/milestones';

export default function VolunteerMgrDashboard() {
  const { data: volunteers = [] } = useQuery({
    queryKey: ['vol-volunteers'],
    queryFn: () => base44.entities.Volunteer.list(undefined, 500),
  });
  const { data: positions = [] } = useQuery({
    queryKey: ['vol-positions'],
    queryFn: () => base44.entities.VolunteerPosition.list(),
  });
  const { data: events = [] } = useQuery({
    queryKey: ['vol-events'],
    queryFn: () => base44.entities.VolunteerEvent.list('-date', 20),
  });
  const { data: approvals = [] } = useQuery({
    queryKey: ['vol-approvals'],
    queryFn: () => base44.entities.VolunteerApproval.list(),
  });
  const { data: staffRequests = [] } = useQuery({
    queryKey: ['staff-volunteer-requests'],
    queryFn: () => base44.entities.StaffVolunteerRequest.list(),
  });
  const { data: timeLogs = [] } = useQuery({
    queryKey: ['vol-timelogs-all'],
    queryFn: () => base44.entities.VolunteerTimeLog.list('-date', 5000),
  });
  const { data: recognitions = [] } = useQuery({
    queryKey: ['vol-recognitions-all'],
    queryFn: () => base44.entities.VolunteerRecognition.list(),
  });

  const activeVolunteers = volunteers.filter(v => v.status === 'active');
  const openPositions = positions.filter(p => p.status === 'open');
  const upcomingEvents = events.filter(e => e.status === 'upcoming');
  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const activeSignIns = timeLogs.filter(l => l.status === 'signed_in');
  const pendingStaffRequests = staffRequests.filter(r => r.status === 'pending');

  const totalHours = timeLogs.reduce((sum, l) => sum + (l.total_hours || 0), 0);

  // Fiscal YTD (April 1 – March 31)
  const now = moment();
  const fiscalYearStart = now.month() >= 3
    ? moment().startOf('year').add(3, 'months')
    : moment().startOf('year').subtract(9, 'months');
  const fiscalYtdHours = timeLogs
    .filter(l => l.date && moment(l.date).isSameOrAfter(fiscalYearStart))
    .reduce((sum, l) => sum + (l.total_hours || 0), 0);

  // Milestone alerts
  const volunteersWithUnawarded = volunteers
    .filter(v => !v.is_deceased)
    .map(v => {
      const volRecognitions = recognitions.filter(r => r.volunteer_id === v.id);
      const unawarded = getUnawardedMilestones(v, volRecognitions);
      return { ...v, unawardedCount: unawarded.length };
    })
    .filter(v => v.unawardedCount > 0)
    .sort((a, b) => b.unawardedCount - a.unawardedCount);

  // Upcoming birthdays (next 30 days)
  const upcomingBirthdays = volunteers
    .filter(v => v.birth_date && !v.is_deceased)
    .map(v => {
      const bday = moment(v.birth_date);
      let next = bday.clone().year(now.year());
      if (next.isBefore(now, 'day')) next = next.add(1, 'year');
      return { ...v, nextBirthday: next, daysUntil: next.diff(now, 'days') };
    })
    .filter(v => v.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display text-primary">DASHBOARD</h1>
          <p className="text-muted-foreground text-sm">Welcome to VolunteerTrack</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Active Volunteers</p>
                <p className="text-3xl font-bold">{activeVolunteers.length}</p>
                <p className="text-xs text-muted-foreground mt-1">{volunteers.length} total</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Open Positions</p>
                <p className="text-3xl font-bold">{openPositions.length}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Upcoming Events</p>
                <p className="text-3xl font-bold">{upcomingEvents.length}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Hours Logged</p>
                <p className="text-3xl font-bold">{Math.round(totalHours).toLocaleString()}</p>
                <p className="text-xs text-primary font-medium mt-1">Fiscal YTD: {Math.round(fiscalYtdHours).toLocaleString()}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3-column widget row */}
      <div className="grid md:grid-cols-3 gap-5">

        {/* Milestone Alerts */}
        <Card className="border-l-4 border-l-yellow-400">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Milestone Alerts
              <Link to="/volunteermgr/milestones" className="ml-auto text-xs text-primary font-normal hover:underline">View Recognition →</Link>
            </CardTitle>
            {volunteersWithUnawarded.length > 0 && (
              <p className="text-xs text-muted-foreground">{volunteersWithUnawarded.length} volunteer{volunteersWithUnawarded.length !== 1 ? 's' : ''} with unawarded milestones</p>
            )}
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1.5">
            {volunteersWithUnawarded.length === 0 && <p className="text-sm text-muted-foreground">No pending milestones.</p>}
            {volunteersWithUnawarded.slice(0, 7).map(v => {
              const initials = `${v.first_name?.[0] || ''}${v.last_name?.[0] || ''}`.toUpperCase();
              return (
                <Link key={v.id} to={`/volunteermgr/volunteers/${v.id}`}
                  className="flex items-center gap-2 hover:bg-muted/50 rounded-md px-2 py-1.5 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold shrink-0">{initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{v.first_name} {v.last_name}</p>
                    <p className="text-xs text-muted-foreground">{Math.round(v.total_hours || 0)} hrs</p>
                  </div>
                  <Badge className="bg-yellow-400/90 text-yellow-900 border-0 text-xs shrink-0">{v.unawardedCount} pending</Badge>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        {/* Upcoming Birthdays */}
        <Card className="border-l-4 border-l-pink-400">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Cake className="w-4 h-4 text-pink-500" />
              Upcoming Birthdays
              <Link to="/volunteermgr/birthdays" className="ml-auto text-xs text-primary font-normal hover:underline">View calendar →</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1.5">
            {upcomingBirthdays.length === 0 && <p className="text-sm text-muted-foreground">No birthdays in the next 30 days.</p>}
            {upcomingBirthdays.map(v => {
              const initials = `${v.first_name?.[0] || ''}${v.last_name?.[0] || ''}`.toUpperCase();
              return (
                <div key={v.id} className="flex items-center gap-2 hover:bg-muted/50 rounded-md px-2 py-1.5 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-xs font-bold shrink-0">{initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{v.first_name} {v.last_name}</p>
                    <p className="text-xs text-muted-foreground">{v.nextBirthday.format('MMMM D')}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs shrink-0 ${v.daysUntil === 0 ? 'border-pink-400 text-pink-600' : ''}`}>
                    {v.daysUntil === 0 ? '🎂 Today!' : `${v.daysUntil}d`}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card className="border-l-4 border-l-accent">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-accent" />
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1.5">
            {pendingApprovals.length === 0 && <p className="text-sm text-muted-foreground">No pending approvals.</p>}
            {pendingApprovals.slice(0, 5).map(a => (
              <Link key={a.id} to="/volunteermgr/approvals"
                className="block hover:bg-muted/50 rounded-md px-2 py-1.5 transition-colors">
                <p className="text-sm font-medium">{a.volunteer_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{a.type?.replace(/_/g, ' ') || 'New Registration'}</p>
              </Link>
            ))}
            {pendingApprovals.length > 5 && (
              <Link to="/volunteermgr/approvals" className="block text-xs text-primary hover:underline px-2 pt-1">View all {pendingApprovals.length} →</Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second row: Currently Signed In + Upcoming Shifts/Staff Requests */}
      <div className="grid md:grid-cols-2 gap-5">
        <Card className="border-l-4 border-l-green-400">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-green-600" />
              Currently Signed In
              <Link to="/volunteermgr/timelogs" className="ml-auto text-xs text-primary font-normal hover:underline">View logs →</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1.5">
            {activeSignIns.length === 0 && <p className="text-sm text-muted-foreground">No volunteers currently signed in.</p>}
            {activeSignIns.slice(0, 6).map(log => (
              <div key={log.id} className="flex items-center justify-between hover:bg-muted/50 rounded-md px-2 py-1.5 transition-colors">
                <div>
                  <p className="text-sm font-medium">{log.volunteer_name}</p>
                  <p className="text-xs text-muted-foreground">{log.position_title || 'General'}</p>
                </div>
                <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                  Since {moment(log.sign_in_time).format('h:mm a')}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-400">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-600" />
              Staff Volunteer Requests
              <Link to="/volunteermgr/staff-requests" className="ml-auto text-xs text-primary font-normal hover:underline">Full list →</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1.5">
            {pendingStaffRequests.length === 0 && <p className="text-sm text-muted-foreground">No pending staff requests.</p>}
            {pendingStaffRequests.slice(0, 5).map(r => (
              <Link key={r.id} to="/volunteermgr/staff-requests"
                className="block hover:bg-muted/50 rounded-md px-2 py-1.5 transition-colors">
                <p className="text-sm font-medium">{r.position_title}</p>
                <p className="text-xs text-muted-foreground">{r.requester_name} · {r.requester_department}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}