import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import AssessmentFormDialog from '@/components/frn/AssessmentFormDialog';
import { PROGRAM_LABELS, RELEVANCE_LABELS, ABILITY_LABELS, WILLINGNESS_LABELS, RECOMMENDATION_LABELS, RECOMMENDATION_COLORS } from '@/lib/frnConstants';

export default function FRNAssessments() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['frn-assessments'],
    queryFn: () => base44.entities.FRNAssessment.list('-assessment_date', 200),
  });

  const filtered = assessments.filter(a =>
    (a.participant_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.assessor_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['frn-assessments'] });
    queryClient.invalidateQueries({ queryKey: ['frn-referrals'] });
    setDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Assessments</h1>
          <p className="text-muted-foreground text-sm mt-1">Intake assessments for program fit, ability, and willingness</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> New Assessment</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by participant or assessor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          {assessments.length === 0 ? 'No assessments yet. Click "New Assessment" to get started.' : 'No assessments match your search.'}
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map(a => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-sm text-foreground">{a.participant_name}</p>
                    <p className="text-xs text-muted-foreground">{PROGRAM_LABELS[a.program] || a.program}</p>
                  </div>
                  {a.recommendation && (
                    <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: (RECOMMENDATION_COLORS[a.recommendation] || '#64748b') + '20', color: RECOMMENDATION_COLORS[a.recommendation] || '#64748b' }}>
                      {RECOMMENDATION_LABELS[a.recommendation]}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-muted-foreground mb-0.5">Relevance</p>
                    <p className="font-medium text-foreground">{RELEVANCE_LABELS[a.relevance] || '—'}</p>
                  </div>
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-muted-foreground mb-0.5">Ability</p>
                    <p className="font-medium text-foreground">{ABILITY_LABELS[a.ability_to_participate] || '—'}</p>
                  </div>
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-muted-foreground mb-0.5">Willingness</p>
                    <p className="font-medium text-foreground">{WILLINGNESS_LABELS[a.willingness_to_participate] || '—'}</p>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>By {a.assessor_name || '—'}</span>
                  <span>{a.assessment_date ? new Date(a.assessment_date).toLocaleDateString() : ''}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AssessmentFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={handleSaved} />
    </div>
  );
}