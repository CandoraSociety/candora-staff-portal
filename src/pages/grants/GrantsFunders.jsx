import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function GrantsFunders() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-display font-bold text-foreground">Funders</h1>
      <Card><CardContent className="flex items-center gap-3 py-8 text-muted-foreground"><Users className="h-5 w-5" /><span>Funder directory coming soon.</span></CardContent></Card>
    </div>
  );
}