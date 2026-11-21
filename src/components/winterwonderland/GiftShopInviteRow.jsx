import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Check, Copy, Ban, Database } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { inviteLink, inviteDisplayStatus, INVITE_STATUS_META } from '@/lib/giftShopInvites';
import { KIDS_GIFT_SHOP_TIME_SLOTS } from '@/lib/centralRegConstants';

const slotText = (value) => KIDS_GIFT_SHOP_TIME_SLOTS.find(s => s.value === value)?.label || value || '';

// One invitation in the staff list — its status, who it is for, and the actions
// staff need: copy the private link, or cancel it.
export default function GiftShopInviteRow({ invite, onChanged }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const status = inviteDisplayStatus(invite);
  const meta = INVITE_STATUS_META[status] || INVITE_STATUS_META.invited;
  const open = status === 'invited';

  const copy = async () => {
    await navigator.clipboard.writeText(inviteLink(invite.token));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const revoke = async () => {
    try {
      await base44.entities.GiftShopInvite.update(invite.id, { status: 'revoked' });
      toast({ title: 'Invitation cancelled', description: 'The link no longer works.' });
      onChanged?.();
    } catch (err) {
      toast({ title: 'Error cancelling invitation', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="rounded-lg border px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{invite.guardian_name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {[invite.guardian_email, invite.guardian_phone].filter(Boolean).join(' · ') || 'No contact details'}
            {' · '}
            {invite.children_allowed || 3} {Number(invite.children_allowed) === 1 ? 'child' : 'children'}
          </p>
          {status === 'registered' && invite.registered_summary && (
            <p className="text-xs text-green-700 mt-0.5">
              {invite.registered_summary}
              {invite.time_slot ? ` · ${slotText(invite.time_slot)}` : ''}
            </p>
          )}
          {invite.rc_client_id && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Database className="h-3 w-3 flex-shrink-0" />
              {invite.central_db_status === 'created'
                ? 'New Central Database file opened'
                : 'Linked to their Central Database file'}
            </p>
          )}
          {open && invite.expires_at && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Expires {new Date(invite.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${meta.className}`}>{meta.label}</span>
      </div>

      {open && (
        <div className="flex items-center gap-2 mt-2">
          <Button size="sm" variant="outline" onClick={copy}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy link'}
          </Button>
          <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={revoke}>
            <Ban className="h-3.5 w-3.5" /> Cancel
          </Button>
        </div>
      )}
    </div>
  );
}