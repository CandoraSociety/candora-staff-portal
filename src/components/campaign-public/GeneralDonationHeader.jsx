import React from 'react';
import { ExternalLink } from 'lucide-react';
import CandoraBrandLockup from '@/components/campaign-public/CandoraBrandLockup';

export default function GeneralDonationHeader({ general }) {
  return (
    <header className="bg-sidebar text-sidebar-foreground border-t-4 border-primary">
      <div className="w-full max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 pt-6 pb-10 sm:pb-12 space-y-8">
        <div className="flex items-start justify-between gap-4">
          <CandoraBrandLockup />
          <a href="https://candora.ca" target="_blank" rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20 sm:text-sm">
            <ExternalLink className="w-4 h-4" /> Visit candora.ca
          </a>
        </div>
        <div className="max-w-2xl space-y-3">
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold leading-tight">Make a donation</h1>
          <div className="h-1 w-16 rounded-full bg-primary" />
          <p className="text-base text-sidebar-foreground/85">
            {general?.tagline || 'Your gift supports our programs and the people who count on them.'}
          </p>
        </div>
      </div>
    </header>
  );
}