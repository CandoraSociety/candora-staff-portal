import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PlaneTakeoff } from 'lucide-react';
import VacationRequestForm from '@/components/timeoff/VacationRequestForm';
import MyTimeOffList from '@/components/timeoff/MyTimeOffList';
import { useCurrentUser } from '@/lib/useAuth';

export default function VacationTimeOffRequest() {
  const { user } = useCurrentUser();
  const qc = useQueryClient();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <PlaneTakeoff className="h-6 w-6 text-primary" /> Vacation / Time-off Request
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Submit vacation requests for supervisor approval. Approved vacation days automatically fill into the Paid Leave column of your timesheet for that pay period.
        </p>
      </div>

      <VacationRequestForm user={user} onSubmitted={() => qc.invalidateQueries({ queryKey: ['timeoff'] })} />

      <div>
        <h2 className="font-semibold mb-2">My Requests</h2>
        {user && <MyTimeOffList user={user} kinds={['vacation']} />}
      </div>
    </div>
  );
}