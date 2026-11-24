import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Paperclip, Send, X } from 'lucide-react';
import GiftShopMessageRecipients, { recipientsFor } from '@/components/winterwonderland/GiftShopMessageRecipients';

const CHUNK_SIZE = 10;

// Writes one message and sends it to the chosen families — by email and by text,
// whichever each family has on file. Families are { family_key, guardian_name,
// guardian_email, guardian_phone, group? }, so the same dialog serves the
// Registration, Check-In and Pre-registration tabs.
export default function GiftShopMessageDialog({ open, onOpenChange, families = [], onSent }) {
  const { toast } = useToast();
  const [group, setGroup] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (open) {
      setGroup('all');
      setSelectedIds(new Set());
      setSubject('');
      setBody('');
      setAttachment(null);
      setUploading(false);
      setSending(false);
      setResults(null);
    }
  }, [open]);

  // A tab that has statuses (the invitation list) offers them as groups; the
  // registration tabs simply offer all families or chosen individuals.
  const groups = useMemo(() => {
    const seen = new Map();
    families.forEach(family => {
      if (family.group && family.label && !seen.has(family.group)) seen.set(family.group, family.label);
    });
    return Array.from(seen, ([value, label]) => ({ value, label }));
  }, [families]);

  const recipients = recipientsFor(families, group, selectedIds);
  const toggle = (key) => setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const pickFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      setAttachment({ name: file.name, file_uri });
    } catch (err) {
      toast({ title: 'That file could not be uploaded', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const send = async () => {
    if (!recipients.length) return toast({ title: 'Choose at least one family', variant: 'destructive' });
    if (!subject.trim() || !body.trim()) {
      return toast({ title: 'Add a heading and a message', variant: 'destructive' });
    }

    setSending(true);
    setResults(null);
    const collected = [];
    try {
      for (let index = 0; index < recipients.length; index += CHUNK_SIZE) {
        const slice = recipients.slice(index, index + CHUNK_SIZE);
        const response = await base44.functions.invoke('sendGiftShopFamilyMessages', {
          families: slice.map(({ family_key, guardian_name, guardian_email, guardian_phone }) => ({
            family_key, guardian_name, guardian_email, guardian_phone,
          })),
          subject: subject.trim(),
          body: body.trim(),
          attachment,
        });
        collected.push(...(response.data?.results || []));
      }
      setResults(collected);
      onSent?.();
    } catch (err) {
      if (collected.length) setResults(collected);
      toast({ title: 'Some messages did not go out', description: err.message, variant: 'destructive' });
      onSent?.();
    } finally {
      setSending(false);
    }
  };

  const summary = results?.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {}) || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send a message</DialogTitle>
          <DialogDescription>
            Goes to each family by text and email, whichever they have on file. Every message is kept on the family’s history.
          </DialogDescription>
        </DialogHeader>

        {results ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold">
              {summary.sent || 0} sent · {summary.partial || 0} reached one channel · {summary.failed || 0} failed
            </p>
            <div className="max-h-64 overflow-y-auto rounded-md border divide-y">
              {results.map((row, index) => (
                <div key={`${row.family_key}-${index}`} className="px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{row.guardian_name}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {[row.emailed && 'email', row.texted && 'text'].filter(Boolean).join(' + ') || 'nothing sent'}
                    </span>
                  </div>
                  {row.message && <p className="text-xs text-red-700 mt-0.5">{row.message}</p>}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <GiftShopMessageRecipients
              families={families}
              groups={groups}
              group={group}
              onGroupChange={setGroup}
              selectedIds={selectedIds}
              onToggle={toggle}
            />
            <div className="space-y-1.5">
              <Label>Heading</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Kids Gift Shop — your shopping time" />
            </div>
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea rows={6} value={body} onChange={e => setBody(e.target.value)} placeholder="Write the message the families will receive" />
            </div>
            <div className="space-y-1.5">
              <Label>Attachment</Label>
              {attachment ? (
                <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <Paperclip className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate flex-1">{attachment.name}</span>
                  <Button size="sm" variant="ghost" onClick={() => setAttachment(null)}><X className="h-3.5 w-3.5" /></Button>
                </div>
              ) : (
                <div>
                  <Input type="file" onChange={pickFile} disabled={uploading} className="cursor-pointer" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {uploading ? 'Uploading…' : 'Optional — sent with the email. Images and documents, stored privately.'}
                  </p>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {recipients.length} {recipients.length === 1 ? 'family' : 'families'} will receive this message.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            {results ? 'Close' : 'Cancel'}
          </Button>
          {!results && (
            <Button onClick={send} disabled={sending || uploading || !recipients.length}>
              {sending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                : <><Send className="h-4 w-4" /> Send to {recipients.length}</>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}