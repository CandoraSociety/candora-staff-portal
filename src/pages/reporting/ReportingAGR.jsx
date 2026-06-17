import React from 'react';
import { BookOpen } from 'lucide-react';

export default function ReportingAGR() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight text-accent">Annual General Report</h1>
        <p className="text-muted-foreground text-sm mt-1">The report provided in connection with the Annual General Meeting</p>
      </div>

      <div className="text-center py-20 text-slate-400">
        <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <p className="text-lg font-medium text-slate-500">Coming soon</p>
        <p className="text-sm mt-1 max-w-md mx-auto">
          This section will be built with specific instructions for the Annual General Report.
        </p>
      </div>
    </div>
  );
}