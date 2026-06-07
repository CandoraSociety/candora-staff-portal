import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import BirthdayCard from '@/components/volunteermgr/BirthdayCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Briefcase, Calendar, Clock, CheckSquare, Cake, UserCheck, ClipboardList, Trophy, ChevronRight, Gift, TrendingUp, ChevronDown, CalendarClock } from 'lucide-react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { getUnawardedMilestones } from '@/lib/milestones';

function StatCard({ icon: Icon, title, value, trend, color = 'text-primary', bgColor = 'bg-primary/10' }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-medium">{title}</p>
            <p className="text-3xl font-bold leading-none">{value}</p>
            {trend && <p className={`text-xs mt-1.5 font-medium ${color}`}>{trend}</p>}
          </div>
          <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center shrink-0 ml-3`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionCard({ icon: Icon, iconColor, borderColor, title, linkTo, linkLabel, children }) {
  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          <span>{title}</span>
          {linkTo && (
            <Link to={linkTo} className="ml-auto text-xs text-primary font-normal hover:underline flex items-center gap-0.5">
              {linkLabel || 'View all'} <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-1">
        {children}
      </CardContent>
    </Card>
  );
}

export default function VolunteerMgrDashboard() {
  const [birthdayCardVolunteer, setBirthdayCardVolunteer] = useState(null);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('all');
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

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
  const { data: shiftAssignments = [] } = useQuery({
    queryKey: ['vol-shift-assignments'],
    queryFn: () => base44.entities.ShiftAssignment.list('-date', 200),
  });
  const { data: shiftTemplates = [] } = useQuery({
    queryKey: ['vol-shift-templates'],
    queryFn: () => base44.entities.ShiftTemplate.list(),
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
  const today = moment();
  const fiscalYearStart = today.month() >= 3
    ? moment(`${today.year()}-04-01`)
    : moment(`${today.year() - 1}-04-01`);
  const fiscalYtdHours = timeLogs
    .filter(l => l.date && moment(l.date).isSameOrAfter(fiscalYearStart))
    .reduce((sum, l) => sum + (l.total_hours || 0), 0);

  // Volunteer Hours leaderboard
  const leaderboard = useMemo(() => {
    let filtered = timeLogs;
    if (leaderboardPeriod === 'month') {
      const start = moment().startOf('month');
      filtered = timeLogs.filter(l => l.date && moment(l.date).isSameOrAfter(start));
    } else if (leaderboardPeriod === 'year') {
      const start = moment().startOf('year');
      filtered = timeLogs.filter(l => l.date && moment(l.date).isSameOrAfter(start));
    }
    const map = {};
    filtered.forEach(l => {
      if (!l.volunteer_id) return;
      if (!map[l.volunteer_id]) map[l.volunteer_id] = { id: l.volunteer_id, name: l.volunteer_name, hours: 0 };
      map[l.volunteer_id].hours += l.total_hours || 0;
    });
    const rows = Object.values(map).sort((a, b) => b.hours - a.hours);
    // enrich with volunteer type/status
    return rows.map(row => {
      const vol = volunteers.find(v => v.id === row.id);
      return { ...row, volunteer_type: vol?.volunteer_type || '', status: vol?.status || '' };
    });
  }, [timeLogs, leaderboardPeriod, volunteers]);

  // Upcoming shifts (next 7 days)
  const upcomingShifts = useMemo(() => {
    const start = today.clone().startOf('day');
    const end = today.clone().add(7, 'days').endOf('day');
    return shiftAssignments
      .filter(s => s.date && moment(s.date).isBetween(start, end, 'day', '[]') && s.status !== 'cancelled')
      .map(s => {
        const tmpl = shiftTemplates.find(t => t.id === s.template_id);
        return { ...s, role_title: tmpl?.role_title || s.role_title || 'Shift', start_time: tmpl?.start_time || '', program_name: tmpl?.program_name || '' };
      })
      .sort((a, b) => moment(a.date).diff(moment(b.date)));
  }, [shiftAssignments, shiftTemplates]);

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

  // Birthdays: -1 to +7 days
  const upcomingBirthdays = volunteers
    .filter(v => v.birth_date && !v.is_deceased)
    .map(v => {
      const bday = moment(v.birth_date);
      let next = bday.clone().year(today.year());
      if (next.isBefore(today.clone().subtract(1, 'day'), 'day')) next = next.add(1, 'year');
      const daysUntil = next.diff(today.clone().startOf('day'), 'days');
      return { ...v, nextBirthday: next, daysUntil };
    })
    .filter(v => v.daysUntil >= -1 && v.daysUntil <= 7)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <img
            src="https://media.base44.com/images/public/6a15e361478575d63a95c265/562a66657_Candoracirclelogo_noanniversary.png"
            alt=""
            className="w-8 h-8 object-contain shrink-0"
          />
          <h1 className="text-2xl font-display font-extrabold uppercase tracking-widest text-[hsl(45,60%,70%)]">Dashboard</h1>
        </div>
        <p className="text-muted-foreground text-sm mt-0.5 ml-10">Welcome to Volunteer Manager</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users} title="Active Volunteers" value={activeVolunteers.length}
          trend={`${volunteers.length} total`}
          color="text-blue-600" bgColor="bg-blue-100"
        />
        <StatCard
          icon={Briefcase} title="Open Positions" value={openPositions.length}
          color="text-orange-600" bgColor="bg-orange-100"
        />
        <StatCard
          icon={Calendar} title="Upcoming Events" value={upcomingEvents.length}
          color="text-purple-600" bgColor="bg-purple-100"
        />
        <StatCard
          icon={Clock} title="Total Hours Logged" value={Math.round(totalHours).toLocaleString()}
          trend={`Fiscal YTD: ${Math.round(fiscalYtdHours).toLocaleString()}`}
          color="text-yellow-600" bgColor="bg-yellow-100"
        />
      </div>

      {/* Row 1: Milestone Alerts | Birthdays | Pending Approvals */}
      <div className="grid md:grid-cols-3 gap-5">

        <SectionCard icon={Trophy} iconColor="text-yellow-500" borderColor="border-l-yellow-400"
          title="Milestone Alerts" linkTo="/volunteermgr/milestones" linkLabel="Recognition">
          {volunteersWithUnawarded.length === 0
            ? <p className="text-sm text-muted-foreground py-1">No pending milestones.</p>
            : <>
              <p className="text-xs text-muted-foreground pb-1">
                {volunteersWithUnawarded.length} volunteer{volunteersWithUnawarded.length !== 1 ? 's' : ''} with unawarded milestones
              </p>
              {volunteersWithUnawarded.slice(0, 7).map(v => {
                const initials = `${v.first_name?.[0] || ''}${v.last_name?.[0] || ''}`.toUpperCase();
                return (
                  <Link key={v.id} to={`/volunteermgr/volunteers/${v.id}`}
                    className="flex items-center gap-2 hover:bg-muted/60 rounded-md px-2 py-1.5 transition-colors -mx-2">
                    <div className="w-7 h-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold shrink-0">{initials}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{v.first_name} {v.last_name}</p>
                      <p className="text-xs text-muted-foreground">{Math.round(v.total_hours || 0)} hrs</p>
                    </div>
                    <Badge className="bg-yellow-400/90 text-yellow-900 border-0 text-xs shrink-0">{v.unawardedCount} pending</Badge>
                  </Link>
                );
              })}
            </>
          }
        </SectionCard>

        <SectionCard icon={Cake} iconColor="text-pink-500" borderColor="border-l-pink-400"
          title="Upcoming Birthdays" linkTo="/volunteermgr/birthdays" linkLabel="Birthday calendar">
          {upcomingBirthdays.length === 0
            ? <p className="text-sm text-muted-foreground py-1">No birthdays in the next 7 days.</p>
            : upcomingBirthdays.map(v => {
              const initials = `${v.first_name?.[0] || ''}${v.last_name?.[0] || ''}`.toUpperCase();
              return (
                <div key={v.id} className="flex items-center gap-2 hover:bg-muted/60 rounded-md px-2 py-1.5 transition-colors -mx-2">
                  <div className="w-7 h-7 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-xs font-bold shrink-0">{initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{v.first_name} {v.last_name}</p>
                    <p className="text-xs text-muted-foreground">{v.nextBirthday.format('MMMM D')}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant="outline" className={`text-xs ${v.daysUntil === 0 ? 'border-pink-400 text-pink-600 font-semibold' : ''}`}>
                      {v.daysUntil === 0 ? '🎂 Today!' : v.daysUntil < 0 ? 'Yesterday' : `${v.daysUntil}d`}
                    </Badge>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-pink-400 hover:text-pink-600"
                      onClick={() => setBirthdayCardVolunteer(v)} title="Send birthday card">
                      <Gift className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          }
        </SectionCard>

        <SectionCard icon={CheckSquare} iconColor="text-accent" borderColor="border-l-accent"
          title="Pending Approvals" linkTo="/volunteermgr/approvals" linkLabel="All approvals">
          {pendingApprovals.length === 0
            ? <p className="text-sm text-muted-foreground py-1">No pending approvals.</p>
            : <>
              {pendingApprovals.slice(0, 6).map(a => (
                <Link key={a.id} to="/volunteermgr/approvals"
                  className="flex items-center gap-2 hover:bg-muted/60 rounded-md px-2 py-1.5 transition-colors -mx-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.volunteer_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{a.type?.replace(/_/g, ' ') || 'New Registration'}</p>
                  </div>
                </Link>
              ))}
              {pendingApprovals.length > 6 && (
                <Link to="/volunteermgr/approvals" className="block text-xs text-primary hover:underline px-2 pt-1">
                  +{pendingApprovals.length - 6} more →
                </Link>
              )}
            </>
          }
        </SectionCard>
      </div>

      {/* Row 2: Currently Signed In | Upcoming Shifts | Staff Requests */}
      <div className="grid md:grid-cols-3 gap-5">
        <SectionCard icon={UserCheck} iconColor="text-green-600" borderColor="border-l-green-400"
          title="Currently Signed In" linkTo="/volunteermgr/timelogs" linkLabel="View logs">
          {activeSignIns.length === 0
            ? <p className="text-sm text-muted-foreground py-1">No volunteers currently signed in.</p>
            : activeSignIns.slice(0, 6).map(log => (
              <div key={log.id} className="flex items-center justify-between hover:bg-muted/60 rounded-md px-2 py-1.5 transition-colors -mx-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{log.volunteer_name}</p>
                  <p className="text-xs text-muted-foreground">{log.position_title || 'General'}</p>
                </div>
                <Badge className="bg-green-100 text-green-700 border-0 text-xs shrink-0">
                  Since {moment(log.sign_in_time).format('h:mm a')}
                </Badge>
              </div>
            ))
          }
        </SectionCard>

        <SectionCard icon={CalendarClock} iconColor="text-violet-600" borderColor="border-l-violet-400"
          title="Upcoming Shifts" linkTo="/volunteermgr/schedule" linkLabel="Schedule">
          {upcomingShifts.length === 0
            ? <p className="text-sm text-muted-foreground py-1">No shifts in the next 7 days.</p>
            : upcomingShifts.slice(0, 6).map(s => (
              <div key={s.id} className="flex items-center gap-2 hover:bg-muted/60 rounded-md px-2 py-1.5 transition-colors -mx-2">
                <div className="w-2 h-2 rounded-full bg-violet-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.volunteer_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.role_title}{s.program_name ? ` · ${s.program_name}` : ''}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium">{moment(s.date).format('MMM D')}</p>
                  {s.start_time && <p className="text-xs text-muted-foreground">{s.start_time}</p>}
                </div>
              </div>
            ))
          }
        </SectionCard>

        <SectionCard icon={ClipboardList} iconColor="text-blue-600" borderColor="border-l-blue-400"
          title="Staff Volunteer Requests" linkTo="/volunteermgr/staff-requests" linkLabel="Full list">
          {pendingStaffRequests.length === 0
            ? <p className="text-sm text-muted-foreground py-1">No pending staff requests.</p>
            : pendingStaffRequests.slice(0, 6).map(r => (
              <Link key={r.id} to="/volunteermgr/staff-requests"
                className="flex items-center gap-2 hover:bg-muted/60 rounded-md px-2 py-1.5 transition-colors -mx-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.position_title}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.requester_name}{r.requester_department ? ` · ${r.requester_department}` : ''}</p>
                </div>
              </Link>
            ))
          }
        </SectionCard>

      </div>

      {/* Volunteer Hours — full-width collapsible */}
      <div className="rounded-xl border bg-card shadow overflow-hidden">
        {/* Header bar */}
        <button
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors"
          onClick={() => setLeaderboardOpen(o => !o)}
        >
          <div className="flex items-center gap-2 font-semibold text-sm">
            <TrendingUp className="w-4 h-4 text-primary" />
            Volunteer Hours
          </div>
          <div className="flex items-center gap-3">
            <Select value={leaderboardPeriod} onValueChange={e => { e.stopPropagation?.(); setLeaderboardPeriod(e); }} onClick={e => e.stopPropagation()}>
              <SelectTrigger className="h-6 text-xs px-2 w-28 border-none shadow-none bg-muted" onClick={e => e.stopPropagation()}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${leaderboardOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Expanded table */}
        {leaderboardOpen && (
          <div className="border-t max-h-96 overflow-y-auto">
            {leaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground px-5 py-4">No hours logged for this period.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-5 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Volunteer</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                    <th className="text-right px-5 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, i) => (
                    <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-2 font-medium">{entry.name}</td>
                      <td className="px-3 py-2 text-muted-foreground capitalize">{entry.volunteer_type?.replace(/_/g, ' ') || '—'}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs ${entry.status === 'active' ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {entry.status || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-2 text-right font-semibold text-primary">{entry.hours % 1 === 0 ? entry.hours : entry.hours.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <BirthdayCard
        volunteer={birthdayCardVolunteer}
        open={!!birthdayCardVolunteer}
        onOpenChange={(o) => { if (!o) setBirthdayCardVolunteer(null); }}
      />
    </div>
  );
}