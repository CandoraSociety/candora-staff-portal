import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Users, CalendarDays, Star, FolderTree, Plus, ArrowRight, Heart, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/rc/StatusBadge';
import { PROGRAM_CATEGORY_OPTIONS, PROGRAM_STATUS_OPTIONS } from '@/lib/communityConstants';

export default function CommunityDashboard() {
  const { data: programs = [] } = useQuery({ queryKey: ['community-programs'], queryFn: () => base44.entities.CommunityProgram.list('name', 200) });
  const { data: participants = [] } = useQuery({ queryKey: ['community-participants'], queryFn: () => base44.entities.CommunityParticipant.list('-created_date', 500) });
  const { data: sessions = [] } = useQuery({ queryKey: ['community-sessions'], queryFn: () => base44.entities.CommunitySession.list('-session_date', 200) });
  const { data: evaluations = [] } = useQuery({ queryKey: ['community-evaluations'], queryFn: () => base44.entities.CommunityEvaluation.list('-evaluation_date', 200) });

  const activePrograms = programs.filter(p => p.status === 'active');
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingSessions = sessions.filter(s => s.session_date >= todayStr && s.status === 'scheduled').slice(0, 5);

  const stats = [
    { label: 'Active Programs', value: activePrograms.length, icon: FolderTree, color: '#3b82f6' },
    { label: 'Participants', value: participants.length, icon: Users, color: '#22c55e' },
    { label: 'Upcoming Sessions', value: upcomingSessions.length, icon: CalendarDays, color: '#f59e0b' },
    { label: 'Evaluations', value: evaluations.length, icon: Star, color: '#ec4899' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Community Programs</h1><p className="text-muted-foreground text-sm mt-1">Occasional & volunteer-run programs</p></div>
        <Link to="/community/programs"><Button><Plus className="h-4 w-4" /> New Program</Button></Link>
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
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Upcoming Sessions</CardTitle><Link to="/community/sessions" className="text-xs text-primary flex items-center gap-1 hover:underline">View all <ArrowRight className="h-3 w-3" /></Link></CardHeader>
          <CardContent>
            {upcomingSessions.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No upcoming sessions</p> : (
              <div className="space-y-2">{upcomingSessions.map(s => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                  <div><p className="text-sm font-medium text-foreground">{s.title || s.program_name}</p><p className="text-xs text-muted-foreground">{new Date(s.session_date).toLocaleDateString()} · {s.start_time || 'TBD'} · {s.facilitator_name || 'TBD'}</p></div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{s.program_name}</span>
                </div>
              ))}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Active Programs</CardTitle><Link to="/community/programs" className="text-xs text-primary flex items-center gap-1 hover:underline">View all <ArrowRight className="h-3 w-3" /></Link></CardHeader>
          <CardContent>
            {activePrograms.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No active programs yet</p> : (
              <div className="space-y-2">{activePrograms.slice(0, 5).map(p => {
                const cat = PROGRAM_CATEGORY_OPTIONS.find(c => c.value === p.category);
                return (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                    <div className="flex items-center gap-2"><span>{cat?.icon}</span><div><p className="text-sm font-medium text-foreground">{p.name}</p><p className="text-xs text-muted-foreground">{p.schedule_description || cat?.label}</p></div></div>
                    <StatusBadge status={p.status} options={PROGRAM_STATUS_OPTIONS} />
                  </div>
                );
              })}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Link to="/community/programs"><Card className="hover:shadow-md transition-shadow cursor-pointer"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center"><FolderTree className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm font-medium text-foreground">Programs</p><p className="text-xs text-muted-foreground">{programs.length} total</p></div></CardContent></Card></Link>
        <Link to="/community/participants"><Card className="hover:shadow-md transition-shadow cursor-pointer"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center"><Users className="h-5 w-5 text-green-600" /></div><div><p className="text-sm font-medium text-foreground">Participants</p><p className="text-xs text-muted-foreground">{participants.length} registered</p></div></CardContent></Card></Link>
        <Link to="/community/sessions"><Card className="hover:shadow-md transition-shadow cursor-pointer"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center"><CalendarDays className="h-5 w-5 text-amber-600" /></div><div><p className="text-sm font-medium text-foreground">Sessions</p><p className="text-xs text-muted-foreground">{sessions.length} total</p></div></CardContent></Card></Link>
      </div>
    </div>
  );
}