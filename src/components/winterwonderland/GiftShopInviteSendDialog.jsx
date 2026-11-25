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
import GiftShopFamilyMatchReview from '@/components/winterwonderland/GiftShopFamilyMatchReview';
import GiftShopCentralInfoReview from '@/components/winterwonderland/GiftShopCentralInfoReview';
import { reviewFamilies } from '@/lib/giftShopFamilyMatches';
import { findCentralInfo, applyCentralInfo } from '@/lib/giftShopCentralInfo';

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
  const [reviews, setReviews] = useState(null);
  const [pendingRows, setPendingRows] = useState(null);
  const [decisions, setDecisions] = useState({});
  const [central, setCentral] = useState(null);
  const [included, setIncluded] = useState({});
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (open) {
      setRows([]);
      setExpiryDate(defaultExpiryDate());
      setWorking(false);
      setProgress({ done: 0, total: 0 });
      setResults(null);
      setReviews(null);
      setPendingRows(null);
      setDecisions({});
      setCentral(null);
      setIncluded({});
      setChecking(false);
    }
  }, [open]);

  // A list often carries only a phone number or an email address, so the Central
  // Database is asked first whether it already knows each family. Whatever it
  // can add is offered for confirmation before anything is filled in.
  const create = async () => {
    if (!rows.length) return;
    setChecking(true);
    try {
      const found = await findCentralInfo(rows);
      if (found.length) {
        setCentral(found);
        setIncluded(Object.fromEntries(found.map(match => [String(match.index), true])));
        return;
      }
    } catch (err) {
      toast({ title: 'Could not check the Central Database', description: err.message, variant: 'destructive' });
      return;
    } finally {
      setChecking(false);
    }
    checkFamilies(rows);
  };

  const useCentralDetails = () => {
    const next = applyCentralInfo(rows, central || [], included);
    setCentral(null);
    setRows(next);
    checkFamilies(next);
  };

  const skipCentralDetails = () => {
    setCentral(null);
    checkFamilies(rows);
  };

  // Every family on the list is checked against the ones already in the Kids Gift
  // Shop before any card is opened, so a family that is already on file is
  // confirmed first.
  const checkFamilies = async (list) => {
    setChecking(true);
    try {
      const found = await reviewFamilies(list);
      if (found.length) {
        setPendingRows(list);
        setReviews(found);
        setDecisions({});
        return;
      }
    } catch (err) {
      toast({ title: 'Could not check the list for duplicate families', description: err.message, variant: 'destructive' });
      return;
    } finally {
      setChecking(false);
    }
    submit(list, {});
  };

  // A family confirmed as the same household is sent with the card already on
  // file, so the invitation links to it instead of opening a second family card.
  const submit = async (list, chosen) => {
    const families = list.map((row, index) => {
      if (chosen[String(index)] !== 'existing') return row;
      const match = (reviews || []).find(review => review.key === String(index))?.matches[0];
      if (!match) return row;
      return {
        ...row,
        existing_family: {
          label: `${match.source} · ${match.guardian_name}${match.detail ? ` · ${match.detail}` : ''}`,
          rc_client_id: match.rc_client_id || null,
          registration_ids: match.registration_ids || [],
        },
      };
    });

    setReviews(null);
    setWorking(true);
    setResults(null);
    setProgress({ done: 0, total: families.length });

    const collected = [];
    try {
      for (let index = 0; index < families.length; index += CHUNK_SIZE) {
        const slice = families.slice(index, index + CHUNK_SIZE);
        setProgress({ done: index, total: families.length });
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
      setProgress({ done: families.length, total: families.length });
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
        ) : central ? (
          <GiftShopCentralInfoReview
            rows={rows}
            matches={central}
            included={included}
            onToggle={(key) => setIncluded(prev => ({ ...prev, [key]: !prev[key] }))}
            onConfirm={useCentralDetails}
            onSkip={skipCentralDetails}
            working={checking}
          />
        ) : reviews ? (
          <GiftShopFamilyMatchReview
            reviews={reviews}
            decisions={decisions}
            onDecide={(key, value) => setDecisions(prev => ({ ...prev, [key]: value }))}
            onConfirm={() => submit(pendingRows || rows, decisions)}
            onCancel={() => setReviews(null)}
            working={working}
            confirmLabel={`Create ${(pendingRows || rows).length} link${(pendingRows || rows).length === 1 ? '' : 's'}`}
          />
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

        {!results && !reviews && !central && (
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={working}>Cancel</Button>
            <Button onClick={create} disabled={working || checking || !rows.length}>
              {checking ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Checking the family list…</>
              ) : working ? (
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