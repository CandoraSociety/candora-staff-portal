import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DONOR_TYPES, formatMoney, formatMoneyExact, labelFor } from '@/lib/donorConstants';

export default function DonorReports() {
  const [year, setYear] = useState(String(moment().year()));

  const { data: donations = [] } = useQuery({
    queryKey: ['donations'],
    queryFn: () => base44.entities.Donation.list('-donation_date', 500),
  });
  const { data: donors = [] } = useQuery({ queryKey: ['donors'], queryFn: () => base44.entities.Donor.list('-created_date', 500) });
  const { data: campaigns = [] } = useQuery({
    queryKey: ['donation-campaigns'],
    queryFn: () => base44.entities.DonationCampaign.list('-created_date'),
  });

  const years = useMemo(() => {
    const set = new Set(donations.filter((d) => d.donation_date).map((d) => moment(d.donation_date).year()));
    set.add(moment().year());
    return Array.from(set).sort((a, b) => b - a);
  }, [donations]);

  const yearGifts = donations.filter((d) => d.donation_date && String(moment(d.donation_date).year()) === year);
  const total = yearGifts.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const receipted = yearGifts.filter((d) => d.receipt_issued).reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const uniqueDonors = new Set(yearGifts.map((d) => d.donor_id)).size;

  const byMonth = Array.from({ length: 12 }).map((_, i) => {
    const month = moment(`${year}-01-01`).month(i);
    const gifts = yearGifts.filter((d) => moment(d.donation_date).month() === i);
    return {
      month: month.format('MMM'),
      count: gifts.length,
      total: gifts.reduce((sum, d) => sum + (Number(d.amount) || 0), 0),
    };
  });

  const byType = DONOR_TYPES.map((type) => {
    const ids = new Set(donors.filter((d) => d.donor_type === type.value).map((d) => d.id));
    const gifts = yearGifts.filter((d) => ids.has(d.donor_id));
    return {
      label: type.label,
      count: gifts.length,
      total: gifts.reduce((sum, d) => sum + (Number(d.amount) || 0), 0),
    };
  }).filter((row) => row.total > 0);

  const byCampaign = [
    ...campaigns.map((c) => ({
      name: c.name,
      total: yearGifts.filter((d) => d.campaign_id === c.id).reduce((sum, d) => sum + (Number(d.amount) || 0), 0),
    })),
    {
      name: 'General giving',
      total: yearGifts.filter((d) => !d.campaign_id).reduce((sum, d) => sum + (Number(d.amount) || 0), 0),
    },
  ].filter((row) => row.total > 0).sort((a, b) => b.total - a.total);

  const topDonors = [...donors]
    .map((donor) => ({
      ...donor,
      yearTotal: yearGifts.filter((d) => d.donor_id === donor.id).reduce((sum, d) => sum + (Number(d.amount) || 0), 0),
    }))
    .filter((d) => d.yearTotal > 0)
    .sort((a, b) => b.yearTotal - a.yearTotal)
    .slice(0, 8);

  const summary = [
    { label: 'Total raised', value: formatMoney(total) },
    { label: 'Gifts', value: yearGifts.length },
    { label: 'Donors giving', value: uniqueDonors },
    { label: 'Receipted', value: formatMoney(receipted) },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Giving reports</h1>
          <p className="text-sm text-muted-foreground">Year-end picture for board reports and auditors</p>
        </div>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</div>
              <div className="text-xl font-bold mt-1">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Month by month</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Gifts</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byMonth.map((row) => (
                  <TableRow key={row.month}>
                    <TableCell className="text-sm">{row.month}</TableCell>
                    <TableCell className="text-right text-sm">{row.count}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{formatMoneyExact(row.total)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell className="text-right font-semibold">{yearGifts.length}</TableCell>
                  <TableCell className="text-right font-semibold">{formatMoneyExact(total)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">By donor type</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {byType.length === 0 && <p className="text-sm text-muted-foreground">No gifts recorded this year.</p>}
              {byType.map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span>{row.label}</span>
                  <span className="font-medium">{formatMoney(row.total)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">By campaign</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {byCampaign.length === 0 && <p className="text-sm text-muted-foreground">No gifts recorded this year.</p>}
              {byCampaign.map((row) => (
                <div key={row.name} className="flex items-center justify-between text-sm">
                  <span>{row.name}</span>
                  <span className="font-medium">{formatMoney(row.total)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Top donors in {year}</CardTitle></CardHeader>
        <CardContent className="p-0">
          {topDonors.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">No gifts recorded this year.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Donor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">This year</TableHead>
                  <TableHead className="text-right">Lifetime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topDonors.map((donor) => (
                  <TableRow key={donor.id}>
                    <TableCell className="text-sm font-medium">
                      {[donor.first_name, donor.last_name].filter(Boolean).join(' ') || donor.organization}
                    </TableCell>
                    <TableCell className="text-sm">{labelFor(DONOR_TYPES, donor.donor_type)}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{formatMoney(donor.yearTotal)}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{formatMoney(donor.total_donated)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}