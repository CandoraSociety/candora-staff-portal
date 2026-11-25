import React from 'react';
import { Heart } from 'lucide-react';
import CampaignDonate from '@/components/campaign-public/CampaignDonate';

export default function GeneralDonationContent({ general, gift }) {
  if (gift === 'success') return (
    <div className="rounded-2xl border bg-card p-8 text-center space-y-3 max-w-md mx-auto">
      <div className="h-14 w-14 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto">
        <Heart className="w-7 h-7" />
      </div>
      <h2 className="font-display font-bold text-lg">Thank you for your gift</h2>
      <p className="text-sm text-muted-foreground">
        {general?.thank_you_message || 'Your gift has been received — thank you for standing with us.'}
      </p>
      <a className="text-sm underline inline-block" href="/donate?tab=general">Give again</a>
    </div>
  );
  if (!general) return (
    <div className="rounded-2xl border bg-card p-10 text-center space-y-2">
      <Heart className="w-6 h-6 mx-auto text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        General giving isn't set up yet. Please check the campaigns tab, or contact us to give.
      </p>
    </div>
  );
  return (
    <div className="grid gap-8 lg:gap-14 lg:grid-cols-[minmax(0,1.75fr)_minmax(340px,1fr)] lg:items-start">
      <article className="space-y-4">
        {general.description && <p className="text-lg text-foreground/90 leading-relaxed">{general.description}</p>}
        <div className="rounded-xl border bg-card p-4">
          <p className="text-2xl font-display font-bold">100%</p>
          <p className="text-sm text-muted-foreground">of every gift goes to the work</p>
        </div>
        {gift === 'cancelled' && (
          <p className="text-sm rounded-lg border bg-card px-3 py-2 text-muted-foreground">
            Your gift wasn't completed — nothing was charged.
          </p>
        )}
      </article>
      <div className="lg:sticky lg:top-6">
        <CampaignDonate campaign={general} heading="Give today"
          subheading="Choose an amount, or give one of your own." returnPath="/donate" />
      </div>
    </div>
  );
}