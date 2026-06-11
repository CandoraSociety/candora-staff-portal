import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function GrantsProposals() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-display font-bold text-foreground">Proposals</h1>
      <Card><CardContent className="flex items-center gap-3 py-8 text-muted-foreground"><FileText className="h-5 w-5" /><span>Proposal builder coming soon.</span></CardContent></Card>
    </div>
  );
}