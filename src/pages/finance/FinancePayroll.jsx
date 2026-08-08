import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CalendarOff, HeartPulse, HeartHandshake, Users, Pencil } from 'lucide-react';
import WageAdjustmentDialog from '@/components/finance/WageAdjustmentDialog';

const STAFF_TABS = [
  { value: 'timesheets',  label: 'Timesheet Submissions', icon: Clock },
  { value: 'vacation',    label: 'Vacation Requests',     icon: CalendarOff },
  { value: 'sick',        label: 'Sick Time',             icon: HeartPulse },
  { value: 'benefits',    label: 'Benefits',             icon: HeartHandshake },
  { value: 'staff',       label: 'Staff Listing',        icon: Users },
];

function Placeholder({ icon: Icon, title, desc }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Icon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{desc}</p>
      </CardContent>
    </Card>
  );
}

function StaffListingTab() {
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees-finance'],
    queryFn: () => base44.entities.Employee.filter({ status: 'active' }),
  });
  const [editing, setEditing] = useState(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Staff Listing &amp; Wage Adjustments</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading staff...</div>
        ) : employees.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">No active staff found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Name</th>
                  <th className="text-left px-3 py-2 font-semibold">Position</th>
                  <th className="text-left px-3 py-2 font-semibold">Status</th>
                  <th className="text-right px-3 py-2 font-semibold">Salary</th>
                  <th className="text-left px-3 py-2 font-semibold">Pay Grade</th>
                  <th className="text-center px-3 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {employees.map(e => (
                  <tr key={e.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2 font-medium">{e.first_name} {e.last_name}</td>
                    <td className="px-3 py-2">{e.position || '—'}</td>
                    <td className="px-3 py-2"><Badge variant="outline">{e.status}</Badge></td>
                    <td className="px-3 py-2 text-right">{e.salary ? `$${Number(e.salary).toFixed(2)}` : '—'}</td>
                    <td className="px-3 py-2">{e.pay_grade || '—'}</td>
                    <td className="px-3 py-2 text-center">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(e)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

export default function FinancePayroll() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Clock className="h-6 w-6 text-primary" /> Payroll</h1>
        <p className="text-sm text-muted-foreground mt-1">Timesheets, time-off, benefits, and staff wage adjustments (Executive Director sign-off required).</p>
      </div>

      <Tabs defaultValue="timesheets" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          {STAFF_TABS.map(t => <TabsTrigger key={t.value} value={t.value} className="text-xs">{t.label}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="timesheets" className="mt-4">
          <Placeholder icon={Clock} title="Timesheet Submissions"
            desc="Staff timesheet submissions will be collected here and routed to payroll. Integration with the HR Management portal is planned." />
        </TabsContent>
        <TabsContent value="vacation" className="mt-4">
          <Placeholder icon={CalendarOff} title="Vacation Requests"
            desc="Vacation requests and accrual balances will be tracked here, synced with the HR Management portal." />
        </TabsContent>
        <TabsContent value="sick" className="mt-4">
          <Placeholder icon={HeartPulse} title="Sick Time"
            desc="Sick-time entries and balances will be recorded here for payroll processing." />
        </TabsContent>
        <TabsContent value="benefits" className="mt-4">
          <Placeholder icon={HeartHandshake} title="Benefits"
            desc="Benefits status and tier management will be configured here per staff member." />
        </TabsContent>
        <TabsContent value="staff" className="mt-4">
          <StaffListingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}