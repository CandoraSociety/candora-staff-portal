import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Plus, Send, ShieldCheck } from 'lucide-react';
import GiftShopInviteDialog from '@/components/winterwonderland/GiftShopInviteDialog';
import GiftShopInviteSendDialog from '@/components/winterwonderland/GiftShopInviteSendDialog';
import GiftShopInviteRow from '@/components/winterwonderland/GiftShopInviteRow';
import { inviteLink, inviteDisplayStatus } from '@/lib/giftShopInvites';

// Pre-registration tab — private, single-use links for the families invited
// before the general public. A forwarded link cannot be used, because the
// family has to confirm the email or phone it was sent to.
export default function GiftShopPreRegistration() {
  const qc = useQueryClient();
  const [singleOpen, setSingleOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);

  const { data: invites = [], isLoading } = useQuery({
    queryKey: ['giftShopInvites'],
    queryFn: () => base44.entities.GiftShopInvite.list('-created_date', 500),
  });

  const openInvites = invites.filter(i => inviteDisplayStatus(i) === 'invited');
  const registered = invites.filter(i => i.status === 'registered');
  const sorted = [...invites].sort((a, b) => {
    const rank = (i) => (inviteDisplayStatus(i) === 'invited' ? 0 : 1);
    return rank(a) - rank(b) || (a.guardian_name || '').localeCompare(b.guardian_name || '');
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['giftShopInvites'] });

  const downloadLinks = () => {
    const header = 'Guardian,Email,Phone,Children,Link';
    const lines = openInvites.map(i => [
      i.guardian_name || '',
      i.guardian_email || '',
      i.guardian_phone || '',
      i.children_allowed || 3,
      inviteLink(i.token),
    ].map(value => `"${String(value).replace(/"/g, '""')}"`).join(','));
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'kids-gift-shop-pre-registration-links.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-5 space-y-2">
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Private pre-registration links</p>
              <p className="text-sm text-muted-foreground">
                Each invited family gets their own link. It works once, closes on the date you set, and only completes for
                someone who confirms the email or phone it was sent to — so a link passed on to a friend will not register them.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button size="sm" onClick={() => setSingleOpen(true)}><Plus className="h-4 w-4" /> Invite a family</Button>
            <Button size="sm" variant="outline" onClick={() => setSendOpen(true)}><Send className="h-4 w-4" /> Upload a list &amp; send invites</Button>
            <Button size="sm" variant="outline" onClick={downloadLinks} disabled={!openInvites.length}>
              <Download className="h-4 w-4" /> Download links
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Every link opens the standalone pre-registration form, which has no access to any other part of Candora 360.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Links still open</p><p className="text-2xl font-bold">{openInvites.length}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Families registered</p><p className="text-2xl font-bold">{registered.length}</p></CardContent></Card>
      </div>

      {isLoading ? (
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Loading invitations…</p></CardContent></Card>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">No pre-registration invitations yet.</p>
            <Button size="sm" onClick={() => setSingleOpen(true)}><Plus className="h-4 w-4" /> Invite a family</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sorted.map(invite => (
            <GiftShopInviteRow key={invite.id} invite={invite} onChanged={refresh} />
          ))}
        </div>
      )}

      <GiftShopInviteDialog open={singleOpen} onOpenChange={setSingleOpen} onSaved={refresh} />
      <GiftShopInviteSendDialog open={sendOpen} onOpenChange={setSendOpen} onSaved={refresh} />
    </div>
  );
}