import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSupervisorAccess } from '@/lib/useSupervisorAccess';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Plus } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import AccessDenied from '@/components/shared/AccessDenied';
import CorrectiveActionForm from '@/components/nexushr/CorrectiveActionForm';
import { format } from 'date-fns';

export default function NexusCorrectiveActions() {
  const { canAccessHR, user, isAdmin, directReports, employees } = useSupervisorAccess();
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: actions = [] } = useQuery({ queryKey: ['corrective-actions'], queryFn: () => base44.entities.CorrectiveAction.list('-created_date', 200) });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CorrectiveAction.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['corrective-actions'] }); setShowForm(false); },
  });

  if (!canAccessHR) return <AccessDenied />;

  const visibleActions = isAdmin ? actions : actions.filter(a => a.issued_by_email === user?.email);
  const formEmployees = isAdmin ? employees : directReports;

  return (
    <div className="space-y-6">
      <PageHeader title="Corrective Actions" actions={<Button onClick={() => setShowForm(true)} size="sm"><Plus className="w-4 h-4 mr-1" />New Action</Button>} />

      {visibleActions.length === 0 ? (
        <EmptyState icon={Shield} title="No corrective actions" description="Corrective actions will appear here." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left text-muted-foreground">
                  <th className="p-4 font-medium">Employee</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium hidden md:table-cell">Date</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visibleActions.map(a => (
                  <tr key={a.id} className="hover:bg-muted/30">
                    <td className="p-4 font-medium">{a.employee_name}</td>
                    <td className="p-4">{a.action_type?.replace(/_/g, ' ')}</td>
                    <td className="p-4 hidden md:table-cell">{a.issue_date && format(new Date(a.issue_date), 'MMM d, yyyy')}</td>
                    <td className="p-4"><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent><DialogHeader><DialogTitle>New Corrective Action</DialogTitle></DialogHeader>
          <CorrectiveActionForm employees={formEmployees} user={user} onSubmit={createMutation.mutate} isLoading={createMutation.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}