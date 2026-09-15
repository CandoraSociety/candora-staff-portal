import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PlaneTakeoff, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import VacationRequestForm from '@/components/timeoff/VacationRequestForm';
import MyTimeOffList from '@/components/timeoff/MyTimeOffList';
import TestEmployeeBanner from '@/components/shared/TestEmployeeBanner';
import { useCurrentUser } from '@/lib/useAuth';
import { useSupervisorAccess } from '@/lib/useSupervisorAccess';
import { useExecutiveDirector, TEST_EMPLOYEE } from '@/lib/testEmployee';

export default function VacationTimeOffRequest() {
  const { user } = useCurrentUser();
  const { isSupervisor, isAdmin } = useSupervisorAccess();
  const { isExecutiveDirector, supervisor } = useExecutiveDirector();
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ['timeoff'] });

  const myTab = (
    <>
      <VacationRequestForm user={user} onSubmitted={refresh} />
      <div>
        <h2 className="font-semibold mb-2">My Requests</h2>
        {user && <MyTimeOffList user={user} kinds={['vacation']} manageable />}
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <PlaneTakeoff className="h-6 w-6 text-primary" /> Vacation / Time-off Request
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Submit vacation requests for supervisor approval. Approved vacation days automatically fill into the Paid Leave column of your timesheet for that pay period.
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
            <TabsTrigger value="mine">My Requests</TabsTrigger>
            <TabsTrigger value="test">Test — Test Employee</TabsTrigger>
          </TabsList>
          <TabsContent value="mine" className="mt-4 space-y-6">{myTab}</TabsContent>
          <TabsContent value="test" className="mt-4 space-y-6">
            <TestEmployeeBanner supervisor={supervisor} />
            <VacationRequestForm user={TEST_EMPLOYEE} fixedSupervisor={supervisor} onSubmitted={refresh} />
            <div>
              <h2 className="font-semibold mb-2">Test Employee's Requests</h2>
              <MyTimeOffList user={TEST_EMPLOYEE} kinds={['vacation']} manageable />
            </div>
          </TabsContent>
        </Tabs>
      ) : myTab}
    </div>
  );
}