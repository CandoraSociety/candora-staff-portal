import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import CandoraBrandLockup from '@/components/campaign-public/CandoraBrandLockup';
import GiftThankYouCard from '@/components/campaign-public/GiftThankYouCard';
import { CANDORA_BRAND, brandFooterLines } from '@/lib/candoraBrand';

// Where a supporter lands straight after paying. The gift is confirmed with
// Stripe before anything is said about it, so the page never thanks someone for
// a payment that did not go through.
export default function GiftThankYou() {
  const [state, setState] = useState({ loading: true, gift: null, error: '' });

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get('session_id') || '';
    if (!sessionId) {
      setState({ loading: false, gift: null, error: '' });
      return;
    }
    base44.functions
      .invoke('getGiftConfirmation', { sessionId })
      .then((res) => setState({ loading: false, gift: res.data, error: '' }))
      .catch(() => setState({ loading: false, gift: null, error: 'unverified' }));
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-sidebar text-sidebar-foreground border-t-4 border-primary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-10">
          <CandoraBrandLockup />
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10">
        {state.loading ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-sm">Confirming your gift…</p>
          </div>
        ) : (
          <GiftThankYouCard gift={state.gift} error={state.error} />
        )}
      </main>

      <footer className="bg-sidebar text-sidebar-foreground border-t border-sidebar-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-wrap items-start justify-between gap-6">
          <CandoraBrandLockup compact />
          <div className="text-xs text-sidebar-foreground/70 space-y-1">
            {brandFooterLines().map((line) => <p key={line}>{line}</p>)}
          </div>
          <p className="text-xs text-sidebar-foreground/50 max-w-xs">
            Gifts are processed securely. Thank you for supporting {CANDORA_BRAND.name}.
          </p>
        </div>
      </footer>
    </div>
  );
}