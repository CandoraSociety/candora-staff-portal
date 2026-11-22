import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Pencil, Printer, CheckCircle2 } from 'lucide-react';
import { giftShopChildFullName, giftShopSlotLabel, giftShopTagGifts } from '@/lib/giftShopFamilies';
import GiftShopRegistrationEditDialog from './GiftShopRegistrationEditDialog';
import GiftShopNameTagSheet from './GiftShopNameTagSheet';

// Opened by tapping a registration card: sign each child in as they arrive and
// hand them their name tag, or edit the registration.
export default function GiftShopCheckInDialog({ family, open, onOpenChange, onChanged }) {
  const { toast } = useToast();
  const [busyId, setBusyId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [tags, setTags] = useState([]);

  const children = family?.children || [];
  const pending = children.filter(c => !c.checked_in);
  const signedIn = children
    .filter(c => c.checked_in)
    .sort((a, b) => (a.check_in_sequence || 0) - (b.check_in_sequence || 0));

  const confirm = async (targets) => {
    if (!targets.length) return;
    setBusyId(targets.length > 1 ? 'all' : targets[0].id);
    try {
      // The next order number follows the last child signed in, so the tags come
      // out in the order families actually arrive.
      const all = await base44.entities.ProgramRegistration
        .filter({ program_name: 'Kids Gift Shop' }, { limit: 500 })
        .then(res => res.items || []);
      let nextSequence = all.reduce((max, r) => Math.max(max, r.check_in_sequence || 0), 0);
      const stampedAt = new Date().toISOString();
      const confirmed = [];
      for (const child of targets) {
        nextSequence += 1;
        const patch = { checked_in: true, checked_in_at: stampedAt, check_in_sequence: nextSequence };
        await base44.entities.ProgramRegistration.update(child.id, patch);
        confirmed.push({ ...child, ...patch });
      }
      setTags(confirmed);
      onChanged?.();
    } catch (err) {
      toast({ title: 'Could not confirm the sign-in', description: err.message, variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl leading-tight">
              {children.map(c => giftShopChildFullName(c)).join(' & ') || 'Registration'}
            </DialogTitle>
            <DialogDescription>
              {family ? `${giftShopSlotLabel(family.time_slot)} • ${family.guardian_name}${family.guardian_phone ? ` • ${family.guardian_phone}` : ''}` : ''}
            </DialogDescription>
          </DialogHeader>

          {signedIn.length > 1 && (
            <Button variant="outline" size="sm" className="w-full" onClick={() => setTags(signedIn)}>
              <Printer className="h-3.5 w-3.5" /> Print all {signedIn.length} name tags
            </Button>
          )}

          <div className="space-y-2">
            {children.map(child => (
              <div key={child.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display font-bold text-base leading-tight flex items-center gap-2">
                      <span className="truncate">{giftShopChildFullName(child)}</span>
                      {child.checked_in && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-600 text-white flex-shrink-0">
                          #{child.check_in_sequence}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Age {child.child_age_band || '—'} • {giftShopTagGifts(child)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs flex-shrink-0"
                    onClick={() => setEditing(child)}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  {child.checked_in ? (
                    <>
                      <span className="text-xs text-green-700 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Signed in
                      </span>
                      <Button size="sm" variant="outline" onClick={() => setTags([child])}>
                        <Printer className="h-3.5 w-3.5" /> Reprint tag
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-muted-foreground">Not signed in yet</span>
                      <Button size="sm" onClick={() => confirm([child])} disabled={!!busyId}>
                        {busyId === child.id ? 'Confirming…' : 'Confirm sign-in'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {pending.length > 1 && (
            <Button className="w-full" onClick={() => confirm(pending)} disabled={!!busyId}>
              {busyId === 'all' ? 'Confirming…' : `Confirm all ${pending.length} children`}
            </Button>
          )}
        </DialogContent>
      </Dialog>

      <GiftShopRegistrationEditDialog
        registration={editing}
        open={!!editing}
        onOpenChange={(o) => { if (!o) setEditing(null); }}
        onSaved={onChanged}
      />

      <GiftShopNameTagSheet tags={tags} onClose={() => setTags([])} />
    </>
  );
}