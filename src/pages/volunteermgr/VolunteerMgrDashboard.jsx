import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Briefcase, Calendar, Clock, CheckSquare, Cake, UserCheck, ClipboardList, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { getUnawardedMilestones } from '@/lib/milestones';

function StatCard({ icon: StatIcon, label, value, color = 'text-primary' }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <StatIcon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

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
  const totalHours = timeLogs.reduce((sum, l) => sum + (l.total_hours || 0), 0);
  const activeSignIns = timeLogs.filter(l => l.status === 'signed_in');
  const pendingStaffRequests = staffRequests.filter(r => r.status === 'pending');

  // Fiscal YTD hours (April 1 - March 31)
  const now = moment();
  const fiscalYearStart = now.month() >= 3 // April = month 3
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

  // Volunteer hours leaderboard
  const hoursLeaderboard = volunteers
    .filter(v => (v.total_hours || 0) > 0)
    .sort((a, b) => (b.total_hours || 0) - (a.total_hours || 0))
    .slice(0, 15);

  const [hoursExpanded, setHoursExpanded] = useState(false);

  const recentVolunteers = [...volunteers]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 5);

  // Upcoming birthdays (next 30 days)
  const upcomingBirthdays = volunteers
    .filter(v => v.birth_date && !v.is_deceased)
    .map(v => {
      const bday = moment(v.birth_date);
      const thisYear = moment().year();
      let next = bday.clone().year(thisYear);
      if (next.isBefore(moment(), 'day')) next = next.add(1, 'year');
      return { ...v, nextBirthday: next, daysUntil: next.diff(moment(), 'days') };
    })
    .filter(v => v.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Volunteer Manager</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your volunteer program</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Active Volunteers" value={activeVolunteers.length} />
        <StatCard icon={Briefcase} label="Open Positions" value={openPositions.length} />
        <StatCard icon={Calendar} label="Upcoming Events" value={upcomingEvents.length} />
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{Math.round(totalHours).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Hours Logged</p>
              <p className="text-xs text-primary font-medium mt-0.5">Fiscal YTD: {Math.round(fiscalYtdHours).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Milestone Alerts */}
        <Card className="border-yellow-300/50 bg-yellow-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-600" /> Milestone Alerts
              <Link to="/volunteermgr/milestones" className="ml-auto text-xs text-primary font-normal hover:underline">View Recognition →</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {volunteersWithUnawarded.length === 0 && <p className="text-sm text-muted-foreground">No pending milestones.</p>}
            {volunteersWithUnawarded.length > 0 && (
              <p className="text-xs text-muted-foreground mb-2">{volunteersWithUnawarded.length} volunteer{volunteersWithUnawarded.length !== 1 ? 's' : ''} with unawarded milestones</p>
            )}
            {volunteersWithUnawarded.slice(0, 6).map(v => {
              const initials = `${v.first_name?.[0] || ''}${v.last_name?.[0] || ''}`.toUpperCase();
              return (
                <Link key={v.id} to={`/volunteermgr/volunteers/${v.id}`} className="flex items-center gap-2 hover:bg-yellow-100/50 rounded px-2 py-1.5 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-yellow-200 text-yellow-800 flex items-center justify-center text-xs font-bold shrink-0">{initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{v.first_name} {v.last_name}</p>
                    <p className="text-xs text-muted-foreground">{Math.round(v.total_hours || 0)} hrs</p>
                  </div>
                  <Badge className="bg-yellow-400/80 text-yellow-900 border-0 text-xs shrink-0">{v.unawardedCount} pending</Badge>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        {/* Upcoming Birthdays */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Cake className="w-4 h-4 text-pink-500" /> Upcoming Birthdays
              <Link to="/volunteermgr/birthdays" className="ml-auto text-xs text-primary font-normal hover:underline">View all →</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingBirthdays.length === 0 && <p className="text-sm text-muted-foreground">No birthdays in the next 30 days.</p>}
            {upcomingBirthdays.map(v => (
              <div key={v.id} className="flex items-center justify-between hover:bg-muted/50 rounded px-2 py-1.5 transition-colors">
                <div>
                  <p className="text-sm font-medium">{v.first_name} {v.last_name}</p>
                  <p className="text-xs text-muted-foreground">{v.nextBirthday.format('MMM D')}</p>
                </div>
                <Badge variant="outline" className={`text-xs ${v.daysUntil === 0 ? 'border-pink-400 text-pink-600' : ''}`}>
                  {v.daysUntil === 0 ? '🎂 Today!' : `${v.daysUntil}d`}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pending Approvals + Currently Signed In */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-accent" /> Pending Approvals
                <Link to="/volunteermgr/approvals" className="ml-auto text-xs text-primary font-normal hover:underline">View all →</Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {pendingApprovals.length === 0 && <p className="text-sm text-muted-foreground">No pending approvals.</p>}
              {pendingApprovals.slice(0, 4).map(a => (
                <Link key={a.id} to="/volunteermgr/approvals" className="block hover:bg-muted/50 rounded px-2 py-1.5 transition-colors">
                  <p className="text-sm font-medium">{a.volunteer_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{a.type?.replace(/_/g, ' ') || 'New Registration'}</p>
                </Link>
              ))}
              {pendingApprovals.length > 4 && (
                <Link to="/volunteermgr/approvals" className="block text-xs text-primary hover:underline px-2">View all {pendingApprovals.length} →</Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-green-600" /> Currently Signed In
                <Link to="/volunteermgr/timelogs" className="ml-auto text-xs text-primary font-normal hover:underline">View logs →</Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {activeSignIns.length === 0 && <p className="text-sm text-muted-foreground">No volunteers currently signed in.</p>}
              {activeSignIns.slice(0, 4).map(log => (
                <div key={log.id} className="flex items-center justify-between hover:bg-muted/50 rounded px-2 py-1.5 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{log.volunteer_name}</p>
                    <p className="text-xs text-muted-foreground">{log.position_title || 'General'}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 text-xs border-0">
                    {moment(log.sign_in_time).format('h:mm a')}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alert banners */}
      <div className="space-y-3">
        {pendingStaffRequests.length > 0 && (
          <Card className="border-blue-300/40 bg-blue-50/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-sm">{pendingStaffRequests.length} staff volunteer request{pendingStaffRequests.length !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-muted-foreground">From staff awaiting coordinator action</p>
                </div>
              </div>
              <Link to="/volunteermgr/staff-requests" className="text-sm text-primary font-medium hover:underline">Review →</Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Volunteer Hours Leaderboard */}
      <Card>
        <CardHeader className="pb-3 cursor-pointer" onClick={() => setHoursExpanded(!hoursExpanded)}>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Volunteer Hours
            <span className="ml-auto">{hoursExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
          </CardTitle>
        </CardHeader>
        {hoursExpanded && (
          <CardContent className="pt-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground uppercase">
                  <th className="text-left py-2 font-medium">Volunteer</th>
                  <th className="text-left py-2 font-medium">Type</th>
                  <th className="text-left py-2 font-medium">Status</th>
                  <th className="text-right py-2 font-medium text-primary">Hours</th>
                </tr>
              </thead>
              <tbody>
                {hoursLeaderboard.map(v => (
                  <tr key={v.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-2">
                      <Link to={`/volunteermgr/volunteers/${v.id}`} className="hover:underline font-medium">
                        {v.first_name} {v.last_name}
                      </Link>
                    </td>
                    <td className="py-2 text-muted-foreground capitalize">{v.volunteer_type?.replace(/_/g, ' ')}</td>
                    <td className="py-2 text-muted-foreground capitalize">{v.status}</td>
                    <td className="py-2 text-right font-semibold text-primary">{(v.total_hours || 0).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        )}
      </Card>
    </div>
  );
}