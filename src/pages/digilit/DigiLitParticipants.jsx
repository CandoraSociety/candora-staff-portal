import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Pencil, Link2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/rc/StatusBadge';
import ParticipantDialog from '@/components/digilit/ParticipantDialog';
import EvaluationDialog from '@/components/digilit/EvaluationDialog';
import { PARTICIPANT_STATUS_OPTIONS, SKILL_LEVEL_OPTIONS, SKILL_LEVEL_LABELS } from '@/lib/digilitConstants';
import { useToast } from '@/components/ui/use-toast';
import { syncToPathways } from '@/lib/digilitPathwaysSync';

export default function DigiLitParticipants() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pathwaysOnly, setPathwaysOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [evalDialogOpen, setEvalDialogOpen] = useState(false);
  const [evalPreset, setEvalPreset] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: participants = [], isLoading } = useQuery({ queryKey: ['digilit-participants'], queryFn: () => base44.entities.DigiLitParticipant.list('-registration_date', 500) });

  const filtered = participants.filter(p => {
    const matchSearch = (p.first_name || '').toLowerCase().includes(search.toLowerCase()) || (p.last_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchPathways = !pathwaysOnly || p.is_pathways_participant;
    return matchSearch && matchStatus && matchPathways;
  });

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (p) => { setEditing(p); setDialogOpen(true); };
  const onSaved = () => { setDialogOpen(false); queryClient.invalidateQueries({ queryKey: ['digilit-participants'] }); };

  const openEval = (p) => { setEvalPreset({ id: p.id, name: `${p.first_name} ${p.last_name}` }); setEvalDialogOpen(true); };
  const onEvalSaved = () => { setEvalDialogOpen(false); setEvalPreset(null); queryClient.invalidateQueries({ queryKey: ['digilit-evaluations'] }); };

  const handleStatusChange = async (participant, newStatus) => {
    const oldStatus = participant.status;
    if (oldStatus === newStatus) return;
    const updates = { status: newStatus };
    if (newStatus === 'started' && !participant.start_date) updates.start_date = new Date().toISOString().split('T')[0];
    if (newStatus === 'completed' && !participant.completion_date) updates.completion_date = new Date().toISOString().split('T')[0];

    try {
      await base44.entities.DigiLitParticipant.update(participant.id, updates);
      queryClient.invalidateQueries({ queryKey: ['digilit-participants'] });

      // Sync to Pathways if linked
      if (participant.is_pathways_participant && participant.pathways_client_id) {
        const result = await syncToPathways({
          pathways_client_id: participant.pathways_client_id,
          participant_name: `${participant.first_name} ${participant.last_name}`,
          newStatus, oldStatus,
        });
        if (result.success) toast({ title: 'Pathways updated', description: `Milestone and progress note added to Pathways client profile` });
        else toast({ title: 'Pathways sync failed', description: result.error, variant: 'destructive' });
      }
      toast({ title: `Status changed to ${newStatus}` });
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Participants</h1><p className="text-muted-foreground text-sm mt-1">Register and manage Digital Literacy participants</p></div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> New Registration</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{PARTICIPANT_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
        <Button variant={pathwaysOnly ? 'default' : 'outline'} onClick={() => setPathwaysOnly(!pathwaysOnly)} className="gap-1.5"><Link2 className="h-4 w-4" /> Pathways Only</Button>
      </div>

      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> :
       filtered.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">{participants.length === 0 ? 'No participants registered yet.' : 'No participants match your filters.'}</CardContent></Card> :
      (
        <div className="space-y-2">
          {filtered.map(p => (
            <Card key={p.id} className="hover:shadow-sm transition-shadow"><CardContent className="p-3">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm text-foreground truncate">{p.first_name} {p.last_name}</p>
                    {p.is_pathways_participant && <span className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700"><Link2 className="h-3 w-3" /> Pathways</span>}
                    {p.partner_organization && <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{p.partner_organization}</span>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    <span>Registered: {p.registration_date ? new Date(p.registration_date).toLocaleDateString() : ''}</span>
                    {p.skill_level_current && p.skill_level_current !== 'not_assessed' && <span>Skill: {SKILL_LEVEL_LABELS[p.skill_level_current]}</span>}
                    {p.phone && <span>{p.phone}</span>}
                    {p.email && <span>{p.email}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Select value={p.status} onValueChange={(v) => handleStatusChange(p, v)}><SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger><SelectContent>{PARTICIPANT_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
                  <Button size="sm" variant="ghost" onClick={() => openEval(p)} title="Add evaluation"><Star className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
      <ParticipantDialog open={dialogOpen} onOpenChange={setDialogOpen} participant={editing} onSaved={onSaved} />
      <EvaluationDialog open={evalDialogOpen} onOpenChange={setEvalDialogOpen} evaluation={null} presetParticipantId={evalPreset?.id} presetParticipantName={evalPreset?.name} onSaved={onEvalSaved} />
    </div>
  );
}