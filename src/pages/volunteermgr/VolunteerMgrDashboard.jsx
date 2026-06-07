import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Briefcase, Calendar, Clock, Award, CheckSquare, Cake, Trophy, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import moment from 'moment';

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

  const { data: timeLogs = [] } = useQuery({
    queryKey: ['vol-timelogs-all'],
    queryFn: () => base44.entities.VolunteerTimeLog.list('-date', 5000),
  });

  const activeVolunteers = volunteers.filter(v => v.status === 'active');
  const openPositions = positions.filter(p => p.status === 'open');
  const upcomingEvents = events.filter(e => e.status === 'upcoming');
  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const totalHours = timeLogs.reduce((sum, l) => sum + (l.total_hours || 0), 0);
  const activeSignIns = timeLogs.filter(l => l.status === 'signed_in');

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

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={Users} label="Active Volunteers" value={activeVolunteers.length} />
        <StatCard icon={Briefcase} label="Open Positions" value={openPositions.length} />
        <StatCard icon={Calendar} label="Upcoming Events" value={upcomingEvents.length} />
        <StatCard icon={Clock} label="Total Hours" value={Math.round(totalHours)} />
        <StatCard icon={Clock} label="Currently Signed In" value={activeSignIns.length} color="text-green-600" />
        <StatCard icon={CheckSquare} label="Pending Approvals" value={pendingApprovals.length} color="text-accent" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Recent Volunteers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentVolunteers.length === 0 && <p className="text-sm text-muted-foreground">No volunteers yet.</p>}
            {recentVolunteers.map(v => (
              <Link key={v.id} to="/volunteermgr/volunteers" className="flex items-center justify-between hover:bg-muted/50 rounded px-2 py-1.5 transition-colors">
                <div>
                  <p className="text-sm font-medium">{v.first_name} {v.last_name}</p>
                  <p className="text-xs text-muted-foreground">{v.volunteer_type?.replace(/_/g, ' ')}</p>
                </div>
                <Badge variant="outline" className="text-xs capitalize">{v.status}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingEvents.length === 0 && <p className="text-sm text-muted-foreground">No upcoming events.</p>}
            {upcomingEvents.slice(0, 5).map(e => (
              <Link key={e.id} to="/volunteermgr/events" className="flex items-center justify-between hover:bg-muted/50 rounded px-2 py-1.5 transition-colors">
                <div>
                  <p className="text-sm font-medium">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{e.date ? moment(e.date).format('MMM D, YYYY') : ''}</p>
                </div>
                {e.volunteers_needed > 0 && (
                  <span className="text-xs text-muted-foreground">{e.volunteers_signed_up || 0}/{e.volunteers_needed}</span>
                )}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Birthdays + Currently Signed In */}
      <div className="grid md:grid-cols-2 gap-6">
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-green-600" /> Currently Signed In
              <Link to="/volunteermgr/timelogs" className="ml-auto text-xs text-primary font-normal hover:underline">View logs →</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeSignIns.length === 0 && <p className="text-sm text-muted-foreground">No volunteers currently signed in.</p>}
            {activeSignIns.slice(0, 6).map(log => (
              <div key={log.id} className="flex items-center justify-between hover:bg-muted/50 rounded px-2 py-1.5 transition-colors">
                <div>
                  <p className="text-sm font-medium">{log.volunteer_name}</p>
                  <p className="text-xs text-muted-foreground">{log.position_title || 'General'}</p>
                </div>
                <Badge className="bg-green-100 text-green-700 text-xs border-0">
                  Since {moment(log.sign_in_time).format('h:mm a')}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {pendingApprovals.length > 0 && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckSquare className="w-5 h-5 text-accent" />
              <div>
                <p className="font-medium text-sm">{pendingApprovals.length} pending approval{pendingApprovals.length !== 1 ? 's' : ''}</p>
                <p className="text-xs text-muted-foreground">Volunteer registrations or changes awaiting review</p>
              </div>
            </div>
            <Link to="/volunteermgr/approvals" className="text-sm text-primary font-medium hover:underline">Review →</Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}