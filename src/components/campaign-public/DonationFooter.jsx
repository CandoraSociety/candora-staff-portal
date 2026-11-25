import React from 'react';
import CandoraBrandLockup from '@/components/campaign-public/CandoraBrandLockup';
import { CANDORA_BRAND, brandFooterLines } from '@/lib/candoraBrand';

export default function DonationFooter() {
  return (
    <footer className="bg-sidebar text-sidebar-foreground border-t border-sidebar-border">
      <div className="w-full max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 py-8 flex flex-wrap items-start justify-between gap-6">
        <CandoraBrandLockup compact />
        <div className="text-xs text-sidebar-foreground/70 space-y-1">
          {brandFooterLines().map((line) => <p key={line}>{line}</p>)}
        </div>
        <p className="text-xs text-sidebar-foreground/50 max-w-xs">
          Gifts are processed securely. Thank you for supporting {CANDORA_BRAND.name}.
        </p>
      </div>
    </footer>
  );
}