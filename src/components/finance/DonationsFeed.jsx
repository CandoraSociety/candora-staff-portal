import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const donationMoney = (value) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(Number(value) || 0);

const when = (value) => {
  if (!value) return '';
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch {
    return '';
  }
};

// Every gift as it is recorded, newest first — new gifts appear on their own.
export default function DonationsFeed() {
  const qc = useQueryClient();

  const { data: gifts, isLoading } = useQuery({
    queryKey: ['finance-donation-feed'],
    queryFn: () => base44.entities.Donation.list({ sort: '-created_date', limit: 50 }),
  });

  useEffect(() => {
    const unsubscribe = base44.entities.Donation.subscribe(() => {
      qc.invalidateQueries({ queryKey: ['finance-donation-feed'] });
      qc.invalidateQueries({ queryKey: ['finance-donation-totals'] });
    });
    return unsubscribe;
  }, [qc]);

  const rows = gifts?.items || [];

  return (
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
          <p className="text-sm text-muted-foreground text-center py-8">No donations recorded yet.</p>
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
                      {[gift.campaign_name || 'General Fund', gift.pillar_name, gift.product_name]
                        .filter(Boolean)
                        .join(' · ')}
                      {' · '}
                      {when(gift.created_date)}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-semibold whitespace-nowrap">{donationMoney(gift.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}