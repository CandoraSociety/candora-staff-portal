import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Printer, Share2, Send, Loader2 } from 'lucide-react';
import { useCurrentUser } from '@/lib/useAuth';
import { displayName } from '@/lib/userDisplayName';
import { REIMBURSEMENT_MODES } from '@/lib/reimbursementMode';
import { buildReimbursementDocumentHtml } from './reimbursementDocumentHtml';

// "Open" button — shows the full reimbursement document in a viewer with
// Save (print / save as PDF) and Share (email the document) options.
// No signature prompt: signatures come from the form record when there is one,
// and for unsubmitted compilations the opening staff member's name fills the signature line.
export default function OpenReimbursementButton({ entries, form, mode = 'reimbursement' }) {
  const { user } = useCurrentUser();
  const cfg = REIMBURSEMENT_MODES[mode];
  const iframeRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [html, setHtml] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [shareError, setShareError] = useState('');

  const openDoc = async () => {
    let etransferEmail = form?.etransfer_email || '';
    // Unsubmitted compilation — the document belongs to the staff member opening it
    if (!form) {
      etransferEmail = user?.etransfer_email || user?.email || '';
      try {
        const u = await base44.auth.me();
        if (u?.etransfer_email || u?.email) etransferEmail = u.etransfer_email || u.email;
      } catch { /* fall back to the loaded user */ }
    }
    const viewerName = form?.requester_name || displayName(user);
    setHtml(buildReimbursementDocumentHtml({
      entries,
      form,
      mode,
      viewerName,
      etransferEmail,
      staffSignature: form ? '' : displayName(user),
    }));
    setSentTo('');
    setShareError('');
    setOpen(true);
  };

  const save = () => {
    const w = iframeRef.current?.contentWindow;
    if (w) { w.focus(); w.print(); }
  };

  const share = async () => {
    const to = recipient.trim();
    if (!to) { setShareError('Enter an email address.'); return; }
    setSending(true);
    setShareError('');
    try {
      await base44.integrations.Core.SendEmail({
        to,
        subject: `${cfg.docTitle} — ${form?.requester_name || ''}`,
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
        className="gap-2"
        disabled={!entries || entries.length === 0}
        onClick={openDoc}
        title="Open the full form — save as PDF or share by email"
      >
        <FileText className="w-4 h-4" />{cfg.downloadButton.replace(/^Download/, 'Open')}
      </Button>

      <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) setShareOpen(false); }}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {cfg.docTitle} — {form?.requester_name || displayName(user)}
              {form?.amount != null && <span className="text-muted-foreground font-normal">(${Number(form.amount).toFixed(2)})</span>}
            </DialogTitle>
          </DialogHeader>
          <iframe
            ref={iframeRef}
            srcDoc={html}
            title={cfg.docTitle}
            className="flex-1 w-full border border-border rounded-md bg-white"
          />
          <DialogFooter>
            <Button variant="outline" className="gap-2" onClick={save}>
              <Printer className="w-4 h-4" />Save
            </Button>
            <Button className="gap-2" onClick={() => { setRecipient(form?.requester_email || user?.email || ''); setShareError(''); setShareOpen(true); }}>
              <Share2 className="w-4 h-4" />Share
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shareOpen} onOpenChange={o => { setShareOpen(o); if (!o) setSentTo(''); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Share2 className="w-4 h-4" />Share {cfg.docTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {sentTo ? (
              <p className="text-sm text-green-700">Sent to <span className="font-medium">{sentTo}</span>.</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Email the full form to a Candora staff member.
                </p>
                <div>
                  <Label className="text-xs">Send to (email)</Label>
                  <Input
                    value={recipient}
                    onChange={e => { setRecipient(e.target.value); setShareError(''); }}
                    placeholder="name@candora.ca"
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