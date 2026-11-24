import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Archive, Loader2 } from 'lucide-react';

// Closing the Kids Gift Shop for the year. The password unlocks it; the event's
// setup, registrations, check-ins, invitations and message history are copied
// to the event archive and to SharePoint, and only then is the shop cleared so
// next year starts empty.
export default function GiftShopConcludeEventDialog({ open, onOpenChange, festival, onConcluded }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setPassword('');
      setBusy(false);
      setError('');
    }
  }, [open]);

  const conclude = async () => {
    if (!password.trim()) {
      setError('Enter the password to conclude the event.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await base44.functions.invoke('concludeGiftShopEvent', {
        password,
        festival_id: festival?.id || '',
      });
      const data = response.data || {};
      qc.invalidateQueries();
      toast({
        title: 'Event concluded and archived',
        description: `${data.summary?.children ?? 0} children and ${data.summary?.families ?? 0} families saved to the archive and SharePoint. The shop is clear for next year.`,
      });
      onConcluded?.(data);
      onOpenChange(false);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'The event could not be concluded.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Archive className="h-4 w-4" /> Conclude the event</DialogTitle>
          <DialogDescription>
            This closes this year's Kids Gift Shop. Enter the password to confirm.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 space-y-1">
            <p className="font-semibold">What happens when you conclude:</p>
            <p>· The event details, every registration and check-in, the invitations and the message history are saved to the event archive.</p>
            <p>· The same records are copied to the Winter Wonderland Festival / Kids Gift Shop folder in SharePoint.</p>
            <p>· The Registration, Check-In &amp; Status and Pre-registration tabs are cleared, ready for next year's setup wizard.</p>
          </div>

          <div className="space-y-1.5">
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              onKeyDown={event => { if (event.key === 'Enter') conclude(); }}
              placeholder="Enter the password"
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={conclude} disabled={busy || !password.trim()}>
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Concluding…</> : <><Archive className="h-4 w-4" /> Conclude event</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}