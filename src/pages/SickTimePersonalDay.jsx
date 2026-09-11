import React from 'react';
import { ThermometerSun } from 'lucide-react';

export default function SickTimePersonalDay() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ThermometerSun className="h-6 w-6 text-primary" /> Sick Time / Personal Day
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Log sick time and personal days for HR records.
        </p>
      </div>
    </div>
  );
}