import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Library } from 'lucide-react';

export default function GrantsFundingDB() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-display font-bold text-foreground">Funding Database</h1>
      <Card><CardContent className="flex items-center gap-3 py-8 text-muted-foreground"><Library className="h-5 w-5" /><span>Funding database coming soon.</span></CardContent></Card>
    </div>
  );
}