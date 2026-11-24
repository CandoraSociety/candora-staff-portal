import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Printer, XCircle } from 'lucide-react';
import moment from 'moment';

// A personalized certificate for a gift made in someone's honour — opened from
// the card or its email, printable on a landscape letter page.
export default function CampaignCertificatePage() {
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

  const certificate = data?.certificate;
  if (isError || !data?.card || !certificate?.enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-3 max-w-sm">
          <XCircle className="w-8 h-8 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-display font-bold">This certificate isn't available</h1>
          <p className="text-sm text-muted-foreground">
            The link may be incomplete, or this gift didn't include a certificate.
          </p>
        </div>
      </div>
    );
  }

  const { card } = data;
  const issued = card.delivered_at || card.created_date;
  const pillar = (data.campaign?.pillars || []).find((item) => item.id === card.pillar_id);
  const giftName = String(pillar?.gift_name || '').trim();
  const garland = data.campaign?.garland_horizontal_url || '';

  return (
    <div className="min-h-screen bg-muted/40 px-4 py-8">
      <style>{`
        @media print {
          @page { size: letter landscape; margin: 0.35in; }
          .certificate-actions { display: none !important; }
          .certificate-sheet { box-shadow: none !important; border-radius: 0 !important; }
          body { background: #fff !important; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto space-y-4">
        <div className="certificate-actions flex items-center justify-between gap-2">
          <Button variant="outline" asChild>
            <Link to={`/gift-card/${card.token}`}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to the card
            </Link>
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Print certificate
          </Button>
        </div>

        <div className="certificate-sheet bg-white rounded-xl shadow-lg border-4 border-[#fccf03] p-6 sm:p-10">
          {garland && (
            <img src={garland} alt="" aria-hidden="true" className="w-full h-16 object-cover object-top mb-2" />
          )}
          <div className="border border-[#0a0f29]/15 rounded-lg p-6 sm:p-10 space-y-6 text-center">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Candora Society</p>
              {giftName && (
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#0a0f29]">
                  {giftName}
                </p>
              )}
              <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0a0f29]">
                {certificate.title}
              </h1>
            </div>

            <p className="text-sm text-muted-foreground">This certificate is presented to</p>
            <p className="font-display font-extrabold text-3xl sm:text-4xl text-[#0a0f29] border-b-2 border-[#fccf03] inline-block px-6 pb-2">
              {card.recipient_name}
            </p>

            <p className="text-[15px] leading-relaxed max-w-2xl mx-auto text-foreground/85 whitespace-pre-line">
              {certificate.message ||
                `A gift has been made in your honour to ${card.campaign_name}${
                  card.pillar_name ? `, supporting ${card.pillar_name}` : ''
                }.`}
            </p>

            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
              {card.amount > 0 && (
                <span>Gift of ${Number(card.amount).toLocaleString('en-CA')}</span>
              )}
              {card.pillar_name && <span>{card.pillar_name}</span>}
              {issued && <span>{moment(issued).format('MMMM D, YYYY')}</span>}
            </div>

            <div className="pt-6 flex flex-col items-center gap-1">
              <p className="font-display font-bold text-lg text-[#0a0f29]">
                {certificate.signature || 'Candora Society'}
              </p>
              {certificate.signature_title && (
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {certificate.signature_title}
                </p>
              )}
            </div>

            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground pt-2">
              Certificate {card.token.slice(0, 12).toUpperCase()}
            </p>
          </div>
        </div>

        {data.campaign?.slug && (
          <p className="certificate-actions text-center text-sm text-muted-foreground">
            <Link to={`/campaign/${data.campaign.slug}`} className="underline">
              Learn more about {card.campaign_name}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}