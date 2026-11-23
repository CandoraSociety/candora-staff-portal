import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { normalizeSmsPhone, textsForPhone, unreadReplies } from '@/lib/giftShopTexts';
import { giftShopSlotLabel } from '@/lib/giftShopFamilies';

const when = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleString('en-CA', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

// The texts exchanged with one family — what the desk sent and what they wrote
// back. Opening it marks their replies as read.
export default function GiftShopTextThreadDialog({ open, onOpenChange, family, texts = [], onRead }) {
  const { toast } = useToast();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const messages = textsForPhone(texts, family?.guardian_phone);

  // Answer the family back on the same number the conversation came in on.
  const sendReply = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !family?.guardian_phone) return;
    setSending(true);
    try {
      const res = await base44.functions.invoke('sendSms', { to: family.guardian_phone, body });
      if (res.data?.error) throw new Error(res.data.error);
      await base44.entities.GiftShopText.create({
        phone: normalizeSmsPhone(family.guardian_phone),
        direction: 'out',
        body,
        guardian_name: family.guardian_name,
        sent_at: new Date().toISOString(),
        staff_name: res.data?.sent_by || '',
        twilio_sid: res.data?.sid || '',
      });
      setDraft('');
      onRead?.();
      toast({ title: 'Text sent', description: `${family.guardian_name} was sent your reply.` });
    } catch (err) {
      toast({ title: 'Could not send the text', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!open || !family) return;
    const unread = unreadReplies(texts, family.guardian_phone);
    if (!unread.length) return;
    const now = new Date().toISOString();
    Promise.all(unread.map(m => base44.entities.GiftShopText.update(m.id, { read_at: now })))
      .then(() => onRead?.());
  }, [open, family, texts, onRead]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" /> {family?.guardian_name || 'Family'}
          </DialogTitle>
          <DialogDescription>
            {family?.guardian_phone || 'No number'} • {giftShopSlotLabel(family?.time_slot)}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages with this family yet.</p>
          ) : messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.direction === 'out' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  message.direction === 'out'
                    ? 'bg-accent text-accent-foreground'
                    : 'border border-green-600/40 bg-green-50 text-green-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.body}</p>
                <p className="mt-1 text-[10px] opacity-70">
                  {message.direction === 'out' ? 'Sent' : 'Reply'} • {when(message.sent_at)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={sendReply} className="flex items-center gap-2 border-t pt-3">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={family?.guardian_phone ? 'Write a reply…' : 'No number on this family'}
            disabled={!family?.guardian_phone || sending}
            autoFocus
          />
          <Button type="submit" size="sm" disabled={sending || !draft.trim() || !family?.guardian_phone}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}