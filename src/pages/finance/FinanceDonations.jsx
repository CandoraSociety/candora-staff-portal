import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Gift, Target } from 'lucide-react';
import DonationsTable, { donationMoney } from '@/components/finance/DonationsTable';
import FundraisingSources from '@/components/finance/FundraisingSources';

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

  const rows = totals?.rows || [];

  const totalRaised = rows.reduce((sum, r) => sum + (Number(r.sum_amount) || 0), 0);
  const totalGifts = rows.reduce((sum, r) => sum + (Number(r.count) || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" /> Donations &amp; Fundraising
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every gift recorded in the donor portal, and fundraising income tracked separately.
        </p>
      </div>

      <Tabs defaultValue="donations" className="w-full">
        <TabsList>
          <TabsTrigger value="donations" className="flex items-center gap-2">
            <Gift className="h-4 w-4" /> Donations
          </TabsTrigger>
          <TabsTrigger value="fundraising" className="flex items-center gap-2">
            <Target className="h-4 w-4" /> Fundraising
          </TabsTrigger>
        </TabsList>

        <TabsContent value="donations" className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat label="Total raised" value={donationMoney(totalRaised)} hint="All campaigns, all time" icon={Heart} />
            <Stat label="Gifts received" value={totalGifts} hint="Donations recorded" icon={Gift} />
          </div>
          <DonationsTable />
        </TabsContent>

        <TabsContent value="fundraising" className="mt-4">
          <FundraisingSources />
        </TabsContent>
      </Tabs>
    </div>
  );
}