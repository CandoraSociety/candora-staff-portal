import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ThermometerSun, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import SickDayForm from '@/components/timeoff/SickDayForm';
import MyTimeOffList from '@/components/timeoff/MyTimeOffList';
import TestEmployeeBanner from '@/components/shared/TestEmployeeBanner';
import { useCurrentUser } from '@/lib/useAuth';
import { useSupervisorAccess } from '@/lib/useSupervisorAccess';
import { useExecutiveDirector, TEST_EMPLOYEE } from '@/lib/testEmployee';

export default function SickTimePersonalDay() {
  const { user } = useCurrentUser();
  const { isSupervisor, isAdmin } = useSupervisorAccess();
  const { isExecutiveDirector } = useExecutiveDirector();
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ['timeoff'] });

  const myTab = (
    <>
      <SickDayForm user={user} onSubmitted={refresh} />
      <div>
        <h2 className="font-semibold mb-2">My Records</h2>
        {user && <MyTimeOffList user={user} kinds={['sick', 'personal']} />}
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ThermometerSun className="h-6 w-6 text-primary" /> Sick Time / Personal Day
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Log sick time and personal days for HR records. Recorded days automatically fill into the Paid Leave column of your timesheet for that pay period.
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
            <TabsTrigger value="mine">My Records</TabsTrigger>
            <TabsTrigger value="test">Test — Test Employee</TabsTrigger>
          </TabsList>
          <TabsContent value="mine" className="mt-4 space-y-6">{myTab}</TabsContent>
          <TabsContent value="test" className="mt-4 space-y-6">
            <TestEmployeeBanner />
            <SickDayForm user={TEST_EMPLOYEE} onSubmitted={refresh} />
            <div>
              <h2 className="font-semibold mb-2">Test Employee's Records</h2>
              <MyTimeOffList user={TEST_EMPLOYEE} kinds={['sick', 'personal']} />
            </div>
          </TabsContent>
        </Tabs>
      ) : myTab}
    </div>
  );
}