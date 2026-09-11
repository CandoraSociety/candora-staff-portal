import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ClipboardList } from 'lucide-react';
import TimesheetForm from '@/components/timesheets/TimesheetForm';
import TimesheetDetail from '@/components/timesheets/TimesheetDetail';
import TimesheetStatusBadge from '@/components/timesheets/TimesheetStatusBadge';
import { useCurrentUser } from '@/lib/useAuth';
import { getPayPeriod, periodLabel } from '@/lib/payPeriods';

export default function Timesheets() {
  const { user, loading } = useCurrentUser();
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState(null);
  const period = getPayPeriod(new Date());

  const { data: mine = [] } = useQuery({
    queryKey: ['timesheets', 'mine', user?.email],
    queryFn: () => base44.entities.Timesheet.filter({ employee_email: user.email }, '-submitted_date', 50),
    enabled: !!user?.email,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary" /> Timesheets
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Submit your hours for the current pay period ({periodLabel(period)}). Your supervisor reviews and approves each timesheet.
        </p>
      </div>

      {!loading && user && (
        <TimesheetForm user={user} onSubmitted={() => qc.invalidateQueries({ queryKey: ['timesheets'] })} />
      )}

      {/* My submissions */}
      <div>
        <h2 className="font-semibold mb-2">My Submissions</h2>
        {mine.length === 0 ? (
          <p className="text-sm text-muted-foreground">You haven't submitted any timesheets yet.</p>
        ) : (
          <div className="space-y-2">
            {mine.map(t => (
              <div key={t.id} className="rounded-xl border bg-card p-4">
                <button
                  className="w-full flex flex-wrap items-center gap-x-6 gap-y-1 text-left"
                  onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                >
                  <div>
                    <p className="font-medium">{t.pay_period_start} → {t.pay_period_end}</p>
                    <p className="text-xs text-muted-foreground">Submitted {t.submitted_date} · Supervisor: {t.supervisor_name || t.supervisor_email}</p>
                  </div>
                  <p className="text-sm">Total paid: <span className="font-bold">{t.total_paid_hours || 0} hrs</span></p>
                  <div className="ml-auto"><TimesheetStatusBadge status={t.status} /></div>
                </button>
                {expandedId === t.id && (
                  <div className="mt-4 border-t pt-4">
                    <TimesheetDetail timesheet={t} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}