import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Calendar, CalendarDays, ClipboardCheck, Mail, MapPin, Pencil, Phone, Plus, Repeat, User, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/rc/StatusBadge';
import ProgramDialog from '@/components/community/ProgramDialog';
import SessionDialog from '@/components/community/SessionDialog';
import SessionDetailDialog from '@/components/community/SessionDetailDialog';
import { PROGRAM_CATEGORY_OPTIONS, PROGRAM_STATUS_OPTIONS, SESSION_STATUS_OPTIONS, REGISTRATION_STATUS_OPTIONS, FUNDER_CATEGORY_LABELS } from '@/lib/communityConstants';
import { useToast } from '@/components/ui/use-toast';

export default function CommunityProgramDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [detailSession, setDetailSession] = useState(null);

  const { data: program, isLoading } = useQuery({ queryKey: ['community-program', id], queryFn: () => base44.entities.CommunityProgram.get(id) });
  const { data: sessions = [] } = useQuery({ queryKey: ['community-sessions'], queryFn: () => base44.entities.CommunitySession.list('-session_date', 200) });
  const { data: registrations = [] } = useQuery({ queryKey: ['community-registrations-all'], queryFn: () => base44.entities.CommunityRegistration.list('-registration_date', 500) });
  const { data: participants = [] } = useQuery({ queryKey: ['community-participants'], queryFn: () => base44.entities.CommunityParticipant.list('name', 500) });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-muted-foreground">Program not found.</p>
        <Button variant="outline" asChild><Link to="/community/programs">Back to Programs</Link></Button>
      </div>
    );
  }

  const programSessions = sessions.filter(s => s.program_id === id);
  const programRegs = registrations.filter(r => r.program_id === id);
  const participantById = Object.fromEntries(participants.map(p => [p.id, p]));

  const invalidateSessions = () => queryClient.invalidateQueries({ queryKey: ['community-sessions'] });

  const updateRegStatus = async (reg, status) => {
    try {
      await base44.entities.CommunityRegistration.update(reg.id, { status });
      queryClient.invalidateQueries({ queryKey: ['community-registrations-all'] });
      toast({ title: `${reg.participant_name} marked ${status}` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const cat = PROGRAM_CATEGORY_OPTIONS.find(c => c.value === program.category);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link to="/community/programs"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl">{cat?.icon}</span>
                <h1 className="text-2xl font-heading font-bold text-foreground">{program.name}</h1>
                <StatusBadge status={program.status} options={PROGRAM_STATUS_OPTIONS} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{cat?.label}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}><Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit Program</Button>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 ml-11 text-sm text-muted-foreground">
            {program.schedule_description && <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /><span className="text-xs">{program.schedule_description}</span></span>}
            {program.lead_facilitator_name && <span className="flex items-center gap-1.5"><User className="h-4 w-4" /><span className="text-xs">Lead: {program.lead_facilitator_name}</span></span>}
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /><span className="text-xs">{programRegs.filter(r => r.status !== 'withdrawn').length} registered</span></span>
            <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /><span className="text-xs">{programSessions.length} sessions</span></span>
            {program.is_volunteer_run && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Volunteer-run</span>}
            {program.funder_category && program.funder_category !== 'none' && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Funder: {FUNDER_CATEGORY_LABELS[program.funder_category]}</span>}
          </div>

          {program.description && <p className="text-sm text-muted-foreground leading-relaxed mt-3 ml-11">{program.description}</p>}
        </CardContent>
      </Card>

      <Tabs defaultValue="sessions">
        <TabsList>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setEditingSession(null); setSessionDialogOpen(true); }}><Plus className="h-4 w-4" /> New Session</Button>
          </div>
          {programSessions.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No sessions scheduled for this program yet.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {programSessions.map(s => {
                const regCount = (s.registered_participant_ids || []).length;
                const attCount = (s.attended_participant_ids || []).length;
                return (
                  <Card key={s.id} className="hover:shadow-md transition-shadow"><CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1"><p className="font-medium text-sm text-foreground truncate">{s.title || 'Untitled Session'}</p>
                        <p className="text-xs text-muted-foreground">{new Date(s.session_date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}{(s.start_time || s.end_time) && ` · ${s.start_time || ''}${s.end_time ? `–${s.end_time}` : ''}`}</p>
                      </div>
                      <StatusBadge status={s.status} options={SESSION_STATUS_OPTIONS} />
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {s.recurrence_pattern && s.recurrence_pattern !== 'none' && <p className="flex items-center gap-1.5"><Repeat className="h-3 w-3" /> Repeats {s.recurrence_pattern}{s.recurrence_end_date ? ` until ${new Date(s.recurrence_end_date + 'T00:00:00').toLocaleDateString()}` : ''}</p>}
                      {s.location && <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {s.location}</p>}
                      {s.facilitator_name && <p className="flex items-center gap-1.5"><User className="h-3 w-3" /> {s.facilitator_name}</p>}
                      <p className="flex items-center gap-1.5"><Users className="h-3 w-3" /> {regCount} registered{s.status === 'completed' && ` · ${attCount} attended`}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/50">
                      <Button size="sm" variant="outline" onClick={() => setDetailSession(s)}><ClipboardCheck className="h-4 w-4" /> Attendance &amp; Details</Button>
                      <Button size="sm" variant="ghost" className="ml-auto" onClick={() => { setEditingSession(s); setSessionDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                    </div>
                  </CardContent></Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="participants" className="mt-4">
          <Card>
            <CardContent className="p-4">
              {programRegs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No participants registered for this program yet.</p>
              ) : (
                <div className="divide-y divide-border/60">
                  {programRegs.map(r => {
                    const p = participantById[r.participant_id];
                    return (
                      <div key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm text-foreground">{r.participant_name}</p>
                          <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground mt-0.5">
                            {r.registration_date && <span>Registered {new Date(r.registration_date + 'T00:00:00').toLocaleDateString()}</span>}
                            {p?.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {p.phone}</span>}
                            {p?.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {p.email}</span>}
                          </div>
                          {r.notes && <p className="text-xs text-muted-foreground mt-1">{r.notes}</p>}
                        </div>
                        <StatusBadge status={r.status} options={REGISTRATION_STATUS_OPTIONS} />
                        <Select value={r.status || 'registered'} onValueChange={(v) => updateRegStatus(r, v)}>
                          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{REGISTRATION_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ProgramDialog open={editOpen} onOpenChange={setEditOpen} program={program} onSaved={() => { setEditOpen(false); queryClient.invalidateQueries({ queryKey: ['community-programs'] }); queryClient.invalidateQueries({ queryKey: ['community-program', id] }); }} />
      <SessionDialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen} session={editingSession} presetProgramId={program.id} presetProgramName={program.name} onSaved={() => { setSessionDialogOpen(false); invalidateSessions(); }} />
      <SessionDetailDialog open={!!detailSession} onOpenChange={(v) => { if (!v) setDetailSession(null); }} session={detailSession} onSaved={invalidateSessions} />
    </div>
  );
}