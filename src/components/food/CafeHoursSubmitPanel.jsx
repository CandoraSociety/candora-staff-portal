import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, CheckCircle2, Loader2 } from 'lucide-react';
import { getPayPeriod, ymd } from '@/lib/payPeriods';
import { abToday } from '@/lib/abTime';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Turn every unsubmitted hours row in these shifts into one timesheet per
// person per pay period, ready for the employee's supervisor in Finance.
function buildTimesheets(shifts, employees, supervisor) {
  const rows = [];
  shifts.forEach((shift) => {
    (shift.staff_hours || []).forEach((h) => {
      if (h.submitted || !Number(h.hours)) return;
      const emp = employees.find((e) => e.id === h.employee_id);
      rows.push({ ...h, shift_id: shift.id, employee_email: emp?.email || '' });
    });
  });

  const byEmployee = rows.reduce((acc, row) => {
    (acc[row.employee_id] = acc[row.employee_id] || []).push(row);
    return acc;
  }, {});

  const sheets = [];
  Object.values(byEmployee).forEach((entries) => {
    const byPeriod = entries.reduce((acc, entry) => {
      const period = getPayPeriod(entry.date);
      const key = String(period.start);
      acc[key] = acc[key] || { period, entries: [] };
      acc[key].entries.push(entry);
      return acc;
    }, {});

    Object.values(byPeriod).forEach(({ period, entries: periodEntries }) => {
      // One row per day; a second shift on the same day adds to that day
      const byDate = {};
      periodEntries.forEach((entry) => {
        const hours = Number(entry.hours) || 0;
        const current = byDate[entry.date];
        if (!current) {
          byDate[entry.date] = {
            date: entry.date,
            start_time: entry.start_time,
            end_time: entry.end_time,
            break_hours: Number(entry.break_hours) || 0,
            total_hours: hours,
          };
        } else {
          current.total_hours += hours;
          if (entry.start_time < current.start_time) current.start_time = entry.start_time;
          if (entry.end_time > current.end_time) current.end_time = entry.end_time;
        }
      });

      const regular_entries = Object.values(byDate)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((day) => ({
          day: DAY_NAMES[new Date(`${day.date}T00:00:00`).getDay()],
          date: day.date,
          start_time: day.start_time,
          end_time: day.end_time,
          break_hours: day.break_hours,
          total_hours: Math.round(day.total_hours * 100) / 100,
        }));

      const total = Math.round(regular_entries.reduce((sum, e) => sum + e.total_hours, 0) * 100) / 100;

      sheets.push({
        employee_name: periodEntries[0].employee_name,
        employee_email: periodEntries[0].employee_email,
        supervisor_name: supervisor?.full_name || '',
        supervisor_email: supervisor?.email || '',
        pay_period_start: ymd(period.start),
        pay_period_end: ymd(period.end),
        regular_entries,
        total_regular_hours: total,
        total_paid_hours: total,
        status: 'pending',
        submitted_date: abToday(),
        employee_notes: 'Cafe Candeur shift hours — submitted from the Food Services scheduler',
        entries: periodEntries.map((e) => ({ shift_id: e.shift_id, employee_id: e.employee_id, date: e.date })),
      });
    });
  });

  return sheets;
}

export default function CafeHoursSubmitPanel({ shifts, employees, user }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');

  const perStaff = {};
  shifts.forEach((shift) => (shift.staff_hours || []).forEach((h) => {
    if (!Number(h.hours)) return;
    const row = perStaff[h.employee_id] = perStaff[h.employee_id] || {
      name: h.employee_name, pending: 0, sent: 0, days: 0,
    };
    if (h.submitted) { row.sent += Number(h.hours); row.days += 1; }
    else row.pending += Number(h.hours);
  }));

  const staffRows = Object.values(perStaff).sort((a, b) => a.name.localeCompare(b.name));
  const pendingTotal = staffRows.reduce((sum, r) => sum + r.pending, 0);

  const submit = async () => {
    const sheets = buildTimesheets(shifts, employees, user);
    if (!sheets.length) return;
    setBusy(true);
    setResult('');
    for (const sheet of sheets) {
      const { entries, ...payload } = sheet;
      const created = await base44.entities.Timesheet.create(payload);

      const byShift = entries.reduce((acc, e) => {
        (acc[e.shift_id] = acc[e.shift_id] || []).push(e);
        return acc;
      }, {});

      for (const [shiftId, shiftEntries] of Object.entries(byShift)) {
        const shift = shifts.find((s) => s.id === shiftId);
        if (!shift) continue;
        const staff_hours = (shift.staff_hours || []).map((h) => (
          shiftEntries.some((e) => e.employee_id === h.employee_id && e.date === h.date)
            ? { ...h, submitted: true, timesheet_id: created.id }
            : h
        ));
        await base44.entities.FoodServiceSchedule.update(shiftId, { staff_hours });
      }
    }
    await qc.invalidateQueries({ queryKey: ['food-schedules'] });
    await qc.invalidateQueries({ queryKey: ['timesheets'] });
    setBusy(false);
    setResult(`${sheets.length} timesheet${sheets.length === 1 ? '' : 's'} sent to Finance for approval.`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">Cafe staff hours — this week</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Hours logged on each shift become a timesheet in Finance, one per person per pay period.
          </p>
        </div>
        <Button onClick={submit} disabled={busy || pendingTotal === 0} className="gap-2 flex-shrink-0">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Submit to Finance
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {staffRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hours logged yet this week. Add staff to a shift to log their hours.</p>
        ) : (
          <div className="divide-y">
            {staffRows.map((row) => (
              <div key={row.name} className="flex items-center justify-between py-2 text-sm">
                <div className="font-medium">{row.name}</div>
                <div className="flex items-center gap-2">
                  {row.sent > 0 && (
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {Math.round(row.sent * 100) / 100}h sent
                    </Badge>
                  )}
                  {row.pending > 0 ? (
                    <span className="text-xs font-semibold text-foreground">{Math.round(row.pending * 100) / 100}h to submit</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">all submitted</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {pendingTotal > 0 && (
          <p className="text-xs text-muted-foreground">
            {Math.round(pendingTotal * 100) / 100} hours ready to send this week.
          </p>
        )}
        {result && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-2 text-xs text-green-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> {result}
          </div>
        )}
      </CardContent>
    </Card>
  );
}