import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Plus } from 'lucide-react';

// Heading for one teaching room: the tablet mounted there, the screen it opens,
// and a shortcut to open that same check-in on this computer.
export default function RoomSectionHeader({ room, onAddTablet }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold">{room.label}</h2>
        <p className="text-sm text-muted-foreground">{room.blurb}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" asChild>
          <a href={`/kiosk?room=${room.id}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" /> Open check-in screen
          </a>
        </Button>

        <Button size="sm" onClick={onAddTablet}>
          <Plus className="h-4 w-4" /> Add tablet
        </Button>
      </div>
    </div>
  );
}