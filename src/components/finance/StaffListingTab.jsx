import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Users, Pencil } from 'lucide-react';
import WageAdjustmentDialog from '@/components/finance/WageAdjustmentDialog';
import { computeTimeOffBalances } from '@/lib/timeOffBalances';

const money = v => `$${Number(v).toFixed(2)}`;

export default function StaffListingTab() {
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees-finance'],
    queryFn: () => base44.entities.Employee.filter({ status: 'active' }),
  });
  const { data: approvedTimesheets = [] } = useQuery({
    queryKey: ['timesheets', 'all-approved'],
    queryFn: () => base44.entities.Timesheet.filter({ status: 'approved' }, '-submitted_date', 500),
  });

  const [editing, setEditing] = useState(null);
  const [showWages, setShowWages] = useState(false);

  const timesheetsByEmail = {};
  for (const t of approvedTimesheets) {
    const key = (t.employee_email || '').toLowerCase();
    (timesheetsByEmail[key] ||= []).push(t);
  }
  // Available vacation / sick / personal — starting balance from the employee
  // file, plus vacation accrued from approved timesheet hours, minus time taken.
  const balancesOf = (employee) =>
    computeTimeOffBalances(employee, timesheetsByEmail[(employee.email || '').toLowerCase()] || []);

  const sorted = [...employees].sort((a, b) =>
    `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
  );
  const hourly = sorted.filter(e => e.employment_type === 'hourly');
  const salaried = sorted.filter(e => e.employment_type === 'salary');
  const unclassified = sorted.filter(e => !e.employment_type);

  const renderRow = (e, kind) => {
    const isHourly = kind === 'hourly';
    const b = balancesOf(e);
    return (
      <tr key={e.id} className="hover:bg-muted/30">
        <td className="px-3 py-2 font-medium">{e.first_name} {e.last_name}</td>
        <td className="px-3 py-2">{e.position || '—'}</td>
        <td className="px-3 py-2"><Badge variant="outline">{e.status}</Badge></td>
        {showWages && (isHourly
          ? <td className="px-3 py-2 text-right">{e.hourly_wage ? money(e.hourly_wage) : '—'}</td>
          : <React.Fragment>
              <td className="px-3 py-2 text-right">{e.salary ? money(e.salary / 26) : '—'}</td>
              <td className="px-3 py-2 text-right">{e.salary ? money(e.salary) : '—'}</td>
            </React.Fragment>
        )}
        <td className="px-3 py-2 text-right">{e.vacation_percentage != null ? `${e.vacation_percentage}%` : '—'}</td>
        <td className="px-3 py-2 text-right font-medium">{b.vacation} hrs</td>
        <td className="px-3 py-2 text-right font-medium">{b.sick} hrs</td>
        <td className="px-3 py-2 text-right font-medium">{b.personal} hrs</td>
        <td className="px-3 py-2">{e.pay_grade || '—'}</td>
        <td className="px-3 py-2 text-center">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(e)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        </td>
      </tr>
    );
  };

  const renderTable = (title, list, kind) => {
    if (list.length === 0) return null;
    const isHourly = kind === 'hourly';
    return (
      <div className="rounded-lg border">
        <div className="px-4 py-2.5 border-b bg-muted/50 flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">{title}</h3>
          <Badge variant="secondary">{list.length}</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Name</th>
                <th className="text-left px-3 py-2 font-semibold">Position</th>
                <th className="text-left px-3 py-2 font-semibold">Status</th>
                {showWages && (isHourly
                  ? <th className="text-right px-3 py-2 font-semibold">Hourly Wage</th>
                  : <React.Fragment>
                      <th className="text-right px-3 py-2 font-semibold">Bi-weekly Salary</th>
                      <th className="text-right px-3 py-2 font-semibold">Annual Salary</th>
                    </React.Fragment>
                )}
                <th className="text-right px-3 py-2 font-semibold">Vacation %</th>
                <th className="text-right px-3 py-2 font-semibold">Vacation Avail.</th>
                <th className="text-right px-3 py-2 font-semibold">Sick Avail.</th>
                <th className="text-right px-3 py-2 font-semibold">Personal Avail.</th>
                <th className="text-left px-3 py-2 font-semibold">Pay Grade</th>
                <th className="text-center px-3 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">{list.map(e => renderRow(e, kind))}</tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Staff Listing &amp; Wage Adjustments</CardTitle>
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <Switch checked={showWages} onCheckedChange={setShowWages} />
          Show salary / wage columns
        </label>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading staff...</div>
        ) : employees.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">No active staff found.</div>
        ) : (
          <>
            {renderTable('Hourly Employees', hourly, 'hourly')}
            {renderTable('Salaried Employees', salaried, 'salary')}
            {renderTable('Employment Type Not Set', unclassified, 'salary')}
          </>
        )}
        {editing && (
          <WageAdjustmentDialog
            employee={editing}
            onDone={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        )}
      </CardContent>
    </Card>
  );
}