import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ThermometerSun } from 'lucide-react';
import SickDayForm from '@/components/timeoff/SickDayForm';
import MyTimeOffList from '@/components/timeoff/MyTimeOffList';
import { useCurrentUser } from '@/lib/useAuth';

export default function SickTimePersonalDay() {
  const { user } = useCurrentUser();
  const qc = useQueryClient();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ThermometerSun className="h-6 w-6 text-primary" /> Sick Time / Personal Day
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Log sick time and personal days for HR records. Recorded days automatically fill into the Paid Leave column of your timesheet for that pay period.
        </p>
      </div>

      <SickDayForm user={user} onSubmitted={() => qc.invalidateQueries({ queryKey: ['timeoff'] })} />

      <div>
        <h2 className="font-semibold mb-2">My Records</h2>
        {user && <MyTimeOffList user={user} kinds={['sick', 'personal']} />}
      </div>
    </div>
  );
}