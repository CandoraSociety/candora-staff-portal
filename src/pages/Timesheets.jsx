import React from 'react';
import { ClipboardList } from 'lucide-react';

export default function Timesheets() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary" /> Timesheets
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Record and review your worked hours.
        </p>
      </div>
    </div>
  );
}