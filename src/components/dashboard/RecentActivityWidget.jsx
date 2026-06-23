import React from 'react';
import { Clock } from 'lucide-react';

export default function RecentActivityWidget() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <Clock className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">Activity tracking coming soon</p>
      <p className="text-xs text-muted-foreground/60 mt-1">Module integrations will appear here</p>
    </div>
  );
}