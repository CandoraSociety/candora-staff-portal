import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ELLWaitlistCard from '@/components/ell/ELLWaitlistCard';
import WaitlistEntryCard from '@/components/empoweru/WaitlistEntryCard';

// One titled slice of a program's waitlist — the matched slice (people who asked
// for this class or level) and the general slice render through this same block,
// each keeping its waitlist position so the order is never lost when split.
export default function ProgramWaitlistGroup({
  title,
  hint,
  entries = [],
  emptyText,
  isEll,
  expandedId,
  onToggle,
  seatingId,
  onGiveSeat,
}) {
  return (
    <div className="space-y-2">
      {title && (
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      )}
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground py-3 text-center">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="space-y-1.5">
              {isEll ? (
                <ELLWaitlistCard
                  entry={entry}
                  shaded={entry.position % 2 === 0}
                  position={entry.position}
                  expanded={expandedId === entry.id}
                  onToggle={() => onToggle(entry.id)}
                />
              ) : (
                <WaitlistEntryCard
                  entry={entry}
                  shaded={entry.position % 2 === 0}
                  position={entry.position}
                  expanded={expandedId === entry.id}
                  onToggle={() => onToggle(entry.id)}
                />
              )}
              <div className="flex justify-end">
                <Button size="sm" variant="outline" disabled={seatingId === entry.id} onClick={() => onGiveSeat(entry)}>
                  <Check className="h-3.5 w-3.5" />
                  {seatingId === entry.id ? 'Adding…' : isEll ? 'Add to this class' : 'Register for this cohort'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}