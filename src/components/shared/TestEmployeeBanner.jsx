import React from 'react';
import { FlaskConical } from 'lucide-react';

// Shown at the top of the Executive Director's test-employee tabs.
export default function TestEmployeeBanner({ supervisor }) {
  return (
    <div className="rounded-xl border border-dashed border-warning/60 bg-warning/5 px-4 py-3">
      <p className="text-sm font-semibold text-warning flex items-center gap-1.5">
        <FlaskConical className="w-4 h-4" />Test mode — submitting as “Test Employee”
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Everything created here is filed under the Test Employee. Submissions that need approval are
        routed to you{supervisor ? ` (${supervisor.name})` : ''} as the supervisor, so you can test the
        full approval flow — approve them from the supervisor alerts on your Dashboard.
      </p>
    </div>
  );
}