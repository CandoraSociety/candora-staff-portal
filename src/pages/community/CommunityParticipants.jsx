import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Pencil, Star, FolderTree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/rc/StatusBadge';
import ParticipantDialog from '@/components/community/ParticipantDialog';
import EvaluationDialog from '@/components/community/EvaluationDialog';
import { REGISTRATION_STATUS_OPTIONS } from '@/lib/communityConstants';
import { useToast } from '@/components/ui/use-toast';

export default function CommunityParticipants() {
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [evalDialogOpen, setEvalDialogOpen] = useState(false);
  const [evalPreset, setEvalPreset] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: participants = [], isLoading } = useQuery({ queryKey: ['community-participants'], queryFn: () => base44.entities.CommunityParticipant.list('-created_date', 500) });
  const { data: registrations = [] } = useQuery({ queryKey: ['community-registrations-all'], queryFn: () => base44.entities.CommunityRegistration.list('-registration_date', 500) });
  const { data: programs = [] } = useQuery({ queryKey: ['community-programs'], queryFn: () => base44.entities.CommunityProgram.list('name', 200) });

  const filtered = participants.filter(p => {
    const name = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (programFilter === 'all') return true;
    return registrations.some(r => r.participant_id === p.id && r.program_id === programFilter);
  });

  const getParticipantRegs = (participantId) => registrations.filter(r => r.participant_id === participantId);

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (p) => { setEditing(p); setDialogOpen(true); };
  const onSaved = () => { setDialogOpen(false); queryClient.invalidateQueries({ queryKey: ['community-participants'] }); queryClient.invalidateQueries({ queryKey: ['community-registrations-all'] }); };

  const openEval = (p) => { setEvalPreset({ id: p.id, name: `${p.first_name} ${p.last_name}` }); setEvalDialogOpen(true); };
  const onEvalSaved = () => { setEvalDialogOpen(false); setEvalPreset(null); queryClient.invalidateQueries({ queryKey: ['community-evaluations'] }); };

  const handleRegStatusChange = async (reg, newStatus) => {
    try {
      await base44.entities.CommunityRegistration.update(reg.id, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ['community-registrations-all'] });
      toast({ title: `Status changed to ${newStatus}` });
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Participants</h1><p className="text-muted-foreground text-sm mt-1">Registered across all community programs</p></div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> New Participant</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={programFilter} onValueChange={setProgramFilter}><SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="All programs" /></SelectTrigger><SelectContent><SelectItem value="all">All programs</SelectItem>{programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
      </div>

      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> :
       filtered.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">{participants.length === 0 ? 'No participants yet.' : 'No participants match your filters.'}</CardContent></Card> :
      (
        <div className="space-y-2">
          {filtered.map(p => {
            const regs = getParticipantRegs(p.id);
            return (
              <Card key={p.id} className="hover:shadow-sm transition-shadow"><CardContent className="p-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-foreground mb-1">{p.first_name} {p.last_name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground mb-1">
                      {p.phone && <span>{p.phone}</span>}
                      {p.email && <span>{p.email}</span>}
                    </div>
                    {regs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {regs.map(r => (
                          <div key={r.id} className="flex items-center gap-1 text-xs bg-muted rounded-full pl-2 pr-1 py-0.5">
                            <FolderTree className="h-3 w-3 text-muted-foreground" />
                            <span className="text-foreground">{r.program_name}</span>
                            <Select value={r.status} onValueChange={(v) => handleRegStatusChange(r, v)}><SelectTrigger className="h-5 w-24 text-xs border-0 p-0 pr-1"><SelectValue /></SelectTrigger><SelectContent>{REGISTRATION_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => openEval(p)} title="Add evaluation"><Star className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent></Card>
            );
          })}
        </div>
      )}
      <ParticipantDialog open={dialogOpen} onOpenChange={setDialogOpen} participant={editing} onSaved={onSaved} />
      <EvaluationDialog open={evalDialogOpen} onOpenChange={setEvalDialogOpen} evaluation={null} presetParticipantId={evalPreset?.id} presetParticipantName={evalPreset?.name} onSaved={onEvalSaved} />
    </div>
  );
}