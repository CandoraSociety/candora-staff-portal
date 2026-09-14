import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PlaneTakeoff, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VacationRequestForm from '@/components/timeoff/VacationRequestForm';
import MyTimeOffList from '@/components/timeoff/MyTimeOffList';
import { useCurrentUser } from '@/lib/useAuth';
import { useSupervisorAccess } from '@/lib/useSupervisorAccess';

export default function VacationTimeOffRequest() {
  const { user } = useCurrentUser();
  const { isSupervisor, isAdmin } = useSupervisorAccess();
  const qc = useQueryClient();

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

      <VacationRequestForm user={user} onSubmitted={() => qc.invalidateQueries({ queryKey: ['timeoff'] })} />

      <div>
        <h2 className="font-semibold mb-2">My Requests</h2>
        {user && <MyTimeOffList user={user} kinds={['vacation']} manageable />}
      </div>
    </div>
  );
}