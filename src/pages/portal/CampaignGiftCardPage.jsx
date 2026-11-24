import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Gift, Heart, Loader2, XCircle } from 'lucide-react';
import moment from 'moment';

// The greeting card a supporter sent — opened by its recipient from the email,
// with no sign-in. It shows the card design, their message, the cause the gift
// supports, and the certificate when the campaign issues one.
export default function CampaignGiftCardPage() {
  const { token } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['campaign-gift-card', token],
    queryFn: async () => (await base44.functions.invoke('getCampaignGiftCard', { token })).data,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data?.card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-3 max-w-sm">
          <XCircle className="w-8 h-8 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-display font-bold">This card isn't available</h1>
          <p className="text-sm text-muted-foreground">
            The link may be incomplete, or the card may not have been sent yet.
          </p>
        </div>
      </div>
    );
  }

  const { card, campaign, certificate } = data;
  const art = card.theme_image_url || campaign?.hero_image_url || '';
  const pillar = (campaign?.pillars || []).find((item) => item.id === card.pillar_id);
  const giftName = String(pillar?.gift_name || '').trim();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f29] via-[#131b3d] to-[#0a0f29] px-4 py-10">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center text-white/80 space-y-1">
          <p className="text-xs uppercase tracking-[0.25em] text-[#fccf03]">A gift in your honour</p>
          <p className="text-sm">From {card.donor_name || 'someone who cares about you'}</p>
        </div>

        <article className="rounded-3xl overflow-hidden bg-white shadow-2xl ring-2 ring-[#fccf03]">
          <div className="relative h-56 sm:h-64 bg-[#0a0f29]">
            {art && <img src={art} alt="" className="absolute inset-0 h-full w-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f29]/90 via-[#0a0f29]/30 to-transparent" />
            <div className="relative h-full flex flex-col justify-end p-6 text-white">
              {giftName && (
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#fccf03]">
                  {giftName}
                </span>
              )}
              <span className="text-[11px] uppercase tracking-[0.22em] text-white/70">For</span>
              <h1 className="font-display font-extrabold text-3xl leading-tight">
                {card.recipient_name}
              </h1>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            <p className="text-[15px] leading-relaxed whitespace-pre-line italic text-foreground/90">
              {card.message || 'A gift has been made in your honour, to bring a little joy this season.'}
            </p>

            <div className="rounded-xl bg-muted/60 p-4 space-y-1 text-sm">
              <p className="font-medium">{card.campaign_name}</p>
              {card.pillar_name && (
                <p className="text-muted-foreground">
                  {giftName ? `${giftName} · ${card.pillar_name}` : `Supporting ${card.pillar_name}`}
                </p>
              )}
              {card.amount > 0 && (
                <p className="text-muted-foreground">
                  A gift of ${Number(card.amount).toLocaleString('en-CA')}
                </p>
              )}
              {card.delivered_at && (
                <p className="text-xs text-muted-foreground">
                  Delivered {moment(card.delivered_at).format('MMMM D, YYYY')}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {campaign?.slug && (
                <Link
                  to={`/campaign/${campaign.slug}`}
                  className="inline-flex items-center gap-2 rounded-md bg-[#fccf03] text-[#0a0f29] px-4 py-2.5 text-sm font-semibold hover:bg-[#e6bd03]"
                >
                  <Heart className="w-4 h-4" /> Pay it forward
                </Link>
              )}
              {certificate?.enabled && (
                <Link
                  to={`/certificate/${card.token}`}
                  className="inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium hover:bg-muted"
                >
                  <Gift className="w-4 h-4" /> Your certificate
                </Link>
              )}
            </div>
          </div>
        </article>

        <p className="text-center text-xs text-white/50">
          Sent with care by Candora Society · {card.theme_name || card.campaign_name}
        </p>
      </div>
    </div>
  );
}