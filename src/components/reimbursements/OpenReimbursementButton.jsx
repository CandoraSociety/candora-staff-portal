import React, { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Printer, Share2, Send, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrentUser } from '@/lib/useAuth';
import { displayName } from '@/lib/userDisplayName';
import { REIMBURSEMENT_MODES } from '@/lib/reimbursementMode';
import { invalidateFormQueries } from '@/lib/reimbursementFormTotals';
import { buildReimbursementDocumentHtml } from './reimbursementDocumentHtml';

// "Open" button — shows the full reimbursement document in a viewer with
// Save (print / save as PDF) and Share (email the document) options.
// No signature prompt: signatures come from the form record when there is one,
// and for unsubmitted compilations the opening staff member's name fills the signature line.
// editable (finance) — Account # / Funder # become editable in the viewer and
// a "Save Fields" action writes the typed values back to the receipt entries.
export default function OpenReimbursementButton({ entries, form, mode = 'reimbursement', editable = false }) {
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const cfg = REIMBURSEMENT_MODES[mode];
  const iframeRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [html, setHtml] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [shareError, setShareError] = useState('');
  const [savingFields, setSavingFields] = useState(false);
  const [fieldsSaved, setFieldsSaved] = useState(false);

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
    setFieldsSaved(false);
    setOpen(true);
  };

  const save = () => {
    const w = iframeRef.current?.contentWindow;
    if (w) { w.focus(); w.print(); }
  };

  // Finance editing — persist the Account # / Funder # values typed into the document
  const saveFields = async () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const inputs = [...doc.querySelectorAll('input.cell-input[data-entry-id]')];
    const byId = {};
    inputs.forEach(inp => {
      if (!inp.dataset.entryId) return;
      byId[inp.dataset.entryId] = byId[inp.dataset.entryId] || {};
      byId[inp.dataset.entryId][inp.dataset.field] = inp.value.trim();
    });
    const originals = new Map(entries.map(e => [e.id, e]));
    const updates = Object.entries(byId)
      .filter(([id, fields]) => {
        const e = originals.get(id);
        return e && ((fields.account_no || '') !== (e.account_no || '') || (fields.funder_no || '') !== (e.funder_no || ''));
      })
      .map(([id, fields]) => ({ id, fields }));
    if (updates.length === 0) {
      toast.info('No changes to save — Account # / Funder # already match the record.');
      setFieldsSaved(true);
      return;
    }
    setSavingFields(true);
    try {
      const entryEntity = base44.entities[cfg.entryEntity];
      for (const { id, fields } of updates) {
        await entryEntity.update(id, { account_no: fields.account_no || '', funder_no: fields.funder_no || '' });
      }
      invalidateFormQueries(qc, cfg);
      setFieldsSaved(true);
      toast.success(`Saved Account # / Funder # for ${updates.length} receipt ${updates.length === 1 ? 'entry' : 'entries'}.`);
    } catch {
      toast.error('Could not save the Account # / Funder # values. Try again.');
    } finally {
      setSavingFields(false);
    }
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
          {editable && (
            <p className="text-xs text-muted-foreground">
              Account # and Funder # are editable in the document — type in the boxes, then Save Fields to update the receipt records.
            </p>
          )}
          <DialogFooter>
            {editable && (
              <Button variant="outline" className="gap-2 mr-auto" disabled={savingFields} onClick={saveFields}>
                {savingFields ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {fieldsSaved && !savingFields ? 'Saved' : 'Save Fields'}
              </Button>
            )}
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