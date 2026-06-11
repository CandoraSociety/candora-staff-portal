import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BookMarked } from 'lucide-react';

export default function GrantsTemplates() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-display font-bold text-foreground">Templates</h1>
      <Card><CardContent className="flex items-center gap-3 py-8 text-muted-foreground"><BookMarked className="h-5 w-5" /><span>Proposal templates coming soon.</span></CardContent></Card>
    </div>
  );
}