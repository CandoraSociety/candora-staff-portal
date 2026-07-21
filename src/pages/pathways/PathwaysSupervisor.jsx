import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserPlus, ClipboardList, Users, Mail, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import AssignSupervisorDialog from '@/components/pathways/AssignSupervisorDialog';
import SupervisorEvaluationDialog from '@/components/pathways/SupervisorEvaluationDialog';

const PLACEMENT_TYPES = [
  { value: 'cleaning_arc',           label: 'Cleaning (ARC)' },
  { value: 'food_services_onsite',   label: 'Food Services (Onsite)' },
  { value: 'food_services_offsite',  label: 'Food Services (Offsite)' },
  { value: 'reception',              label: 'Reception' },
  { value: 'childcare',              label: 'Childcare' },
];

const STATUS_COLORS = {
  referred:   'bg-blue-100 text-blue-700',
  active:     'bg-green-100 text-green-700',
  completed:  'bg-emerald-100 text-emerald-700',
  withdrawn:  'bg-amber-100 text-amber-700',
  cancelled:  'bg-red-100 text-red-700',
};

export default function PathwaysSupervisor() {
  const queryClient = useQueryClient();
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [showEvalDialog, setShowEvalDialog] = useState(false);

  const { data: trainings = [], isLoading } = useQuery({
    queryKey: ['pathways-trainings'],
    queryFn: () => base44.entities.InternalTraining.list('-referral_date', 200),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['pathways-trainings'] });
  };

  const supervised = trainings.filter(t => t.supervisor_email);
  const unsupervised = trainings.filter(t => !t.supervisor_email && t.status !== 'cancelled' && t.status !== 'withdrawn');

  const bySupervisor = useMemo(() => {
    const groups = {};
    supervised.forEach(t => {
      const key = t.supervisor_email;
      if (!groups[key]) groups[key] = { name: t.supervisor_name, email: key, placements: [] };
      groups[key].placements.push(t);
    });
    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
  }, [supervised]);

  const openEval = (training) => {
    setSelectedTraining(training);
    setShowEvalDialog(true);
  };

  const placementLabel = (type) => PLACEMENT_TYPES.find(p => p.value === type)?.label || type?.replace(/_/g, ' ');

  return (
    <div className="space-y-6 px-6 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Internal Supervisor Portal</h1>
          <p className="text-sm text-slate-600 mt-1">
            Internal training placement supervisors can view their assigned placements, submit progress updates, and complete evaluations.
          </p>
        </div>
        <Button onClick={() => setShowAssignDialog(true)} className="shrink-0">
          <UserPlus className="w-4 h-4 mr-2" />
          Assign Supervisor
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600"><Users className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm text-slate-600">Active Supervisors</p>
                  <p className="text-2xl font-bold">{bySupervisor.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-100 text-green-600"><ClipboardList className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm text-slate-600">Supervised Placements</p>
                  <p className="text-2xl font-bold">{supervised.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-amber-100 text-amber-600"><UserPlus className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm text-slate-600">Awaiting Supervisor</p>
                  <p className="text-2xl font-bold">{unsupervised.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Placements grouped by supervisor */}
          {bySupervisor.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800">Supervised Placements</h2>
              {bySupervisor.map(group => (
                <Card key={group.email}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">
                        {group.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-base">{group.name}</CardTitle>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {group.email}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-auto">
                        {group.placements.length} placement{group.placements.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {group.placements.map(t => (
                        <PlacementRow
                          key={t.id}
                          training={t}
                          placementLabel={placementLabel}
                          onOpen={() => openEval(t)}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Unassigned placements */}
          {unsupervised.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Placements Awaiting Supervisor Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {unsupervised.map(t => (
                    <PlacementRow
                      key={t.id}
                      training={t}
                      placementLabel={placementLabel}
                      onOpen={() => openEval(t)}
                      unassigned
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {trainings.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No internal training placements yet.</p>
                <p className="text-slate-400 text-xs mt-1">Click "Assign Supervisor" to get started.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <AssignSupervisorDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        onAssigned={refresh}
      />

      <SupervisorEvaluationDialog
        training={selectedTraining}
        open={showEvalDialog}
        onOpenChange={setShowEvalDialog}
        onSaved={refresh}
      />
    </div>
  );
}

function PlacementRow({ training, placementLabel, onOpen, unassigned }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{training.client_name}</p>
        <p className="text-xs text-slate-500">{placementLabel(training.placement_type)}</p>
        {training.training_goals && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">Goals: {training.training_goals}</p>
        )}
      </div>
      <Badge className={`text-xs ${STATUS_COLORS[training.status] || 'bg-slate-100'}`}>
        {training.status}
      </Badge>
      {training.evaluation_completed && (
        <Badge variant="outline" className="text-xs text-green-600 border-green-300">Evaluated</Badge>
      )}
      <Button variant="ghost" size="sm" className="text-xs shrink-0" onClick={onOpen}>
        {unassigned ? 'Assign / View' : 'View Progress'}
        <ChevronRight className="w-3 h-3 ml-1" />
      </Button>
    </div>
  );
}