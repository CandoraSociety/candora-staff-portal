import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarX, CheckCircle2, Link2Off, ShieldAlert } from 'lucide-react';

const COPY = {
  invalid: {
    icon: Link2Off,
    title: 'This link is not valid',
    body: 'Check that you copied the whole link from your invitation. If it still does not open, call the office and we will help you register.',
  },
  registered: {
    icon: CheckCircle2,
    title: 'This invitation has already been used',
    body: 'A registration has already been completed with this link. Call the office if you need to change a time or add a child.',
  },
  revoked: {
    icon: ShieldAlert,
    title: 'This invitation has been cancelled',
    body: 'Please call the office and we will help you register for the Kids Gift Shop.',
  },
  expired: {
    icon: CalendarX,
    title: 'This invitation has expired',
    body: 'Pre-registration for this invitation has closed. Please call the office to register.',
  },
};

export default function GiftShopInviteClosed({ state }) {
  const copy = COPY[state] || COPY.invalid;
  const Icon = copy.icon;
  return (
    <Card>
      <CardContent className="py-12 text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto">
          <Icon className="h-7 w-7 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold">{copy.title}</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{copy.body}</p>
        </div>
      </CardContent>
    </Card>
  );
}