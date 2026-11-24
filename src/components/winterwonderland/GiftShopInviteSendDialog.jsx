import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Link2, Loader2 } from 'lucide-react';
import { defaultExpiryDate } from '@/lib/giftShopInvites';
import GiftShopInviteListInput from '@/components/winterwonderland/GiftShopInviteListInput';
import GiftShopInviteCreateResults from '@/components/winterwonderland/GiftShopInviteCreateResults';

const CHUNK_SIZE = 15;

// Upload a family list and create each family's own single-use link. Nothing is
// sent from here: the families land in the Pre-registration tab so the list can
// be reviewed, and Send invitations sends them when staff are ready.
export default function GiftShopInviteSendDialog({ open, onOpenChange, onSaved }) {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [expiryDate, setExpiryDate] = useState(defaultExpiryDate());
  const [working, setWorking] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (open) {
      setRows([]);
      setExpiryDate(defaultExpiryDate());
      setWorking(false);
      setProgress({ done: 0, total: 0 });
      setResults(null);
    }
  }, [open]);

  const create = async () => {
    if (!rows.length) return;
    setWorking(true);
    setResults(null);
    setProgress({ done: 0, total: rows.length });

    const collected = [];
    try {
      for (let index = 0; index < rows.length; index += CHUNK_SIZE) {
        const slice = rows.slice(index, index + CHUNK_SIZE);
        setProgress({ done: index, total: rows.length });
        const response = await base44.functions.invoke('sendGiftShopInvites', {
          families: slice,
          expires_on: expiryDate,
          create_only: true,
        });
        collected.push(...(response.data?.results || []));
      }
      setResults(collected);
      onSaved?.();
    } catch (err) {
      if (collected.length) setResults(collected);
      toast({ title: 'Some links could not be created', description: err.message, variant: 'destructive' });
      onSaved?.();
    } finally {
      setWorking(false);
      setProgress({ done: rows.length, total: rows.length });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload a family list</DialogTitle>
          <DialogDescription>
            Add the families to the pre-registration list and create each family's own single-use link. Nothing is
            sent — review the list first, then press Send invitations.
          </DialogDescription>
        </DialogHeader>

        {results ? (
          <GiftShopInviteCreateResults results={results} onDone={() => onOpenChange(false)} />
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-semibold">1. The family list</p>
              <GiftShopInviteListInput rows={rows} onRowsChange={setRows} />
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-semibold">2. When the links close</p>
              <div className="flex items-center gap-3">
                <Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="w-48" />
                <p className="text-xs text-muted-foreground">After this date the links stop working.</p>
              </div>
            </div>
          </div>
        )}

        {!results && (
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={working}>Cancel</Button>
            <Button onClick={create} disabled={working || !rows.length}>
              {working ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating {progress.done} of {progress.total}…</>
              ) : (
                <><Link2 className="h-4 w-4" /> Create {rows.length || ''} link{rows.length === 1 ? '' : 's'}</>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}