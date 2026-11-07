import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

// Covers the tablet when nobody has touched it for a while, and counts down
// before it gives the screen back to the welcome screen.
export default function KioskStillThereOverlay({ secondsLeft, onStay }) {
  return (
    <div className="fixed inset-0 z-50 bg-sidebar/85 backdrop-blur-sm flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-3xl bg-card p-10 text-center space-y-5 shadow-2xl">
        <div className="mx-auto h-16 w-16 rounded-full bg-primary/15 flex items-center justify-center">
          <Clock className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-3xl font-display font-bold">Are you still there?</h2>
        <p className="text-lg text-muted-foreground">
          This screen goes back to the welcome screen in {secondsLeft} second{secondsLeft === 1 ? '' : 's'}.
        </p>
        <Button onClick={onStay} className="w-full h-16 text-xl font-semibold">
          Yes, I'm still here
        </Button>
      </div>
    </div>
  );
}