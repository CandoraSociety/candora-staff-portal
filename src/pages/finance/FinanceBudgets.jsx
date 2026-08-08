import React from 'react';
import { PiggyBank } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function FinanceBudgets() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <PiggyBank className="h-6 w-6 text-primary" /> Budgets
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Organizational budget tracking &amp; planning.
        </p>
      </div>

      <Card>
        <CardContent className="p-10 text-center">
          <PiggyBank className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground">Coming soon</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Budget management for the Finance Portal is being planned. Check back here for
            department and program budget tracking.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}