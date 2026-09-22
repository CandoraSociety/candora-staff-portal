import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Loader2, Printer, Send, Share2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { buildInvoiceDocumentHtml, buildInvoiceFileName } from './invoiceDocumentHtml';

// "Open" button — shows the printable Candora invoice in a viewer with
// Save (print / save as PDF) and Share (email the document) options.
export default function InvoiceViewButton({ invoice }) {
  const iframeRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [html, setHtml] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [shareError, setShareError] = useState('');

  const openDoc = () => {
    setHtml(buildInvoiceDocumentHtml({ invoice }));
    setSentTo('');
    setShareError('');
    setOpen(true);
  };

  const print = () => {
    const w = iframeRef.current?.contentWindow;
    if (!w) return;
    // The browser names the saved PDF after the tab title — set it to the
    // invoice file name while the print dialog is open, then restore it.
    const prevTitle = document.title;
    document.title = buildInvoiceFileName(invoice);
    const restore = () => {
      document.title = prevTitle;
      window.removeEventListener('afterprint', restore);
      clearTimeout(fallback);
    };
    window.addEventListener('afterprint', restore);
    const fallback = setTimeout(restore, 120000);
    w.focus();
    w.print();
  };

  const share = async () => {
    const to = recipient.trim();
    if (!to) { setShareError('Enter an email address.'); return; }
    setSending(true);
    setShareError('');
    try {
      await base44.integrations.Core.SendEmail({
        to,
        subject: `Invoice ${invoice.invoice_number || ''} — Candora`,
        html,
      });
      setSentTo(to);
    } catch {
      setShareError('Could not send the email. Check the address and try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2 gap-1.5"
        onClick={openDoc}
        title="Open the invoice — save as PDF or share by email"
      >
        <FileText className="w-4 h-4" />Open
      </Button>

      <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) setShareOpen(false); }}>
        <DialogContent className="max-w-4xl w-[90vw] h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Invoice {invoice.invoice_number || ''} — {invoice.counterparty_name}
              <span className="text-muted-foreground font-normal">(${Number(invoice.total || 0).toFixed(2)})</span>
            </DialogTitle>
          </DialogHeader>
          <iframe
            ref={iframeRef}
            srcDoc={html}
            title="Invoice"
            className="flex-1 w-full border border-border rounded-md bg-white"
          />
          <DialogFooter>
            <Button variant="outline" className="gap-2" onClick={print}>
              <Printer className="w-4 h-4" />Save
            </Button>
            <Button className="gap-2" onClick={() => { setRecipient(invoice.counterparty_email || ''); setShareError(''); setShareOpen(true); }}>
              <Share2 className="w-4 h-4" />Share
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shareOpen} onOpenChange={o => { setShareOpen(o); if (!o) setSentTo(''); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Share2 className="w-4 h-4" />Share Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {sentTo ? (
              <p className="text-sm text-green-700">Sent to <span className="font-medium">{sentTo}</span>.</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Email the invoice document.
                </p>
                <div>
                  <Label className="text-xs">Send to (email)</Label>
                  <Input
                    value={recipient}
                    onChange={e => { setRecipient(e.target.value); setShareError(''); }}
                    placeholder="name@example.com"
                  />
                </div>
                {shareError && <p className="text-xs text-red-600">{shareError}</p>}
              </>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Done</Button></DialogClose>
            {!sentTo && (
              <Button className="gap-2" disabled={sending} onClick={share}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}Send
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}