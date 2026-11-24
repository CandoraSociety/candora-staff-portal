import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Check, Copy, Ban, Database, MailCheck, MessageSquare, Pencil, History, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { inviteLink, inviteDisplayStatus, newInviteToken, defaultExpiryDate, INVITE_STATUS_META } from '@/lib/giftShopInvites';
import { KIDS_GIFT_SHOP_TIME_SLOTS } from '@/lib/centralRegConstants';
import GiftShopInviteEditDialog from '@/components/winterwonderland/GiftShopInviteEditDialog';
import GiftShopMessageHistoryDialog from '@/components/winterwonderland/GiftShopMessageHistoryDialog';

const slotText = (value) => KIDS_GIFT_SHOP_TIME_SLOTS.find(s => s.value === value)?.label || value || '';

// One invitation in the staff list — its status, who it is for, and the actions
// staff need: copy the private link, or cancel it.
export default function GiftShopInviteRow({ invite, messages = [], onChanged }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
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

  // A cancelled or expired link is replaced, not reopened: the family gets a
  // fresh code and a new closing date, and the old link stays dead.
  const renew = async () => {
    try {
      await base44.entities.GiftShopInvite.update(invite.id, {
        token: newInviteToken(),
        status: 'invited',
        expires_at: new Date(`${defaultExpiryDate()}T23:59:59`).toISOString(),
        used_at: null,
        emailed_at: null,
        texted_at: null,
      });
      toast({ title: 'New link created', description: 'The old link no longer works — send the new one to the family.' });
      onChanged?.();
    } catch (err) {
      toast({ title: 'Error creating a new link', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="rounded-lg border px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{invite.guardian_name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {[invite.guardian_email, invite.guardian_phone].filter(Boolean).join(' · ') || 'No contact details'}
          </p>
          {invite.emailed_at && (
            <p className="text-xs text-blue-700 mt-0.5 flex items-center gap-1">
              <MailCheck className="h-3 w-3 flex-shrink-0" />
              Emailed {new Date(invite.emailed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          )}
          {invite.texted_at && (
            <p className="text-xs text-blue-700 mt-0.5 flex items-center gap-1">
              <MessageSquare className="h-3 w-3 flex-shrink-0" />
              Texted {new Date(invite.texted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          )}
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

      <div className="flex flex-wrap items-center gap-2 mt-2">
        {open && (
          <>
            <Button size="sm" variant="outline" onClick={copy}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy link'}
            </Button>
            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={revoke}>
              <Ban className="h-3.5 w-3.5" /> Cancel
            </Button>
          </>
        )}
        {(status === 'revoked' || status === 'expired') && (
          <Button size="sm" variant="outline" onClick={renew}>
            <RefreshCw className="h-3.5 w-3.5" /> New link
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setHistoryOpen(true)}>
          <History className="h-3.5 w-3.5" /> Messages{messages.length ? ` (${messages.length})` : ''}
        </Button>
      </div>

      <GiftShopInviteEditDialog open={editOpen} onOpenChange={setEditOpen} invite={invite} onSaved={onChanged} />
      <GiftShopMessageHistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} invite={invite} messages={messages} />
    </div>
  );
}