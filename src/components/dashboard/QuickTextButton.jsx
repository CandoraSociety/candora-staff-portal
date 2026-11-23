import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';

// A personal shortcut: type a number and a message and it goes out from the
// Candora Twilio number.
export default function QuickTextButton() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const send = async (event) => {
    event.preventDefault();
    setError('');
    setSending(true);
    try {
      const res = await base44.functions.invoke('sendSms', { to, body });
      if (res.data?.error) throw new Error(res.data.error);
      toast({ title: 'Text sent', description: `Message sent to ${to}.` });
      setBody('');
      setOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2 rounded-full">
        <MessageSquare className="h-4 w-4" /> Quick text
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Quick text
            </DialogTitle>
            <DialogDescription>Send a text from the Candora number.</DialogDescription>
          </DialogHeader>

          <form onSubmit={send} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="quick-text-to">To</Label>
              <Input
                id="quick-text-to"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="(587) 555-1234"
                inputMode="tel"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quick-text-body">Message</Label>
              <Textarea
                id="quick-text-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                placeholder="Type your message…"
              />
              <p className="text-xs text-muted-foreground">{body.length} characters</p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button type="submit" disabled={sending || !to.trim() || !body.trim()} className="gap-2">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? 'Sending…' : 'Send text'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}