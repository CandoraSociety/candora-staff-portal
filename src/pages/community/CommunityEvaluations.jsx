import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Pencil, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/rc/StatusBadge';
import EvaluationDialog from '@/components/community/EvaluationDialog';
import { ENGAGEMENT_OPTIONS, PARTICIPATION_OPTIONS, ENGAGEMENT_LABELS, PARTICIPATION_LABELS } from '@/lib/communityConstants';

export default function CommunityEvaluations() {
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: evaluations = [], isLoading } = useQuery({ queryKey: ['community-evaluations'], queryFn: () => base44.entities.CommunityEvaluation.list('-evaluation_date', 500) });
  const { data: programs = [] } = useQuery({ queryKey: ['community-programs'], queryFn: () => base44.entities.CommunityProgram.list('name', 200) });

  const filtered = evaluations.filter(e => {
    const matchSearch = (e.participant_name || '').toLowerCase().includes(search.toLowerCase()) || (e.evaluator_name || '').toLowerCase().includes(search.toLowerCase());
    const matchProgram = programFilter === 'all' || e.program_id === programFilter;
    return matchSearch && matchProgram;
  });

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (e) => { setEditing(e); setDialogOpen(true); };
  const onSaved = () => { setDialogOpen(false); queryClient.invalidateQueries({ queryKey: ['community-evaluations'] }); };

  const renderStars = (rating) => '★'.repeat(rating || 0) + '☆'.repeat(5 - (rating || 0));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Evaluations</h1><p className="text-muted-foreground text-sm mt-1">Facilitator evaluations across all programs</p></div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> New Evaluation</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by participant or evaluator..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={programFilter} onValueChange={setProgramFilter}><SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="All programs" /></SelectTrigger><SelectContent><SelectItem value="all">All programs</SelectItem>{programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
      </div>

      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> :
       filtered.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">{evaluations.length === 0 ? 'No evaluations yet.' : 'No evaluations match your filters.'}</CardContent></Card> :
      (
        <div className="space-y-2">
          {filtered.map(e => (
            <Card key={e.id} className="hover:shadow-sm transition-shadow"><CardContent className="p-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1"><p className="font-medium text-sm text-foreground truncate">{e.participant_name}</p><span className="text-amber-500 text-sm">{renderStars(e.overall_rating)}</span></div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground mb-1">
                    <span>{e.evaluation_date ? new Date(e.evaluation_date).toLocaleDateString() : ''}</span>
                    <span className="font-medium text-primary">{e.program_name}</span>
                    {e.evaluator_name && <span>By: {e.evaluator_name}</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    <StatusBadge status={e.engagement} options={ENGAGEMENT_OPTIONS} />
                    <StatusBadge status={e.participation} options={PARTICIPATION_OPTIONS} />
                  </div>
                  {e.progress_observed && <p className="text-xs text-muted-foreground mt-1"><span className="font-medium">Progress:</span> {e.progress_observed}</p>}
                  {e.areas_for_improvement && <p className="text-xs text-muted-foreground mt-0.5"><span className="font-medium">Improvement:</span> {e.areas_for_improvement}</p>}
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0" onClick={() => openEdit(e)}><Pencil className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
      <EvaluationDialog open={dialogOpen} onOpenChange={setDialogOpen} evaluation={editing} onSaved={onSaved} />
    </div>
  );
}