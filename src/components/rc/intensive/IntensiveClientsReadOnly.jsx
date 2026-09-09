import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { matchesWorker } from '@/lib/rcCaseAccess';

const STATUS_LABELS = { active: 'Active', waitlisted: 'Waitlisted', closed: 'Closed' };

// Read-only Intensive Services list for staff WITHOUT intensive casework
// permission — client names and whether they're receiving intensive services
// at Candora, without the full FRN workflow.
export default function IntensiveClientsReadOnly({ onlyMine = false }) {
  const { user } = useAuth();
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['rc-clients-intensive'],
    queryFn: () => base44.entities.RCClient.filter({ service_category: 'intensive_services' }, 'last_name', 200),
  });
  const { data: cases = [] } = useQuery({
    queryKey: ['intensive-cases'],
    queryFn: () => base44.entities.IntensiveCase.list(),
  });

  const list = onlyMine
    ? clients.filter(c => matchesWorker(c.assigned_worker, user) || (cases || []).some(k => k.client_id === c.id && matchesWorker(k.assigned_worker, user)))
    : clients;

  const caseByClient = {};
  (cases || []).forEach(c => { if (!caseByClient[c.client_id]) caseByClient[c.client_id] = c; });

  return (
    <div className="space-y-3">
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-3 flex items-start gap-2">
          <Lock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">
            You don't have Intensive Services casework access — this list shows client names and status only.
            A manager can grant access under Manage Portal Users.
          </p>
        </CardContent>
      </Card>

      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> :
        list.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">
            {onlyMine ? 'No Intensive Services clients assigned to you.' : 'No Intensive Services clients yet.'}
          </CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0 divide-y divide-border/50">
              {list.map(c => {
                const k = caseByClient[c.id];
                return (
                  <div key={c.id} className="flex flex-wrap items-center gap-2 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{c.first_name} {c.last_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {c.assigned_worker || k?.assigned_worker ? `Worker: ${c.assigned_worker || k.assigned_worker}` : 'No assigned worker'}
                      </p>
                    </div>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      Receiving intensive services
                    </span>
                    {k && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {STATUS_LABELS[k.case_status] || k.case_status}
                      </span>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
    </div>
  );
}