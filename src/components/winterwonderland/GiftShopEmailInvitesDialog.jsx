import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Mail } from 'lucide-react';
import GiftShopInviteSendResults from '@/components/winterwonderland/GiftShopInviteSendResults';

const DEFAULT_MESSAGE =
  'Our Kids Gift Shop is back for Winter Wonderland, and as one of the families we work with, yours is invited to choose a shopping time before registration opens to everyone else. The shop runs on Saturday, December 12th at Riverview Crossing Shopping Centre. Pick a time that works for you and tell us who each child is shopping for — on the day, please come to the Kids Gift Shop registration desk and sign in every child who is participating.';

const CHUNK_SIZE = 15;

// Emails the invitations that are already in the list — the same links, sent to
// each guardian's email address. Families with no email address are reported
// back so staff can text or print their link instead.
export default function GiftShopEmailInvitesDialog({ open, onOpenChange, invites = [], onSent }) {
  const { toast } = useToast();
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (open) {
      setMessage(DEFAULT_MESSAGE);
      setSending(false);
      setProgress({ done: 0, total: 0 });
      setResults(null);
    }
  }, [open]);

  const withEmail = invites.filter(invite => invite.guardian_email);

  const send = async () => {
    if (!withEmail.length) return;
    setSending(true);
    setResults(null);
    setProgress({ done: 0, total: withEmail.length });

    const collected = [];
    try {
      for (let index = 0; index < withEmail.length; index += CHUNK_SIZE) {
        const slice = withEmail.slice(index, index + CHUNK_SIZE);
        setProgress({ done: index, total: withEmail.length });
        const response = await base44.functions.invoke('sendGiftShopInvites', {
          invite_ids: slice.map(invite => invite.id),
          message,
        });
        collected.push(...(response.data?.results || []));
      }
      setResults(collected);
      onSent?.();
    } catch (err) {
      if (collected.length) setResults(collected);
      toast({ title: 'Some invitations did not go out', description: err.message, variant: 'destructive' });
      onSent?.();
    } finally {
      setSending(false);
      setProgress({ done: withEmail.length, total: withEmail.length });
    }
  };

  const withoutEmail = invites.length - withEmail.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email the invitations</DialogTitle>
          <DialogDescription>
            Sends each family the link that is already in the list — {withEmail.length}{' '}
            {withEmail.length === 1 ? 'family has' : 'families have'} an email address.
          </DialogDescription>
        </DialogHeader>

        {results ? (
          <GiftShopInviteSendResults results={results} onDone={() => onOpenChange(false)} />
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-semibold">Your message</p>
            <Textarea rows={6} value={message} onChange={e => setMessage(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              The explanation that the link works only once, each link's closing date and info@candorasociety.com are
              added below your message automatically.
            </p>
            {withoutEmail > 0 && (
              <p className="text-xs text-muted-foreground">
                {withoutEmail} open {withoutEmail === 1 ? 'invitation has' : 'invitations have'} no email address — copy
                or print {withoutEmail === 1 ? 'that link' : 'those links'} instead.
              </p>
            )}
          </div>
        )}

        {!results && (
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>Cancel</Button>
            <Button onClick={send} disabled={sending || !withEmail.length}>
              {sending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Sending {progress.done} of {progress.total}…</>
              ) : (
                <><Mail className="h-4 w-4" /> Send {withEmail.length} email{withEmail.length === 1 ? '' : 's'}</>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}