import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Asked as a child is signed in: the name of the adult who is with them. It is
// filled in with the registered guardian, and whatever is typed here prints on
// the name tag and is saved on the registration.
export default function GiftShopSignInNameDialog({ open, suggestedName, childCount, busy, onConfirm, onCancel }) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) setName(suggestedName || '');
  }, [open, suggestedName]);

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onConfirm(name.trim());
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="z-[10050] max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Who is with the child?</DialogTitle>
          <DialogDescription>
            This name prints on the {childCount === 1 ? 'name tag' : `${childCount} name tags`} as the parent or guardian.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="giftshop-guardian-name">Parent or guardian’s name</Label>
            <Input
              id="giftshop-guardian-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Cardinal"
              autoComplete="name"
              autoFocus
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !name.trim()}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}