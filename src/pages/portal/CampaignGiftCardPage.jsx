import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Heart, Loader2, XCircle } from 'lucide-react';
import moment from 'moment';
import GiftCardDownloadButton from '@/components/campaign-public/GiftCardDownloadButton';
import { CHRISTMAS_ARTWORK } from '@/lib/christmasArtwork';
import GiftCardMessageSections from '@/components/campaign-public/GiftCardMessageSections';

const CANDORA_LOGO = 'https://media.base44.com/images/public/6a249282cb496579542673b7/6d7d8de5b7cf5f4838f9d1df98d171cc_kids-gift-shop-logo.png';

// The greeting card a supporter sent — opened by its recipient from the email,
// with no sign-in. It shows Candora's name, the card design, their message, what
// the gift makes possible, and the printable version of the card.
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

  const { card, campaign } = data;
  // The card's email links here with ?print=1 — the PDF is made and saved straight away.
  const wantsPdf = new URLSearchParams(window.location.search).get('print') === '1';
  const art = card.theme_image_url || campaign?.hero_image_url || '';
  const giftName = String(card.gift_name || '').trim();
  const giftDescription = String(card.gift_description || '').trim();

  const christmas = campaign?.seasonal_theme === 'christmas';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f29] via-[#131b3d] to-[#0a0f29] px-4 py-10">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center text-white/80 space-y-1">
          <p className="text-xs uppercase tracking-[0.25em] text-[#fccf03]">A gift in your honour</p>
          <p className="text-sm">From {card.donor_name || 'someone who cares about you'}</p>
        </div>

        <article className="rounded-3xl overflow-hidden bg-white shadow-2xl ring-2 ring-[#fccf03]">
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-b">
            <img src={CANDORA_LOGO} alt="Candora Society of Edmonton" className="h-9 w-auto" />
            <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Candora Society of Edmonton
            </span>
          </div>

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
            <div className="relative pr-12">
              <p className="font-script text-5xl leading-none text-[#0a0f29]">Merry Christmas!</p>
              <img
                src={CHRISTMAS_ARTWORK.ornament}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute -top-2 right-0 w-10 mix-blend-multiply"
              />
            </div>

            <GiftCardMessageSections
              message={card.message}
              giftWording={giftDescription}
              giftName={giftName}
              donationName={card.product_name}
              amount={card.amount}
              christmas={christmas}
            />

            <div className="rounded-xl bg-muted/60 p-4 space-y-1 text-sm">
              <p className="font-medium">{card.campaign_name}</p>
              {card.pillar_name && (
                <p className="text-muted-foreground">
                  {giftName ? `${giftName} · ${card.pillar_name}` : `Supporting ${card.pillar_name}`}
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
            </div>

            <GiftCardDownloadButton
              card={card}
              campaign={campaign}
              logoUrl={CANDORA_LOGO}
              autoStart={wantsPdf}
            />
          </div>
        </article>

        <p className="text-center text-xs text-white/50">
          Sent with care by Candora Society of Edmonton · {card.theme_name || card.campaign_name}
        </p>
      </div>
    </div>
  );
}