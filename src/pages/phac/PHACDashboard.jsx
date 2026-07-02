import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Users, ClipboardList, CalendarDays, TrendingUp, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/phac/StatusBadge';
import { PROGRAM_STATUS_OPTIONS, SESSION_STATUS_OPTIONS, WEEKDAY_LABELS, formatAgeRange, isOffSeason } from '@/lib/phacConstants';

export default function PHACDashboard() {
  const { data: programs = [] } = useQuery({
    queryKey: ['phac-programs'],
    queryFn: () => base44.entities.PHACProgram.list(),
  });
  const { data: sessions = [] } = useQuery({
    queryKey: ['phac-sessions'],
    queryFn: () => base44.entities.PHACSession.list('-session_date', 200),
  });
  const { data: participants = [] } = useQuery({
    queryKey: ['phac-participants'],
    queryFn: () => base44.entities.PHACParticipant.list(),
  });

  const activePrograms = programs.filter(p => p.status === 'active');
  const now = new Date();
  const isOffSeasonNow = isOffSeason(now);

  const upcomingSessions = sessions
    .filter(s => s.status === 'scheduled' && new Date(s.session_date) >= new Date(now.toDateString()))
    .sort((a, b) => new Date(a.session_date) - new Date(b.session_date))
    .slice(0, 5);

  const recentSessions = sessions
    .filter(s => s.status === 'completed')
    .sort((a, b) => new Date(b.session_date) - new Date(a.session_date))
    .slice(0, 5);

  const totalAttendees = sessions
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + (s.attendee_count || 0), 0);

  const stats = [
    { label: 'Active Programs', value: activePrograms.length, icon: ClipboardList, path: '/phac/programs', color: '#0ea5e9' },
    { label: 'Registered Families', value: participants.length, icon: Users, path: '/phac/participants', color: '#8b5cf6' },
    { label: 'Upcoming Sessions', value: upcomingSessions.length, icon: CalendarDays, path: '/phac/sessions', color: '#f59e0b' },
    { label: 'Total Attendance (YTD)', value: totalAttendees, icon: TrendingUp, path: '/phac/sessions', color: '#22c55e' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">PHAC Programs Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Drop-in family programs for children ages 0–6</p>
      </div>

      {isOffSeasonNow && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          PHAC programs are currently on summer break (July–August). Sessions resume in September.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} to={stat.path}>
              <Card className="hover:shadow-md transition-shadow">
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
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Active Programs</CardTitle>
            <Link to="/phac/programs" className="text-xs text-primary flex items-center gap-1 hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {activePrograms.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No active programs</p>
            ) : (
              <div className="space-y-2">
                {activePrograms.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(p.schedule_days || []).map(d => WEEKDAY_LABELS[d]?.slice(0, 3)).join(', ') || 'No schedule set'}
                        {p.start_time ? ` · ${p.start_time}` : ''}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatAgeRange(p.target_age_min_months, p.target_age_max_months)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Upcoming Sessions</CardTitle>
            <Link to="/phac/sessions" className="text-xs text-primary flex items-center gap-1 hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No upcoming sessions scheduled</p>
            ) : (
              <div className="space-y-2">
                {upcomingSessions.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.program_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.session_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        {s.start_time ? ` · ${s.start_time}` : ''}
                      </p>
                    </div>
                    <StatusBadge status={s.status} options={SESSION_STATUS_OPTIONS} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}