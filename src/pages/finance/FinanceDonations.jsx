import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Gift, Target } from 'lucide-react';
import DonationsFeed, { donationMoney } from '@/components/finance/DonationsFeed';

function Stat({ label, value, hint, icon: Icon }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Icon className="w-3 h-3" /> {label}
        </div>
        <div className="text-2xl font-bold text-foreground mt-1">{value}</div>
        {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
      </CardContent>
    </Card>
  );
}

export default function FinanceDonations() {
  const { data: totals } = useQuery({
    queryKey: ['finance-donation-totals'],
    queryFn: () => base44.entities.Donation.aggregate({ groupBy: 'campaign_id', sum: ['amount'] }),
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['finance-donation-campaigns'],
    queryFn: () => base44.entities.DonationCampaign.list(),
  });

  const rows = totals?.rows || [];
  const raisedByCampaign = new Map(rows.map((r) => [r.campaign_id, r]));

  const totalRaised = rows.reduce((sum, r) => sum + (Number(r.sum_amount) || 0), 0);
  const totalGifts = rows.reduce((sum, r) => sum + (Number(r.count) || 0), 0);

  const campaignRows = campaigns
    .map((c) => ({
      id: c.id,
      name: c.name,
      goal: Number(c.goal_amount) || 0,
      raised: Number(raisedByCampaign.get(c.id)?.sum_amount) || 0,
      gifts: Number(raisedByCampaign.get(c.id)?.count) || 0,
    }))
    .filter((c) => c.raised > 0 || c.goal > 0)
    .sort((a, b) => b.raised - a.raised);

  const activeCampaigns = campaigns.filter((c) => c.is_active && !c.is_general_fund).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" /> Donations &amp; Fundraising
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every gift recorded in the donor portal, and how each campaign is tracking against its goal.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total raised" value={donationMoney(totalRaised)} hint="All campaigns, all time" icon={Heart} />
        <Stat label="Gifts received" value={totalGifts} hint="Donations recorded" icon={Gift} />
        <Stat label="Active campaigns" value={activeCampaigns} hint="Currently fundraising" icon={Target} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaign progress</CardTitle>
        </CardHeader>
        <CardContent>
          {campaignRows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No campaigns with gifts or goals yet.</p>
          ) : (
            <div className="space-y-4">
              {campaignRows.map((c) => {
                const pct = c.goal > 0 ? Math.min(100, Math.round((c.raised / c.goal) * 100)) : null;
                return (
                  <div key={c.id} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-sm whitespace-nowrap">
                        <span className="font-semibold">{donationMoney(c.raised)}</span>
                        {c.goal > 0 && <span className="text-muted-foreground"> of {donationMoney(c.goal)}</span>}
                      </p>
                    </div>
                    {c.goal > 0 && (
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      {c.gifts} {c.gifts === 1 ? 'gift' : 'gifts'}
                      {pct !== null ? ` · ${pct}% of goal` : ''}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <DonationsFeed />
    </div>
  );
}