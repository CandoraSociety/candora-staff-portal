import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSupervisorAccess } from '@/lib/useSupervisorAccess';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, AlertTriangle, Eye, CheckCircle } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import AccessDenied from '@/components/shared/AccessDenied';
import IncidentFormNew from '@/components/incidents/IncidentFormNew';
import ResolutionForm from '@/components/incidents/ResolutionForm';
import { format } from 'date-fns';

export default function NexusIncidents() {
  const { canAccessHR, user, isAdmin, directReports, employees } = useSupervisorAccess();
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [showResolution, setShowResolution] = useState(false);
  const queryClient = useQueryClient();

  const { data: incidents = [] } = useQuery({ queryKey: ['incidents'], queryFn: () => base44.entities.IncidentReport.list('-created_date', 200) });
  const { data: resolutions = [] } = useQuery({ queryKey: ['resolutions'], queryFn: () => base44.entities.IncidentResolution.list('-created_date', 200) });
  const { data: supervisors = [] } = useQuery({
    queryKey: ['supervisors'],
    queryFn: async () => { const users = await base44.entities.User.list(); return users.filter(u => u.role === 'admin' || u.role === 'manager'); },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.IncidentReport.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['incidents'] }); setShowForm(false); },
  });
  const createResolutionMutation = useMutation({
    mutationFn: (data) => base44.entities.IncidentResolution.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['resolutions'] }); setShowResolution(false); setViewing(null); },
  });

  if (!canAccessHR) return <AccessDenied />;

  const visibleIncidents = isAdmin ? incidents : incidents.filter(inc => inc.reporter_email === user?.email);
  const incidentFormEmployees = isAdmin ? employees : directReports;

  const getRelatedResolutions = (incidentId) => resolutions.filter(r => r.incident_id === incidentId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incident Reports"
        actions={<Button onClick={() => setShowForm(true)} size="sm"><Plus className="w-4 h-4 mr-1" />New Report</Button>}
      />

      {visibleIncidents.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No incidents" description="No incident reports on file." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left text-muted-foreground">
                  <th className="p-4 font-medium">Employees</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium hidden md:table-cell">Severity</th>
                  <th className="p-4 font-medium hidden lg:table-cell">Assigned To</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visibleIncidents.map(inc => {
                  const related = getRelatedResolutions(inc.id);
                  return (
                    <tr key={inc.id} className="hover:bg-muted/30">
                      <td className="p-4 font-medium">{inc.employee_names?.join(', ')}</td>
                      <td className="p-4">{inc.incident_type?.replace(/_/g, ' ')}</td>
                      <td className="p-4 hidden md:table-cell"><StatusBadge status={inc.severity} /></td>
                      <td className="p-4 hidden lg:table-cell">{inc.assigned_to_name || '—'}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <StatusBadge status={inc.status} />
                          {related.length > 0 && <CheckCircle className="w-4 h-4 text-primary" />}
                        </div>
                      </td>
                      <td className="p-4">
                        <Button variant="ghost" size="sm" onClick={() => setViewing(inc)}><Eye className="w-4 h-4" /></Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>File Incident Report</DialogTitle></DialogHeader>
          <IncidentFormNew employees={incidentFormEmployees} supervisors={supervisors} user={user} onSubmit={createMutation.mutate} isLoading={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Incident — {viewing?.employee_names?.join(', ')}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Type</p><p className="font-medium">{viewing.incident_type?.replace(/_/g, ' ')}</p></div>
                <div><p className="text-muted-foreground">Severity</p><StatusBadge status={viewing.severity} /></div>
                <div><p className="text-muted-foreground">Date</p><p>{viewing.incident_date && format(new Date(viewing.incident_date), 'MMM d, yyyy')}</p></div>
                <div><p className="text-muted-foreground">Reporter</p><p>{viewing.reporter_name}</p></div>
                {viewing.assigned_to_name && <div><p className="text-muted-foreground">Assigned To</p><p>{viewing.assigned_to_name}</p></div>}
              </div>
              <div><p className="text-muted-foreground text-sm">Description</p><p className="text-sm mt-1 bg-muted/40 p-3 rounded">{viewing.description}</p></div>
              {viewing.witnesses && <div><p className="text-muted-foreground text-sm">Witnesses</p><p className="text-sm">{viewing.witnesses}</p></div>}

              <div>
                <h3 className="font-semibold text-sm mb-2">Resolutions</h3>
                {getRelatedResolutions(viewing.id).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No resolutions filed yet.</p>
                ) : (
                  <div className="space-y-2">
                    {getRelatedResolutions(viewing.id).map(res => (
                      <div key={res.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                        <span>{res.resolution_type?.replace(/_/g, ' ')}</span>
                        <span className="text-muted-foreground">{res.resolution_date && format(new Date(res.resolution_date), 'MMM d, yyyy')}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Button size="sm" variant="outline" className="mt-2" onClick={() => setShowResolution(true)}>Add Resolution</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showResolution} onOpenChange={setShowResolution}>
        <DialogContent><DialogHeader><DialogTitle>Document Resolution</DialogTitle></DialogHeader>
          {viewing && <ResolutionForm incident={viewing} user={user} onSubmit={createResolutionMutation.mutate} isLoading={createResolutionMutation.isPending} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}