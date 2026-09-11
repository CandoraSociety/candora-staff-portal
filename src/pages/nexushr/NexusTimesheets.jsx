import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';
import TimesheetDetail from '@/components/timesheets/TimesheetDetail';
import TimesheetStatusBadge from '@/components/timesheets/TimesheetStatusBadge';

// HR Management portal — all submitted timesheets, split into
// Pending Approval (awaiting the supervisor) and Approved lists.
export default function NexusTimesheets() {
  const [expandedId, setExpandedId] = useState(null);

  const { data: timesheets = [], isLoading } = useQuery({
    queryKey: ['timesheets', 'all'],
    queryFn: () => base44.entities.Timesheet.list('-submitted_date', 200),
  });

  const pending = timesheets.filter(t => t.status === 'pending');
  const approved = timesheets.filter(t => t.status === 'approved');
  const rejected = timesheets.filter(t => t.status === 'rejected');

  const Section = ({ title, items, highlight }) => (
    <div>
      <h2 className="font-semibold mb-2 flex items-center gap-2">
        {title}
        <span className={`text-xs px-2 py-0.5 rounded-full ${highlight ? 'bg-warning/15 text-warning' : 'bg-muted text-muted-foreground'}`}>
          {items.length}
        </span>
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No timesheets.</p>
      ) : (
        <div className="space-y-2">
          {items.map(t => (
            <div key={t.id} className={`rounded-xl border bg-card p-4 ${highlight && t.status === 'pending' ? 'border-warning/40' : ''}`}>
              <button
                className="w-full flex flex-wrap items-center gap-x-6 gap-y-1 text-left"
                onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
              >
                <div>
                  <p className="font-medium">{t.employee_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Pay period {t.pay_period_start} → {t.pay_period_end} · Supervisor: {t.supervisor_name || t.supervisor_email}
                  </p>
                </div>
                <p className="text-sm">Total paid: <span className="font-bold">{t.total_paid_hours || 0} hrs</span></p>
                <p className="text-xs text-muted-foreground">Submitted {t.submitted_date}</p>
                <div className="ml-auto flex items-center gap-2">
                  <TimesheetStatusBadge status={t.status} />
                  {expandedId === t.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
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
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary" /> Timesheets
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Timesheets submitted by staff. New submissions land in Pending Approval until the employee's supervisor approves them, then move to the Approved list.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading timesheets…</p>
      ) : (
        <>
          <Section title="Pending Approval" items={pending} highlight />
          <Section title="Approved" items={approved} />
          {rejected.length > 0 && <Section title="Rejected" items={rejected} />}
        </>
      )}
    </div>
  );
}