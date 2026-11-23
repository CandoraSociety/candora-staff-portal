import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCheck, CheckCircle2, Gift, Loader2, MessageSquare, ShoppingBag } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import GiftShopTextThreadDialog from '@/components/winterwonderland/GiftShopTextThreadDialog';
import { lastReply, lastTextSent, normalizeSmsPhone, unreadReplies } from '@/lib/giftShopTexts';
import { giftShopChildFirstName, giftShopChildFullName, giftShopFamilyCompleted, giftShopFamilyShopping, giftShopIsCompleted, giftShopIsShopping, giftShopElfName, giftShopSlotLabel, giftShopTagGifts } from '@/lib/giftShopFamilies';

const statusPill = (status) => {
  if (['approved', 'enrolled'].includes(status)) return { label: 'Confirmed', className: 'bg-green-100 text-green-700' };
  if (status === 'waitlisted') return { label: 'Waitlist', className: 'bg-amber-100 text-amber-700' };
  return { label: status, className: 'bg-muted text-muted-foreground' };
};

// One registration card per family: the children's names lead, the guardian sits
// underneath. Clicking it opens sign-in and editing for that family.
export default function GiftShopFamilyCard({ family, onClick, texts = [], onTextsChanged }) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [threadOpen, setThreadOpen] = useState(false);
  const waitlisted = family.children.some(c => c.status === 'waitlisted');
  // The family's latest reply stays on the card after it is opened, and reads as
  // a new message only while the desk has not opened it yet.
  const reply = lastReply(texts, family.guardian_phone);
  const unread = unreadReplies(texts, family.guardian_phone).length > 0;
  const textedAt = lastTextSent(texts, family.guardian_phone)?.sent_at;
  // An elf closed the children out from the tag form: they finished shopping and
  // went back to their parent or guardian.
  const done = giftShopFamilyCompleted(family);
  // An elf pressed Begin shopping on the tag form, so the children are out on the
  // floor with them.
  const shopping = !done && giftShopFamilyShopping(family);
  const elfName = family.children.map(giftShopElfName).find(Boolean) || '';
  const pill = done
    ? { label: 'Completed', className: 'bg-accent/10 text-accent' }
    : shopping
      ? { label: 'Shopping', className: 'bg-highlight/15 text-highlight' }
      : statusPill(waitlisted ? 'waitlisted' : family.children[0].status);
  const allSignedIn = family.children.every(c => c.checked_in);
  // A family only reads as completed once every child is back, so show how many
  // are already returned while one is still shopping.
  const returnedCount = family.children.filter(giftShopIsCompleted).length;
  // A family who has signed in but is not shopping yet can be texted to come to
  // the desk as their turn approaches.
  const canText = allSignedIn && !done && !shopping && !!family.guardian_phone;

  const textFamily = async (event) => {
    event.stopPropagation();
    setSending(true);
    try {
      const names = family.children.map(giftShopChildFirstName);
      const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
      const first = (family.guardian_name || '').trim().split(/\s+/)[0];
      const body = `Hi ${first || 'there'}, Candora Kids Gift Shop here. Please bring ${list} to the check-in desk now. Your turn to shop is coming up.`;
      const res = await base44.functions.invoke('sendSms', { to: family.guardian_phone, body });
      if (res.data?.error) throw new Error(res.data.error);
      await base44.entities.GiftShopText.create({
        phone: normalizeSmsPhone(family.guardian_phone),
        direction: 'out',
        body,
        guardian_name: family.guardian_name,
        sent_at: new Date().toISOString(),
        staff_name: res.data?.sent_by || '',
        twilio_sid: res.data?.sid || '',
      });
      onTextsChanged?.();
      toast({ title: 'Text sent', description: `${family.guardian_name} was asked to come to the desk.` });
    } catch (err) {
      toast({ title: 'Could not send the text', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
      className={`cursor-pointer border-l-4 transition-all hover:shadow-md ${
        done
          ? 'border-l-accent border-accent/25 bg-gradient-to-br from-accent/10 via-card to-card hover:border-accent/50'
          : allSignedIn
          ? 'border-l-highlight border-highlight/25 bg-gradient-to-br from-highlight/10 via-card to-card hover:border-highlight/50'
          : waitlisted
            ? 'border-l-muted-foreground/40 border-border bg-gradient-to-br from-muted/60 via-card to-card hover:border-muted-foreground/40'
            : 'border-l-primary border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card hover:border-primary/60'
      }`}
    >
      <CardContent className="pt-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            {family.children.map(child => (
              <div key={child.id}>
                <p className="font-display font-bold text-base leading-tight flex items-center gap-2">
                  <span className="truncate">{giftShopChildFullName(child)}</span>
                  {child.checked_in && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-600 text-white flex-shrink-0">
                      #{child.check_in_sequence}
                    </span>
                  )}
                  {giftShopIsShopping(child) && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-highlight/15 text-highlight flex-shrink-0">
                      Shopping
                    </span>
                  )}
                  {giftShopIsCompleted(child) && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent/15 text-accent flex-shrink-0">
                      Returned
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Age {child.child_age_band || '—'} • {giftShopTagGifts(child)}
                </p>
              </div>
            ))}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${pill.className}`}>{pill.label}</span>
        </div>
        <div className="border-t pt-2 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground truncate">
            {giftShopSlotLabel(family.time_slot)} • {family.guardian_name}
            {family.guardian_phone ? ` • ${family.guardian_phone}` : ''}
          </p>
          {done ? (
            <span className="text-[10px] font-semibold text-accent flex items-center gap-1 flex-shrink-0">
              <Gift className="h-3 w-3" /> Returned{elfName ? ` · ${elfName}` : ''}
            </span>
          ) : returnedCount > 0 ? (
            <span className="text-[10px] font-semibold text-accent flex items-center gap-1 flex-shrink-0">
              <Gift className="h-3 w-3" /> {returnedCount} of {family.children.length} returned
            </span>
          ) : shopping ? (
            <span className="text-[10px] font-semibold text-highlight flex items-center gap-1 flex-shrink-0">
              <ShoppingBag className="h-3 w-3" /> Out shopping{elfName ? ` · ${elfName}` : ''}
            </span>
          ) : allSignedIn ? (
            <span className="flex flex-shrink-0 items-center gap-2">
              <span className="text-[10px] font-semibold text-green-700 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Checked In
              </span>
              {canText && (
                <Button
                  size="sm"
                  onClick={textFamily}
                  disabled={sending}
                  className="h-7 gap-1 bg-green-600 px-2 text-[11px] text-white hover:bg-green-700"
                >
                  {sending
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : textedAt
                      ? <CheckCheck className="h-3 w-3" />
                      : <MessageSquare className="h-3 w-3" />}
                  {sending ? 'Sending…' : textedAt ? 'Texted' : 'Text to come up'}
                </Button>
              )}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground flex-shrink-0">Tap to sign in</span>
          )}
        </div>

        {reply && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setThreadOpen(true); }}
            className={`mt-2 flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors ${
              unread
                ? 'border-red-600/40 bg-red-50 hover:bg-red-100'
                : 'border-border bg-muted/50 hover:bg-muted'
            }`}
          >
            <span className={`h-2 w-2 flex-shrink-0 rounded-full ${unread ? 'bg-red-600' : 'bg-muted-foreground/40'}`} />
            <span className={`flex-shrink-0 text-[11px] font-bold ${unread ? 'text-red-700' : 'text-muted-foreground'}`}>
              {unread ? 'New message' : 'Reply'}
            </span>
            <span className={`truncate text-[11px] ${unread ? 'text-red-700/70' : 'text-muted-foreground'}`}>{reply.body}</span>
          </button>
        )}
      </CardContent>

      {/* The card itself opens sign-in on click, so the dialog stops its own clicks. */}
      <div onClick={(e) => e.stopPropagation()}>
        <GiftShopTextThreadDialog
          open={threadOpen}
          onOpenChange={setThreadOpen}
          family={family}
          texts={texts}
          onRead={onTextsChanged}
        />
      </div>
    </Card>
  );
}