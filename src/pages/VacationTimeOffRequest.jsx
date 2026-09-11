import React from 'react';
import { PlaneTakeoff } from 'lucide-react';

export default function VacationTimeOffRequest() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <PlaneTakeoff className="h-6 w-6 text-primary" /> Vacation / Time-off Request
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Submit vacation and time-off requests for approval by your supervisor.
        </p>
      </div>
    </div>
  );
}