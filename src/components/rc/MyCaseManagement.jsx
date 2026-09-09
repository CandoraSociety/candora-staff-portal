import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarCheck } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import PendingVisitCard from '@/components/rc/PendingVisitCard';
import { VISIT_TYPE_LABELS } from '@/lib/rcClientVisits';

// "My Case Management" tab (Case Management page) — client visits assigned to
// the signed-in caseworker, pending until they complete the visit record.
export default function MyCaseManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: visits = [], isLoading } = useQuery({
    queryKey: ['rc-client-visits'],
    queryFn: () => base44.entities.RCClientVisit.list('-created_date', 500),
  });

  const myEmail = (user?.email || '').toLowerCase();
  const myName = (user?.full_name || '').toLowerCase();
  const myVisits = (visits || []).filter((v) =>
    (v.caseworker_email || '').toLowerCase() === myEmail ||
    (v.caseworker_name || '').toLowerCase() === myName
  );
  const pending = myVisits.filter((v) => v.status === 'pending');
  const completed = myVisits.filter((v) => v.status === 'complete');

  const onCompleted = () => queryClient.invalidateQueries({ queryKey: ['rc-client-visits'] });

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pending Visits ({pending.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && (
            <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
          )}
          {!isLoading && pending.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6 flex items-center justify-center gap-1.5">
              <CalendarCheck className="h-4 w-4" /> No pending client visits assigned to you
            </p>
          )}
          {!isLoading && pending.map((v) => (
            <PendingVisitCard key={v.id} visit={v} onCompleted={onCompleted} />
          ))}
        </CardContent>
      </Card>

      {completed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completed Visits ({completed.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {completed.map((v) => (
              <div key={v.id} className="p-3 rounded-md border border-border/50">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-foreground">
                    {v.client_name} — {VISIT_TYPE_LABELS[v.visit_type] || v.visit_type}
                  </p>
                  <span className="text-xs text-muted-foreground">{new Date(v.visit_date).toLocaleDateString()}</span>
                </div>
                {v.visit_notes && <p className="text-sm text-muted-foreground">{v.visit_notes}</p>}
                {v.follow_up_required && (
                  <p className={`text-xs mt-1 font-medium ${v.follow_up_required === 'yes' ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    Follow up required: {v.follow_up_required === 'yes' ? 'Yes' : 'No'}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}