import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Send } from 'lucide-react';
import { defaultExpiryDate } from '@/lib/giftShopInvites';
import GiftShopInviteListInput from '@/components/winterwonderland/GiftShopInviteListInput';
import GiftShopInviteSendResults from '@/components/winterwonderland/GiftShopInviteSendResults';

const DEFAULT_MESSAGE =
  'Our Kids Gift Shop is back for Winter Wonderland, and as one of the families we work with, yours is invited to choose a shopping time before registration opens to everyone else. The shop runs on Saturday, December 12th at Riverview Crossing Shopping Centre. Pick a time that works for you and tell us who each child is shopping for — on the day, please come to the Kids Gift Shop registration desk and sign in every child who is participating.';

const CHUNK_SIZE = 15;

// Upload a family list, write the message, and email each family their own
// single-use link. The one-time explanation and the office email address are
// added by the email template itself.
export default function GiftShopInviteSendDialog({ open, onOpenChange, onSaved }) {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [expiryDate, setExpiryDate] = useState(defaultExpiryDate());
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (open) {
      setRows([]);
      setMessage(DEFAULT_MESSAGE);
      setExpiryDate(defaultExpiryDate());
      setSending(false);
      setProgress({ done: 0, total: 0 });
      setResults(null);
    }
  }, [open]);

  const send = async () => {
    if (!rows.length) return;
    setSending(true);
    setResults(null);
    setProgress({ done: 0, total: rows.length });

    const collected = [];
    try {
      for (let index = 0; index < rows.length; index += CHUNK_SIZE) {
        const slice = rows.slice(index, index + CHUNK_SIZE);
        setProgress({ done: index, total: rows.length });
        const response = await base44.functions.invoke('sendGiftShopInvites', {
          families: slice,
          message,
          expires_on: expiryDate,
        });
        collected.push(...(response.data?.results || []));
      }
      setResults(collected);
      onSaved?.();
    } catch (err) {
      if (collected.length) setResults(collected);
      toast({ title: 'Some invitations did not go out', description: err.message, variant: 'destructive' });
      onSaved?.();
    } finally {
      setSending(false);
      setProgress({ done: rows.length, total: rows.length });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send pre-registration invites</DialogTitle>
          <DialogDescription>
            Upload the family list, write your message, and each family gets their own link by email and by text. A
            family with no email address gets it by text only.
          </DialogDescription>
        </DialogHeader>

        {results ? (
          <GiftShopInviteSendResults results={results} onDone={() => onOpenChange(false)} />
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-semibold">1. The family list</p>
              <GiftShopInviteListInput rows={rows} onRowsChange={setRows} />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">2. Your message</p>
              <Textarea
                rows={5}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Write a short message to go in the email and text…"
              />
              <p className="text-xs text-muted-foreground">
                Keep it to a short paragraph. The explanation that the link works only once, the closing date and
                info@candorasociety.com for questions are added below your message automatically.
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-semibold">3. When the links close</p>
              <div className="flex items-center gap-3">
                <Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="w-48" />
                <p className="text-xs text-muted-foreground">After this date the links stop working.</p>
              </div>
            </div>
          </div>
        )}

        {!results && (
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>Cancel</Button>
            <Button onClick={send} disabled={sending || !rows.length}>
              {sending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Sending {progress.done} of {progress.total}…</>
              ) : (
                <><Send className="h-4 w-4" /> Send pre-registration invite{rows.length === 1 ? '' : 's'}</>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}