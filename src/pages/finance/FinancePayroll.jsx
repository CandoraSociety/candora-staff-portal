import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CalendarOff, HeartPulse, HeartHandshake, Users } from 'lucide-react';
import StaffListingTab from '@/components/finance/StaffListingTab';

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