import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Mail, MessageSquare, Plus, Send, ShieldCheck } from 'lucide-react';
import GiftShopInviteDialog from '@/components/winterwonderland/GiftShopInviteDialog';
import GiftShopInviteSendDialog from '@/components/winterwonderland/GiftShopInviteSendDialog';
import GiftShopEmailInvitesDialog from '@/components/winterwonderland/GiftShopEmailInvitesDialog';
import GiftShopMessageDialog from '@/components/winterwonderland/GiftShopMessageDialog';
import GiftShopInviteRow from '@/components/winterwonderland/GiftShopInviteRow';
import GiftShopSearchInput from '@/components/winterwonderland/GiftShopSearchInput';
import { inviteLink, inviteDisplayStatus, familyMessageKey, INVITE_STATUS_META } from '@/lib/giftShopInvites';
import { filterInvites } from '@/lib/giftShopSearch';

// Pre-registration tab — private, single-use links for the families invited
// before the general public. A forwarded link cannot be used, because the
// family has to confirm the email or phone it was sent to.
export default function GiftShopPreRegistration() {
  const qc = useQueryClient();
  const [singleOpen, setSingleOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [query, setQuery] = useState('');

  const { data: invites = [], isLoading } = useQuery({
    queryKey: ['giftShopInvites'],
    queryFn: () => base44.entities.GiftShopInvite.list('-created_date', 500),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['giftShopMessages'],
    queryFn: () => base44.entities.GiftShopMessage.list('-sent_at', 500),
  });

  // Each family's message history, oldest first, for the card's Messages button.
  const messagesByFamily = messages.reduce((acc, message) => {
    if (!message.family_key) return acc;
    (acc[message.family_key] = acc[message.family_key] || []).push(message);
    return acc;
  }, {});
  Object.values(messagesByFamily).forEach(list => list.sort((a, b) => new Date(a.sent_at || 0) - new Date(b.sent_at || 0)));

  // The invited families as the message dialog knows them — one row per
  // invitation listed on this tab, with its link status, so a message can go to
  // everyone, one status, or chosen families.
  const messageFamilies = invites
    .map(invite => {
      const status = inviteDisplayStatus(invite);
      return {
        id: invite.id,
        family_key: familyMessageKey(invite),
        guardian_name: invite.guardian_name || '',
        guardian_email: invite.guardian_email || '',
        guardian_phone: invite.guardian_phone || '',
        group: status,
        label: INVITE_STATUS_META[status]?.label || status,
        excluded_from_all: status === 'revoked',
      };
    })
    .filter(family => family.family_key);

  const openInvites = invites.filter(i => inviteDisplayStatus(i) === 'invited');
  const visible = filterInvites(invites, query);
  const registered = visible
    .filter(i => i.status === 'registered')
    .sort((a, b) => new Date(b.used_at || b.created_date || 0) - new Date(a.used_at || a.created_date || 0));
  const waiting = visible
    .filter(i => ['invited', 'expired'].includes(inviteDisplayStatus(i)))
    .sort((a, b) => {
      const rank = (i) => (inviteDisplayStatus(i) === 'invited' ? 0 : 1);
      return rank(a) - rank(b) || (a.guardian_name || '').localeCompare(b.guardian_name || '');
    });
  const cancelled = visible
    .filter(i => inviteDisplayStatus(i) === 'revoked')
    .sort((a, b) => new Date(b.updated_date || b.created_date || 0) - new Date(a.updated_date || a.created_date || 0));

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['giftShopInvites'] });
    qc.invalidateQueries({ queryKey: ['giftShopMessages'] });
  };

  const downloadLinks = () => {
    const header = 'Guardian,Email,Phone,Link';
    const lines = openInvites.map(i => [
      i.guardian_name || '',
      i.guardian_email || '',
      i.guardian_phone || '',
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
      <Card className="border-accent/25 bg-gradient-to-br from-accent/10 via-card to-card">
        <CardContent className="pt-5 space-y-2">
          <div className="flex items-start gap-2">
            <span className="h-6 w-6 rounded-md bg-gradient-to-br from-accent to-highlight flex items-center justify-center flex-shrink-0 shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-white" />
            </span>
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
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEmailOpen(true)}
              disabled={!openInvites.some(i => i.guardian_email || i.guardian_phone)}
            >
              <Mail className="h-4 w-4" /> Send invitations
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMessageOpen(true)}
              disabled={!invites.some(i => i.guardian_email || i.guardian_phone)}
            >
              <MessageSquare className="h-4 w-4" /> Send message
            </Button>
            <Button size="sm" variant="outline" onClick={downloadLinks} disabled={!openInvites.length}>
              <Download className="h-4 w-4" /> Download links
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Invite a family creates their link only — use Send invitations to send it by email and text. Every link
            opens the standalone pre-registration form, which has no access to any other part of Candora 360.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-accent">Links still open</p>
            <p className="text-2xl font-bold text-accent">{openInvites.length}</p>
          </CardContent>
        </Card>
        <Card className="border-highlight/30 bg-gradient-to-br from-highlight/10 via-card to-card">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-highlight">Families registered</p>
            <p className="text-2xl font-bold text-highlight">{registered.length}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Loading invitations…</p></CardContent></Card>
      ) : invites.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">No pre-registration invitations yet.</p>
            <Button size="sm" onClick={() => setSingleOpen(true)}><Plus className="h-4 w-4" /> Invite a family</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          <GiftShopSearchInput value={query} onChange={setQuery} placeholder="Search a guardian or child name, email or phone number" />

          {query.trim() && visible.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invitation matches “{query.trim()}”.</p>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Waiting to register</h3>
                  <span className="text-xs text-muted-foreground">{waiting.length}</span>
                </div>
                {waiting.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No family is waiting to register.</p>
                ) : waiting.map(invite => (
                  <GiftShopInviteRow key={invite.id} invite={invite} messages={messagesByFamily[familyMessageKey(invite)] || []} onChanged={refresh} />
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Registered</h3>
                  <span className="text-xs text-muted-foreground">{registered.length}</span>
                </div>
                {registered.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No family has registered through a link yet.</p>
                ) : registered.map(invite => (
                  <GiftShopInviteRow key={invite.id} invite={invite} messages={messagesByFamily[familyMessageKey(invite)] || []} onChanged={refresh} />
                ))}
              </div>

              {cancelled.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Cancelled</h3>
                    <span className="text-xs text-muted-foreground">{cancelled.length}</span>
                  </div>
                  {cancelled.map(invite => (
                    <GiftShopInviteRow key={invite.id} invite={invite} messages={messagesByFamily[familyMessageKey(invite)] || []} onChanged={refresh} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <GiftShopInviteDialog open={singleOpen} onOpenChange={setSingleOpen} onSaved={refresh} />
      <GiftShopInviteSendDialog open={sendOpen} onOpenChange={setSendOpen} onSaved={refresh} />
      <GiftShopEmailInvitesDialog open={emailOpen} onOpenChange={setEmailOpen} invites={openInvites} onSent={refresh} />
      <GiftShopMessageDialog open={messageOpen} onOpenChange={setMessageOpen} families={messageFamilies} onSent={refresh} />
    </div>
  );
}