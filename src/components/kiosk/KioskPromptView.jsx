import React from 'react';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import KioskFrame from '@/components/kiosk/KioskFrame';
import KioskDonationView from '@/components/kiosk/KioskDonationView';
import KioskPurchaseView from '@/components/kiosk/KioskPurchaseView';
import KioskRegistrationView from '@/components/kiosk/KioskRegistrationView';

// Picks the screen for whatever reception has sent to this tablet.
export default function KioskPromptView({ prompt, onRespond, onClose }) {
  if (prompt.kind === 'donation') {
    return <KioskDonationView prompt={prompt} onRespond={onRespond} onClose={onClose} />;
  }
  if (prompt.kind === 'purchase') {
    return <KioskPurchaseView prompt={prompt} onRespond={onRespond} onClose={onClose} />;
  }
  if (prompt.kind === 'self_registration') {
    return <KioskRegistrationView prompt={prompt} onRespond={onRespond} onClose={onClose} />;
  }

  return (
    <KioskFrame prompt={prompt} icon={Info} onClose={onClose}>
      <div className="space-y-6">
        <div className="rounded-2xl bg-muted p-6 text-xl leading-relaxed whitespace-pre-wrap">
          {prompt.message || prompt.title}
        </div>
        <Button onClick={onClose} className="w-full h-16 text-xl font-semibold">Got it</Button>
      </div>
    </KioskFrame>
  );
}