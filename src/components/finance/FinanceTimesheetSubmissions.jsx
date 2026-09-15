import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Hourglass, CheckCircle2, XCircle } from 'lucide-react';
import TimesheetDetail from '@/components/timesheets/TimesheetDetail';

const fmtDate = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

function TimesheetTable({ rows, emptyText, renderActions }) {
  const [expandedId, setExpandedId] = useState(null);
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-3">{emptyText}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/30">
          <tr>
            <th className="text-left px-3 py-2 font-semibold">Employee</th>
            <th className="text-left px-3 py-2 font-semibold">Pay Period</th>
            <th className="text-left px-3 py-2 font-semibold">Submitted</th>
            <th className="text-left px-3 py-2 font-semibold">Supervisor</th>
            <th className="text-right px-3 py-2 font-semibold">Paid Hours</th>
            <th className="text-center px-3 py-2 font-semibold">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map(t => {
            const expanded = expandedId === t.id;
            return (
              <React.Fragment key={t.id}>
                <tr className="hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <div className="font-medium">{t.employee_name || '—'}</div>
                    <div className="text-xs text-muted-foreground">{t.employee_email || ''}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{t.pay_period_start} → {t.pay_period_end}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{fmtDate(t.submitted_date)}</td>
                  <td className="px-3 py-2">
                    {t.approved_by_name || t.supervisor_name || '—'}
                    {t.approved_date && <div className="text-xs text-muted-foreground">approved {fmtDate(t.approved_date)}</div>}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">{t.total_paid_hours || 0}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      onClick={() => setExpandedId(expanded ? null : t.id)}
                    >
                      {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {expanded ? 'Hide' : 'View'}
                    </button>
                  </td>
                </tr>
                {expanded && (
                  <tr className="bg-muted/20">
                    <td colSpan={6} className="px-3 py-2">
                      <TimesheetDetail timesheet={t} />
                      {renderActions && renderActions(t)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Finance portal — Timesheet Submissions tab.
// Timesheets route to the employee's direct supervisor first; they sit in
// "Pending Supervisor Approval" here until the supervisor approves them,
// then move to the approved (payroll-ready) section.
export default function FinanceTimesheetSubmissions() {
  const { data: timesheets = [], isLoading } = useQuery({
    queryKey: ['timesheets', 'finance-all'],
    queryFn: () => base44.entities.Timesheet.list('-submitted_date', 300),
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-6">Loading…</div>;
  }

  const pendingSupervisor = timesheets.filter(t => t.status === 'pending');
  const approved = timesheets.filter(t => t.status === 'approved');
  const rejected = timesheets.filter(t => t.status === 'rejected');

  return (
    <div className="space-y-4">
      <Card className="p-0 border-amber-300 bg-amber-50/30">
        <div className="px-4 py-3 border-b border-amber-200 bg-amber-100/50 flex flex-wrap items-center gap-2">
          <Hourglass className="h-4 w-4 text-amber-700" />
          <h3 className="font-semibold text-amber-800 text-sm">Pending Supervisor Approval ({pendingSupervisor.length})</h3>
          <p className="text-xs text-amber-700/80">Timesheets awaiting the employee's direct supervisor — not ready for payroll.</p>
        </div>
        <TimesheetTable rows={pendingSupervisor} emptyText="No timesheets are awaiting supervisor approval right now." />
      </Card>

      <Card className="p-0">
        <div className="px-4 py-3 border-b bg-muted/30 flex flex-wrap items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-700" />
          <h3 className="font-semibold text-sm">Approved by Supervisor — Ready for Payroll ({approved.length})</h3>
        </div>
        <TimesheetTable rows={approved} emptyText="No supervisor-approved timesheets yet." />
      </Card>

      {rejected.length > 0 && (
        <Card className="p-0">
          <div className="px-4 py-3 border-b bg-muted/30 flex flex-wrap items-center gap-2">
            <XCircle className="h-4 w-4 text-red-700" />
            <h3 className="font-semibold text-sm">Rejected by Supervisor ({rejected.length})</h3>
          </div>
          <TimesheetTable rows={rejected} emptyText="" />
        </Card>
      )}
    </div>
  );
}