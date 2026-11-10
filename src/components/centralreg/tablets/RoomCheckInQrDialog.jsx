import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

// QR code for one teaching room, for staff. Scanning it opens that room's
// check-in list (/central-registration/check-in?room=...) on a phone or tablet
// that is already signed in — sign in once on the phone and it opens straight
// onto the list from then on.
export default function RoomCheckInQrDialog({ room, open, onOpenChange }) {
  if (!room) return null;
  const path = `/central-registration/check-in?room=${encodeURIComponent(room.id)}`;
  // Scans leave the editor: always use the verified published app address.
  const url = `https://candora-staff-link.base44.app${path}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=10&data=${encodeURIComponent(url)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{room.label} check-in QR</DialogTitle>
          <DialogDescription>
            Scan to open the {room.label} class list on the published staff portal and mark people present.
            Staff sign-in is required; no tablet pairing code is needed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-2">
          <div className="rounded-xl border bg-white p-3">
            <img src={qrSrc} alt={`QR code for the ${room.label} check-in list`} className="h-56 w-56" />
          </div>
          <p className="text-xs font-mono text-muted-foreground break-all text-center">{url}</p>
          <Button variant="outline" size="sm" asChild>
            <a href={path}>
              <ExternalLink className="h-4 w-4" /> Open on this device
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}