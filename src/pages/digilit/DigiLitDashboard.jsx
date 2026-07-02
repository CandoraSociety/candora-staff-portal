import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Users, CalendarDays, Star, Monitor, Plus, ArrowRight, Link2, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/rc/StatusBadge';
import { PARTICIPANT_STATUS_OPTIONS, SESSION_STATUS_OPTIONS, TOPIC_AREA_LABELS, SKILL_LEVEL_LABELS, SKILL_LEVEL_OPTIONS } from '@/lib/digilitConstants';

export default function DigiLitDashboard() {
  const { data: participants = [] } = useQuery({ queryKey: ['digilit-participants'], queryFn: () => base44.entities.DigiLitParticipant.list('-registration_date', 500) });
  const { data: sessions = [] } = useQuery({ queryKey: ['digilit-sessions'], queryFn: () => base44.entities.DigiLitSession.list('-session_date', 200) });
  const { data: evaluations = [] } = useQuery({ queryKey: ['digilit-evaluations'], queryFn: () => base44.entities.DigiLitEvaluation.list('-evaluation_date', 200) });

  const active = participants.filter(p => p.status === 'started' || p.status === 'registered');
  const completed = participants.filter(p => p.status === 'completed');
  const pathwaysLinked = participants.filter(p => p.is_pathways_participant);
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingSessions = sessions.filter(s => s.session_date >= todayStr && s.status === 'scheduled').slice(0, 5);

  const stats = [
    { label: 'Active Participants', value: active.length, icon: Users, color: '#3b82f6' },
    { label: 'Completed', value: completed.length, icon: Award, color: '#22c55e' },
    { label: 'Pathways Linked', value: pathwaysLinked.length, icon: Link2, color: '#8b5cf6' },
    { label: 'Upcoming Sessions', value: upcomingSessions.length, icon: CalendarDays, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Digital Literacy Dashboard</h1><p className="text-muted-foreground text-sm mt-1">Volunteer-led program in partnership with PALS</p></div>
        <Link to="/digilit/participants"><Button><Plus className="h-4 w-4" /> New Registration</Button></Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => { const Icon = stat.icon; return (
          <Card key={stat.label}><CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.color + '15' }}><Icon className="h-5 w-5" style={{ color: stat.color }} /></div>
            <div><p className="text-2xl font-bold text-foreground">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div>
          </CardContent></Card>
        ); })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Upcoming Sessions</CardTitle><Link to="/digilit/sessions" className="text-xs text-primary flex items-center gap-1 hover:underline">View all <ArrowRight className="h-3 w-3" /></Link></CardHeader>
          <CardContent>
            {upcomingSessions.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No upcoming sessions</p> : (
              <div className="space-y-2">{upcomingSessions.map(s => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                  <div><p className="text-sm font-medium text-foreground">{s.title}</p><p className="text-xs text-muted-foreground">{new Date(s.session_date).toLocaleDateString()} · {s.start_time} · {s.facilitator_name || 'TBD'}</p></div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{TOPIC_AREA_LABELS[s.topic_area] || s.topic_area}</span>
                </div>
              ))}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Recent Registrations</CardTitle><Link to="/digilit/participants" className="text-xs text-primary flex items-center gap-1 hover:underline">View all <ArrowRight className="h-3 w-3" /></Link></CardHeader>
          <CardContent>
            {participants.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No participants yet</p> : (
              <div className="space-y-2">{participants.slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                  <div className="flex items-center gap-2"><p className="text-sm font-medium text-foreground">{p.first_name} {p.last_name}</p>{p.is_pathways_participant && <Link2 className="h-3 w-3 text-purple-500" />}</div>
                  <StatusBadge status={p.status} options={PARTICIPANT_STATUS_OPTIONS} />
                </div>
              ))}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Link to="/digilit/participants"><Card className="hover:shadow-md transition-shadow cursor-pointer"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center"><Users className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm font-medium text-foreground">Participants</p><p className="text-xs text-muted-foreground">{participants.length} registered</p></div></CardContent></Card></Link>
        <Link to="/digilit/sessions"><Card className="hover:shadow-md transition-shadow cursor-pointer"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center"><CalendarDays className="h-5 w-5 text-green-600" /></div><div><p className="text-sm font-medium text-foreground">Sessions</p><p className="text-xs text-muted-foreground">{sessions.length} total</p></div></CardContent></Card></Link>
        <Link to="/digilit/evaluations"><Card className="hover:shadow-md transition-shadow cursor-pointer"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center"><Star className="h-5 w-5 text-amber-600" /></div><div><p className="text-sm font-medium text-foreground">Evaluations</p><p className="text-xs text-muted-foreground">{evaluations.length} submitted</p></div></CardContent></Card></Link>
      </div>
    </div>
  );
}