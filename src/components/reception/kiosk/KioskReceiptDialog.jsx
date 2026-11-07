import React, { useEffect, useMemo, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, Loader2, Mail, Printer } from 'lucide-react';
import { useOrgSettings } from '@/lib/useOrgSettings';
import { buildKioskReceiptHtml, kioskReceiptNumber } from '@/components/kiosk/kioskReceiptHtml';

// The receipt for a gift or an order taken on the customer tablet — print it or
// email it to whoever gave their address.
export default function KioskReceiptDialog({ open, onOpenChange, prompt }) {
  const { orgName, logoUrl } = useOrgSettings();
  const frameRef = useRef(null);
  const [email, setEmail] = useState(prompt?.response_email || '');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');

  useEffect(() => {
    setEmail(prompt?.response_email || '');
    setError('');
    setSentTo('');
  }, [prompt?.id]);

  const html = useMemo(
    () => (prompt ? buildKioskReceiptHtml({ prompt, orgName, logoUrl }) : ''),
    [prompt, orgName, logoUrl],
  );

  const print = () => {
    const win = frameRef.current?.contentWindow;
    if (!win) return;
    win.focus();
    win.print();
  };

  const send = async () => {
    const to = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(to)) {
      setError('Enter the email address to send the receipt to.');
      return;
    }
    setSending(true);
    setError('');
    setSentTo('');
    try {
      const isDonation = prompt.kind === 'donation';
      await base44.integrations.Core.SendEmail({
        to,
        subject: `${isDonation ? 'Donation receipt' : 'Receipt'} ${kioskReceiptNumber(prompt)} — ${orgName}`,
        html,
        category: 'transactional',
      });
      setSentTo(to);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not send the receipt email. Print it instead.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {prompt?.kind === 'donation' ? 'Donation receipt' : 'Purchase receipt'}
            {prompt && <span className="ml-2 font-normal text-muted-foreground">{kioskReceiptNumber(prompt)}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-lg border border-border overflow-hidden bg-white">
          <iframe ref={frameRef} srcDoc={html} title="Receipt" className="w-full h-[46vh] min-h-[320px]" />
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Email this receipt</Label>
          <div className="flex gap-2">
            <Input
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); setSentTo(''); }}
              placeholder="customer@example.com"
              inputMode="email"
            />
            <Button variant="outline" onClick={send} disabled={sending} className="gap-2 shrink-0">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Send
            </Button>
          </div>
          {sentTo && (
            <p className="flex items-center gap-1.5 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" /> Sent to {sentTo}.
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={print} className="gap-2">
            <Printer className="h-4 w-4" /> Print receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}