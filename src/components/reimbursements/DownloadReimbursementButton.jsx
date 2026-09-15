import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, PenLine } from 'lucide-react';
import { useCurrentUser } from '@/lib/useAuth';
import { displayName } from '@/lib/userDisplayName';
import { REIMBURSEMENT_MODES } from '@/lib/reimbursementMode';
import { buildReimbursementDocumentHtml } from './reimbursementDocumentHtml';

export default function DownloadReimbursementButton({ entries, form, mode = 'reimbursement' }) {
  const { user } = useCurrentUser();
  const [sigOpen, setSigOpen] = useState(false);
  const [signature, setSignature] = useState('');
  const [sigError, setSigError] = useState('');
  const cfg = REIMBURSEMENT_MODES[mode];

  const askForSignature = () => {
    // A submitted request already carries its staff e-signature — prefill it
    setSignature(form?.staff_signature || '');
    setSigError('');
    setSigOpen(true);
  };

  const download = async () => {
    const sig = signature.trim();
    if (!sig) { setSigError('Type your full name to e-sign the form.'); return; }
    setSigError('');

    // Use the latest saved e-transfer email from the profile
    let etransferEmail = user?.etransfer_email || user?.email || '';
    try {
      const u = await base44.auth.me();
      if (u?.etransfer_email || u?.email) etransferEmail = u.etransfer_email || u.email;
    } catch { /* fall back to the loaded user */ }

    const html = buildReimbursementDocumentHtml({
      entries,
      form,
      mode,
      viewerName: displayName(user),
      etransferEmail,
      staffSignature: sig,
      autoPrint: true,
    });

    const win = window.open('', '_blank', 'width=900,height=1000');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setSigOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={!entries || entries.length === 0}
        onClick={() => (form?.staff_signature ? download() : askForSignature())}
      >
        <Download className="w-4 h-4" />{cfg.downloadButton}
      </Button>

      <Dialog open={sigOpen} onOpenChange={setSigOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><PenLine className="w-4 h-4" />e-Sign Your {cfg.docTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Type your full name below to e-sign the downloadable form. This signature will fill the signature slot on the form.
            </p>
            <div>
              <Label className="text-xs">e-Signature — type your full name *</Label>
              <Input value={signature} onChange={e => { setSignature(e.target.value); setSigError(''); }} placeholder={displayName(user)} />
            </div>
            {form?.approved_by && (
              <p className="text-xs text-muted-foreground">Approved by <span className="font-medium">{form.approved_by}</span></p>
            )}
            {sigError && <p className="text-xs text-red-600">{sigError}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={download} className="gap-2">
              <Download className="w-4 h-4" />Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}