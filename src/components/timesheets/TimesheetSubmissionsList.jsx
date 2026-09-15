import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TimesheetDetail from './TimesheetDetail';
import TimesheetStatusBadge from './TimesheetStatusBadge';

// Timesheets submitted by one employee (by email), newest first.
export default function TimesheetSubmissionsList({ email, emptyText }) {
  const [expandedId, setExpandedId] = useState(null);

  const { data: mine = [] } = useQuery({
    queryKey: ['timesheets', 'mine', email],
    queryFn: () => base44.entities.Timesheet.filter({ employee_email: email }, '-submitted_date', 50),
    enabled: !!email,
  });

  if (mine.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
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
  );
}