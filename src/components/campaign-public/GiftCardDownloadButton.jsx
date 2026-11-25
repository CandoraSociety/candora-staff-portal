import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { downloadGiftCardPdf } from '@/lib/giftCardPdf';

// Saves the greeting card as a real PDF, ready to print at home. It is also the
// button the "print or save the card" link in the card's email lands on.
export default function GiftCardDownloadButton({ card, campaign, logoUrl, autoStart = false }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const started = useRef(false);

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await downloadGiftCardPdf({ card, campaign, logoUrl });
    } catch (err) {
      console.error('gift card PDF failed', err?.message || err);
      setError('The PDF could not be made. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!autoStart || started.current) return;
    started.current = true;
    save();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  return (
    <div className="space-y-1">
      <Button
        onClick={save}
        disabled={busy}
        className="w-full sm:w-auto bg-[#fccf03] text-[#0a0f29] hover:bg-[#e6bd03] font-semibold"
      >
        {busy ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        {busy ? 'Preparing your card…' : 'Save a printable card (PDF)'}
      </Button>
      <p className="text-xs text-muted-foreground">
        Prefer paper? Save the card as a PDF and print it at home.
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}