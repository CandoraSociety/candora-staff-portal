import React from 'react';
import { DoorOpen } from 'lucide-react';
import GiftShopSignIn from '@/components/winterwonderland/GiftShopSignIn';

// The Kids Gift Shop sign-in list, opened in its own window from the Sign-In tab
// — the door desk works from this while the portal stays on the other screen.
export default function GiftShopSignInWindow() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-2">
          <DoorOpen className="h-4 w-4 text-muted-foreground" />
          <div>
            <h1 className="font-display font-bold text-sm leading-tight">Kids Gift Shop — Sign-In</h1>
            <p className="text-xs text-muted-foreground leading-tight">
              Sign children in at the door. Every change shows on the portal as it happens.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        <GiftShopSignIn standalone />
      </div>
    </div>
  );
}