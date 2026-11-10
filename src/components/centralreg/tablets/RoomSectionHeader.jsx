import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Plus, QrCode } from 'lucide-react';
import RoomCheckInQrDialog from './RoomCheckInQrDialog';

// Heading for one teaching room: the tablet mounted there, the screen it opens,
// a QR code to that same check-in, and a shortcut to open it on this computer.
export default function RoomSectionHeader({ room, onAddTablet }) {
  const [qrOpen, setQrOpen] = useState(false);

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

        <Button size="sm" variant="outline" onClick={() => setQrOpen(true)}>
          <QrCode className="h-4 w-4" /> QR code
        </Button>

        <Button size="sm" onClick={onAddTablet}>
          <Plus className="h-4 w-4" /> Add tablet
        </Button>
      </div>

      <RoomCheckInQrDialog room={room} open={qrOpen} onOpenChange={setQrOpen} />
    </div>
  );
}