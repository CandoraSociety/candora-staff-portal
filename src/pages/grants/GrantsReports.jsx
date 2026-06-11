import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function GrantsReports() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-display font-bold text-foreground">Reports</h1>
      <Card><CardContent className="flex items-center gap-3 py-8 text-muted-foreground"><BarChart3 className="h-5 w-5" /><span>Reporting module coming soon.</span></CardContent></Card>
    </div>
  );
}