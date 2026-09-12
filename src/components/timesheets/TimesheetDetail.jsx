import React from 'react';

// Read-only rendering of a submitted timesheet — used in the HR portal list
// and the supervisor approval notification.
export default function TimesheetDetail({ timesheet }) {
  const t = timesheet;
  const regular = (t.regular_entries || []).filter(r =>
    r.total_hours || r.vacation_hours || r.sick_hours || r.personal_hours || r.paid_leave_hours || r.banked_hours || r.start_time || r.end_time);
  // New timesheets split paid leave into Vacation / Sick / Personal columns;
  // older ones only have the combined paid_leave_hours field.
  const splitLeave = regular.some(r => r.vacation_hours != null || r.sick_hours != null || r.personal_hours != null);
  const additional = (t.additional_entries || []).filter(r =>
    r.paid_hours || r.start_time || r.end_time || r.date);

  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div><span className="text-muted-foreground">Employee: </span><span className="font-medium">{t.employee_name}</span></div>
        <div><span className="text-muted-foreground">Supervisor: </span><span className="font-medium">{t.supervisor_name || t.supervisor_email}</span></div>
        <div><span className="text-muted-foreground">Pay period: </span><span className="font-medium">{t.pay_period_start} → {t.pay_period_end}</span></div>
        <div><span className="text-muted-foreground">Submitted: </span><span className="font-medium">{t.submitted_date}</span></div>
      </div>

      {regular.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-2 py-1.5 font-medium">Day</th>
                <th className="px-2 py-1.5 font-medium">Date</th>
                <th className="px-2 py-1.5 font-medium">Start</th>
                <th className="px-2 py-1.5 font-medium">Break (hrs)</th>
                <th className="px-2 py-1.5 font-medium">End</th>
                <th className="px-2 py-1.5 font-medium">Total Paid Hrs</th>
                {splitLeave ? (<>
                  <th className="px-2 py-1.5 font-medium">Vacation</th>
                  <th className="px-2 py-1.5 font-medium">Sick</th>
                  <th className="px-2 py-1.5 font-medium">Personal</th>
                </>) : (
                  <th className="px-2 py-1.5 font-medium">Paid Leave</th>
                )}
                <th className="px-2 py-1.5 font-medium">Banked</th>
              </tr>
            </thead>
            <tbody>
              {regular.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="px-2 py-1.5 font-medium">{r.day}</td>
                  <td className="px-2 py-1.5">{r.date}</td>
                  <td className="px-2 py-1.5">{r.start_time || '—'}</td>
                  <td className="px-2 py-1.5">{r.break_hours || '—'}</td>
                  <td className="px-2 py-1.5">{r.end_time || '—'}</td>
                  <td className="px-2 py-1.5 font-medium">{r.total_hours || 0}</td>
                  {splitLeave ? (<>
                    <td className="px-2 py-1.5">{r.vacation_hours || '—'}</td>
                    <td className="px-2 py-1.5">{r.sick_hours || '—'}</td>
                    <td className="px-2 py-1.5">{r.personal_hours || '—'}</td>
                  </>) : (
                    <td className="px-2 py-1.5">{r.paid_leave_hours || '—'}</td>
                  )}
                  <td className="px-2 py-1.5">{r.banked_hours || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {additional.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Additional Hours</p>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-2 py-1.5 font-medium">Date</th>
                  <th className="px-2 py-1.5 font-medium">Start</th>
                  <th className="px-2 py-1.5 font-medium">Break (hrs)</th>
                  <th className="px-2 py-1.5 font-medium">End</th>
                  <th className="px-2 py-1.5 font-medium">Paid (hrs)</th>
                </tr>
              </thead>
              <tbody>
                {additional.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1.5">{r.date || '—'}</td>
                    <td className="px-2 py-1.5">{r.start_time || '—'}</td>
                    <td className="px-2 py-1.5">{r.break_hours || '—'}</td>
                    <td className="px-2 py-1.5">{r.end_time || '—'}</td>
                    <td className="px-2 py-1.5 font-medium">{r.paid_hours || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs bg-muted/40 rounded-lg p-3">
        <span>Regular: <span className="font-bold">{t.total_regular_hours || 0}</span></span>
        {t.total_vacation_hours != null || t.total_sick_hours != null || t.total_personal_hours != null ? (<>
          <span>Vacation: <span className="font-bold">{t.total_vacation_hours || 0}</span></span>
          <span>Sick: <span className="font-bold">{t.total_sick_hours || 0}</span></span>
          <span>Personal: <span className="font-bold">{t.total_personal_hours || 0}</span></span>
        </>) : (
          <span>Paid Leave: <span className="font-bold">{t.total_paid_leave_hours || 0}</span></span>
        )}
        <span>Banked: <span className="font-bold">{t.total_banked_hours || 0}</span></span>
        <span>Additional: <span className="font-bold">{t.total_additional_hours || 0}</span></span>
        <span className="text-sm">TOTAL HOURS PAID: <span className="font-bold">{t.total_paid_hours || 0}</span></span>
      </div>

      {t.employee_notes && (
        <p className="text-xs"><span className="text-muted-foreground">Employee notes: </span>{t.employee_notes}</p>
      )}
      {t.status !== 'pending' && (
        <p className="text-xs text-muted-foreground">
          {t.status === 'approved'
            ? `Approved by ${t.approved_by_name} on ${t.approved_date}`
            : `Rejected by ${t.approved_by_name} on ${t.approved_date}${t.rejection_reason ? ` — ${t.rejection_reason}` : ''}`}
        </p>
      )}
    </div>
  );
}