import React from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const clock = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

// The class list for a room, as staff see it on their own phone: tap a name to
// mark that person present. Names already checked in stay ticked.
export default function CheckInRosterList({ people, checkins = [], busyId, onMark }) {
  const doneFor = (person) => checkins.find((row) => row.id === person.id);

  if (people.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Nobody is registered for this class yet.
      </p>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {people.map((person) => {
        const done = doneFor(person);
        return (
          <Button
            key={person.id}
            variant={done ? 'secondary' : 'outline'}
            disabled={!!done || busyId === person.id}
            onClick={() => onMark(person)}
            className="h-14 justify-between text-base font-medium"
          >
            <span className="truncate">{person.name}</span>
            {done ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-success">
                <Check className="h-4 w-4" /> {clock(done.at)}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">{busyId === person.id ? 'Saving…' : 'Mark present'}</span>
            )}
          </Button>
        );
      })}
    </div>
  );
}