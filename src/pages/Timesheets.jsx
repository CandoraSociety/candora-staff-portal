import React from 'react';
import { ClipboardList, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import TimesheetForm from '@/components/timesheets/TimesheetForm';
import TimesheetSubmissionsList from '@/components/timesheets/TimesheetSubmissionsList';
import TestEmployeeBanner from '@/components/shared/TestEmployeeBanner';
import { useCurrentUser } from '@/lib/useAuth';
import { useSupervisorAccess } from '@/lib/useSupervisorAccess';
import { useExecutiveDirector, TEST_EMPLOYEE } from '@/lib/testEmployee';
import { getPayPeriod, periodLabel } from '@/lib/payPeriods';

export default function Timesheets() {
  const { user, loading } = useCurrentUser();
  const { isSupervisor, isAdmin } = useSupervisorAccess();
  const { isExecutiveDirector, supervisor } = useExecutiveDirector();
  const qc = useQueryClient();
  const period = getPayPeriod(new Date());
  const refresh = () => qc.invalidateQueries({ queryKey: ['timesheets'] });

  const myTab = (
    <>
      {!loading && user && <TimesheetForm user={user} onSubmitted={refresh} />}
      <div>
        <h2 className="font-semibold mb-2">My Submissions</h2>
        <TimesheetSubmissionsList email={user?.email} emptyText="You haven't submitted any timesheets yet." />
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" /> Timesheets
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Submit your hours for the current pay period ({periodLabel(period)}). Your direct supervisor reviews and approves each timesheet before it goes to Payroll.
          </p>
        </div>
        {(isSupervisor || isAdmin) && (
          <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 flex-shrink-0">
            <Link to="/time-off/team"><Users className="w-4 h-4" /> Team Schedule</Link>
          </Button>
        )}
      </div>

      {isExecutiveDirector ? (
        <Tabs defaultValue="mine">
          <TabsList>
            <TabsTrigger value="mine">My Timesheets</TabsTrigger>
            <TabsTrigger value="test">Test — Test Employee</TabsTrigger>
          </TabsList>
          <TabsContent value="mine" className="mt-4 space-y-6">{myTab}</TabsContent>
          <TabsContent value="test" className="mt-4 space-y-6">
            <TestEmployeeBanner supervisor={supervisor} />
            <TimesheetForm user={TEST_EMPLOYEE} fixedSupervisor={supervisor} onSubmitted={refresh} />
            <div>
              <h2 className="font-semibold mb-2">Test Employee's Submissions</h2>
              <TimesheetSubmissionsList email={TEST_EMPLOYEE.email} emptyText="No test timesheets yet." />
            </div>
          </TabsContent>
        </Tabs>
      ) : myTab}
    </div>
  );
}