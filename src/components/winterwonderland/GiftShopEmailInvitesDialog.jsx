import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Send } from 'lucide-react';
import GiftShopInviteSendResults from '@/components/winterwonderland/GiftShopInviteSendResults';
import { useGiftShopEventDetails, inviteMessageDraft, inviteReminderDraft } from '@/lib/giftShopEvent';

const CHUNK_SIZE = 15;

// Sends the invitations that are already in the list — the same links, by email
// and by text. A family with no email address is reached by text alone. Only
// families that have not been sent their invitation yet are passed in, so a
// second send reaches the new families and nobody else. In reminder mode the
// families whose invitation has already gone out are passed in instead, and the
// same link is sent again with reminder wording.
export default function GiftShopEmailInvitesDialog({ open, onOpenChange, invites = [], onSent, mode = 'invite' }) {
  const { toast } = useToast();
  const event = useGiftShopEventDetails();
  const reminder = mode === 'reminder';
  const draft = reminder
    ? inviteReminderDraft({ eventDate: event.eventDate, eventLocation: event.eventLocation })
    : inviteMessageDraft({ eventDate: event.eventDate, eventLocation: event.eventLocation });
  const lastDraft = useRef(draft);
  const lastMode = useRef(mode);
  const [message, setMessage] = useState(draft);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (open) {
      const modeChanged = lastMode.current !== mode;
      setMessage(prev => (!prev || prev === lastDraft.current || modeChanged ? draft : prev));
      setSending(false);
      setProgress({ done: 0, total: 0 });
      setResults(null);
    }
    lastDraft.current = draft;
    lastMode.current = mode;
  }, [open, draft, mode]);

  const reachable = invites.filter(invite => invite.guardian_email || invite.guardian_phone);
  const unreachable = invites.length - reachable.length;
  const byTextOnly = reachable.filter(invite => !invite.guardian_email).length;

  const send = async () => {
    if (!reachable.length) return;
    setSending(true);
    setResults(null);
    setProgress({ done: 0, total: reachable.length });

    const collected = [];
    try {
      for (let index = 0; index < reachable.length; index += CHUNK_SIZE) {
        const slice = reachable.slice(index, index + CHUNK_SIZE);
        setProgress({ done: index, total: reachable.length });
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
      setProgress({ done: reachable.length, total: reachable.length });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{reminder ? 'Send a registration reminder' : 'Send the invitations'}</DialogTitle>
          <DialogDescription>
            {reminder
              ? 'Sends the same link again to families whose invitation has already gone out and who have not registered yet — by email and by text.'
              : 'Sends each family the link that is already in the list — by email and by text. Only families who have not been sent their invitation yet are included.'}{' '}
            {reachable.length} {reachable.length === 1 ? 'family can' : 'families can'} be reached.
          </DialogDescription>
        </DialogHeader>

        {results ? (
          <GiftShopInviteSendResults
            results={results}
            sentLabel={reminder ? 'Reminders sent' : 'Invitations sent'}
            onDone={() => onOpenChange(false)}
          />
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-semibold">Your message</p>
            <Textarea rows={6} value={message} onChange={e => setMessage(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              The explanation that the link works only once, each link's closing date and info@candorasociety.com are
              added below your message automatically. The text carries a shorter version with the same link.
            </p>
            {byTextOnly > 0 && (
              <p className="text-xs text-muted-foreground">
                {byTextOnly} open {byTextOnly === 1 ? 'invitation has' : 'invitations have'} no email address —
                {byTextOnly === 1 ? ' that family gets' : ' those families get'} the link by text only.
              </p>
            )}
            {unreachable > 0 && (
              <p className="text-xs text-muted-foreground">
                {unreachable} open {unreachable === 1 ? 'invitation has' : 'invitations have'} no email address or phone
                number — copy or print {unreachable === 1 ? 'that link' : 'those links'} instead.
              </p>
            )}
          </div>
        )}

        {!results && (
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>Cancel</Button>
            <Button onClick={send} disabled={sending || !reachable.length}>
              {sending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Sending {progress.done} of {progress.total}…</>
              ) : (
                <><Send className="h-4 w-4" /> Send {reachable.length} {reminder ? 'reminder' : 'invitation'}{reachable.length === 1 ? '' : 's'}</>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}