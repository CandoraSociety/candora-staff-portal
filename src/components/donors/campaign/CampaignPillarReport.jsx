import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatMoney } from '@/lib/donorConstants';

// What each cause inside the campaign has raised, side by side with the gifts
// given to the campaign as a whole. Every row adds up to the campaign total.
export default function CampaignPillarReport({ campaign, gifts = [] }) {
  const pillars = (campaign?.pillars || []).slice().sort(
    (a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0)
  );

  const total = gifts.reduce((sum, gift) => sum + (Number(gift.amount) || 0), 0);

  const rows = [
    ...pillars.map((pillar) => {
      const matching = gifts.filter((gift) => gift.pillar_id === pillar.id);
      const raised = matching.reduce((sum, gift) => sum + (Number(gift.amount) || 0), 0);
      return {
        id: pillar.id,
        name: pillar.name,
        goal: Number(pillar.goal_amount) || 0,
        raised,
        count: matching.length,
      };
    }),
    (() => {
      const matching = gifts.filter((gift) => !gift.pillar_id);
      return {
        id: 'whole',
        name: pillars.length ? 'Whole campaign' : 'All gifts',
        goal: 0,
        raised: matching.reduce((sum, gift) => sum + (Number(gift.amount) || 0), 0),
        count: matching.length,
      };
    })(),
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Campaign total</p>
        <p className="text-2xl font-display font-bold">{formatMoney(total)}</p>
        <p className="text-sm text-muted-foreground">
          {gifts.length} gifts across {rows.filter((row) => row.count > 0).length} of {rows.length} causes
        </p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          {rows.map((row) => {
            const share = total > 0 ? Math.round((row.raised / total) * 100) : 0;
            return (
              <div key={row.id} className="space-y-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">{row.name}</span>
                  <span className="text-muted-foreground">
                    {formatMoney(row.raised)}
                    {row.goal > 0 && ` of ${formatMoney(row.goal)}`} · {row.count} gifts · {share}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${share}%` }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Totals come from the gifts recorded against this campaign — the same records that feed donor
        history, receipts and financial reporting.
      </p>
    </div>
  );
}