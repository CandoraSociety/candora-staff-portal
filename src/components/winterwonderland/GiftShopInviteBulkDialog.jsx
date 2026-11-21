import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { newInviteToken, defaultExpiryDate, parseInviteLines } from '@/lib/giftShopInvites';

// Creates a private invitation for each family in a pasted list — the fastest
// way to reach a large pre-registration group.
export default function GiftShopInviteBulkDialog({ open, onOpenChange, onSaved }) {
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [expiryDate, setExpiryDate] = useState(defaultExpiryDate());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setText('');
      setExpiryDate(defaultExpiryDate());
      setSaving(false);
    }
  }, [open]);

  const rows = parseInviteLines(text);

  const save = async () => {
    if (!rows.length) {
      return toast({ title: 'Nothing to import', description: 'Add at least one line with a name and an email or phone.', variant: 'destructive' });
    }
    setSaving(true);
    try {
      const me = await base44.auth.me().catch(() => null);
      const expiresAt = new Date(`${expiryDate}T23:59:59`).toISOString();
      await base44.entities.GiftShopInvite.bulkCreate(rows.map(row => ({
        token: newInviteToken(),
        guardian_name: row.guardian_name,
        guardian_email: row.guardian_email,
        guardian_phone: row.guardian_phone,
        children_allowed: row.children_allowed,
        status: 'invited',
        expires_at: expiresAt,
        sent_via: 'other',
        created_by_name: me?.full_name || '',
      })));
      toast({ title: `${rows.length} invitation${rows.length === 1 ? '' : 's'} created`, description: 'Download the list to send each family their own link.' });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Error creating invitations', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add a list of families</DialogTitle>
          <DialogDescription>
            One family per line: name, email, phone, number of children. At least one contact detail is needed for each.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Textarea
            rows={9}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={'Name, Email, Phone, Children\nJane Doe, jane@example.com, 780-555-1234, 2\nJohn Smith, , 780-555-9876, 1'}
            className="font-mono text-xs"
          />
          <div className="flex items-end justify-between gap-3">
            <div className="space-y-1.5">
              <Label>Link expires</Label>
              <Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
            </div>
            <p className="text-sm text-muted-foreground pb-2">
              {rows.length ? `${rows.length} ready to invite` : 'No valid lines yet'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !rows.length}>
            {saving ? 'Creating…' : `Create ${rows.length || ''} invitation${rows.length === 1 ? '' : 's'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}