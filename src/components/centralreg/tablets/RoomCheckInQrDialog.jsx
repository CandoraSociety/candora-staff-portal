import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

// QR code for one teaching room. Scanning it opens that room's check-in screen
// (/kiosk?room=...), so a phone in the room can check people in without the
// wall tablet — the same screen the tablet opens when a class starts.
export default function RoomCheckInQrDialog({ room, open, onOpenChange }) {
  if (!room) return null;
  const url = `${window.location.origin}/kiosk?room=${room.id}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=10&data=${encodeURIComponent(url)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{room.label} check-in QR</DialogTitle>
          <DialogDescription>
            Scanning this opens the {room.label} check-in screen for whatever class is running in that room.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-2">
          <div className="rounded-xl border bg-white p-3">
            <img src={qrSrc} alt={`QR code for the ${room.label} check-in screen`} className="h-56 w-56" />
          </div>
          <p className="text-xs font-mono text-muted-foreground break-all text-center">{url}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}