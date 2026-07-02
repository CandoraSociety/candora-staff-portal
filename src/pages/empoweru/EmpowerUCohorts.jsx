import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, Layers, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/rc/StatusBadge';
import CohortFormDialog from '@/components/empoweru/CohortFormDialog';
import { COHORT_STATUS_OPTIONS, DELIVERY_MODE_LABELS } from '@/lib/empoweruConstants';

export default function EmpowerUCohorts() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: cohorts = [], isLoading } = useQuery({ queryKey: ['empoweru-cohorts'], queryFn: () => base44.entities.EmpowerUCohort.list('-start_date') });
  const { data: registrations = [] } = useQuery({ queryKey: ['empoweru-registrations'], queryFn: () => base44.entities.EmpowerURegistration.list() });

  const getRegCount = (cohortId, status) => registrations.filter(r => r.cohort_id === cohortId && r.status === status).length;

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (c) => { setEditing(c); setDialogOpen(true); };
  const onSaved = () => { setDialogOpen(false); queryClient.invalidateQueries({ queryKey: ['empoweru-cohorts'] }); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Cohorts</h1><p className="text-muted-foreground text-sm mt-1">Manage program offerings (2-3 per year)</p></div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> New Cohort</Button>
      </div>
      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> :
       cohorts.length === 0 ? <Card><CardContent className="p-8 text-center"><Layers className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><p className="text-muted-foreground">No cohorts yet. Create one to get started.</p></CardContent></Card> :
      (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {cohorts.map(c => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <Link to={`/empoweru/cohorts/${c.id}`} className="min-w-0 flex-1"><p className="font-medium text-sm text-foreground hover:text-primary truncate">{c.name}</p></Link>
                  <div className="flex items-center gap-1 ml-2"><StatusBadge status={c.status} options={COHORT_STATUS_OPTIONS} /><Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(c)}><Pencil className="h-3 w-3" /></Button></div>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>{c.start_date ? new Date(c.start_date).toLocaleDateString() : 'TBD'} → {c.end_date ? new Date(c.end_date).toLocaleDateString() : 'TBD'}</p>
                  <p>{DELIVERY_MODE_LABELS[c.delivery_mode] || c.delivery_mode}{c.location ? ` · ${c.location}` : ''}</p>
                  {c.facilitator_name && <p>Facilitator: {c.facilitator_name}</p>}
                  <p>Enrolled: {getRegCount(c.id, 'enrolled')} / {c.capacity} · Waitlist: {getRegCount(c.id, 'waitlisted')} · Registered: {getRegCount(c.id, 'registered')}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <CohortFormDialog open={dialogOpen} onOpenChange={setDialogOpen} cohort={editing} onSaved={onSaved} />
    </div>
  );
}