import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Section D: one gift across all three causes. Deliberately quiet — a secondary
// option beneath the three primary opportunities, not a fourth pillar.
export default function ChristmasCombinedGiving({ onGiveAll }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-muted/40 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="space-y-1">
        <h2 className="font-display text-lg font-extrabold">Support all three.</h2>
        <p className="text-sm text-muted-foreground">
          Prefer to help wherever it is needed most? One gift can support Joy, Hope and Belonging
          together.
        </p>
      </div>
      <Button variant="outline" className="bg-card sm:shrink-0" onClick={onGiveAll}>
        <Heart className="h-4 w-4" />
        Give to all three
      </Button>
    </section>
  );
}