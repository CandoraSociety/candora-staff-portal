import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function GrantsOrgInfo() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-display font-bold text-foreground">Organization Info</h1>
      <Card><CardContent className="flex items-center gap-3 py-8 text-muted-foreground"><Settings className="h-5 w-5" /><span>Organization profile coming soon.</span></CardContent></Card>
    </div>
  );
}