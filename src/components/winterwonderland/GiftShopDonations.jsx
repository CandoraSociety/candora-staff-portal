import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CAMPAIGN_NAME = 'Bring Joy, Hope & Belonging This Christmas';
const PILLAR_ID = 'joy';

const money = (value) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(Number(value) || 0);

const when = (value) => {
  if (!value) return '';
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch {
    return '';
  }
};

// Gifts given to the Kids Gift Shop pillar, shown as they arrive. New gifts appear
// on their own — nothing to refresh.
export default function GiftShopDonations() {
  const qc = useQueryClient();

  const { data: campaigns } = useQuery({
    queryKey: ['giftShopDonationCampaign'],
    queryFn: () => base44.entities.DonationCampaign.filter({ name: CAMPAIGN_NAME }, { limit: 1 }),
  });
  const campaign = campaigns?.items?.[0];
  const query = campaign ? { campaign_id: campaign.id, pillar_id: PILLAR_ID } : null;

  const { data: gifts, isLoading } = useQuery({
    queryKey: ['giftShopDonations', campaign?.id],
    queryFn: () => base44.entities.Donation.filter(query, { sort: '-created_date', limit: 50 }),
    enabled: !!query,
  });

  const { data: totals } = useQuery({
    queryKey: ['giftShopDonationTotals', campaign?.id],
    queryFn: () => base44.entities.Donation.aggregate({ query, sum: ['amount'] }),
    enabled: !!query,
  });

  useEffect(() => {
    const unsubscribe = base44.entities.Donation.subscribe(() => {
      qc.invalidateQueries({ queryKey: ['giftShopDonations'] });
      qc.invalidateQueries({ queryKey: ['giftShopDonationTotals'] });
    });
    return unsubscribe;
  }, [qc]);

  const rows = gifts?.items || [];
  const summary = totals?.rows?.[0] || {};
  const raised = Number(summary.sum_amount) || 0;
  const count = Number(summary.count) || 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Given to the Kids Gift Shop</p>
            <p className="text-3xl font-display font-bold mt-1">{money(raised)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Gifts received</p>
            <p className="text-3xl font-display font-bold mt-1">{count}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Gifts as they come in</CardTitle>
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live
          </span>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Loading gifts…</p>
          ) : rows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No gifts to the Kids Gift Shop yet.</p>
            </div>
          ) : (
            <div className="divide-y">
              {rows.map((gift) => (
                <div key={gift.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Gift className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {gift.is_anonymous ? 'Anonymous supporter' : gift.donor_name || 'Supporter'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {gift.product_name || 'Gift'}
                        {gift.variation_label ? ` · ${gift.variation_label}` : ''} · {when(gift.created_date)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold whitespace-nowrap">{money(gift.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}