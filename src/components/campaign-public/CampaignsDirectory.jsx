import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart } from 'lucide-react';
import { formatMoney, tierAmountLabel } from '@/lib/donorConstants';

// The campaigns tab of the general donation page: every appeal that is still
// open, with the giving options it offers and a way into its own page.
export default function CampaignsDirectory({ campaigns = [] }) {
  if (campaigns.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-10 text-center space-y-2">
        <Heart className="w-6 h-6 mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No campaigns are open right now — a gift to the general fund still helps.</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-5">
      {campaigns.map((campaign) => {
        const goal = Number(campaign.goal_amount) || 0;
        const pct = goal ? Math.min(100, Math.round((Number(campaign.raised) / goal) * 100)) : 0;

        return (
          <div key={campaign.id} className="rounded-2xl border bg-card overflow-hidden flex flex-col">
            {campaign.hero_image_url ? (
              <img src={campaign.hero_image_url} alt="" className="h-36 w-full object-cover" />
            ) : (
              <div className="h-24 w-full bg-sidebar" />
            )}

            <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col">
              <div>
                <h3 className="font-display font-bold text-lg leading-tight">{campaign.name}</h3>
                {campaign.tagline && (
                  <p className="text-sm text-muted-foreground mt-1">{campaign.tagline}</p>
                )}
              </div>

              <div>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-semibold">{formatMoney(campaign.raised)} raised</span>
                  {goal > 0 && <span className="text-muted-foreground">of {formatMoney(goal)}</span>}
                </div>
                <div className="h-2 mt-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>

              {campaign.donation_products?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {campaign.donation_products.map((option) => (
                    <span key={option.id}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-2.5 py-1 text-xs">
                      <span>{option.name}</span>
                      <span className="font-semibold">{tierAmountLabel(option)}</span>
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-auto pt-1">
                <Link
                  to={`/campaign/${campaign.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Give to this campaign <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}