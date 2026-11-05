import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, HandCoins, Target, TrendingUp, ArrowRight } from 'lucide-react';
import { GIVING_LEVELS, formatMoney, formatMoneyExact } from '@/lib/donorConstants';

const Stat = ({ label, value, icon: Icon, hint }) => (
  <Card>
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="mt-2 text-2xl font-bold font-display">{value}</div>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </CardContent>
  </Card>
);

export default function DonorsDashboard() {
  const { data: donors = [] } = useQuery({ queryKey: ['donors'], queryFn: () => base44.entities.Donor.list('-created_date', 500) });
  const { data: donations = [] } = useQuery({ queryKey: ['donations'], queryFn: () => base44.entities.Donation.list('-donation_date', 500) });
  const { data: campaigns = [] } = useQuery({ queryKey: ['donation-campaigns'], queryFn: () => base44.entities.DonationCampaign.list('-created_date') });

  const year = moment().year();
  const totalRaised = donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const ytd = donations
    .filter((d) => d.donation_date && moment(d.donation_date).year() === year)
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const thisMonth = donations
    .filter((d) => d.donation_date && moment(d.donation_date).isSame(moment(), 'month'))
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const activeDonors = donors.filter((d) => d.last_donation_date && moment(d.last_donation_date).isAfter(moment().subtract(12, 'months'))).length;

  const monthly = Array.from({ length: 12 }).map((_, i) => {
    const month = moment().subtract(11 - i, 'months');
    const total = donations
      .filter((d) => d.donation_date && moment(d.donation_date).isSame(month, 'month'))
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    return { month: month.format('MMM'), total };
  });

  const topDonors = [...donors].sort((a, b) => (b.total_donated || 0) - (a.total_donated || 0)).slice(0, 5);
  const recent = donations.slice(0, 6);
  const activeCampaigns = campaigns.filter((c) => c.is_active);

  const levelCounts = Object.keys(GIVING_LEVELS).map((level) => ({
    level,
    count: donors.filter((d) => d.giving_level === level).length,
  })).filter((row) => row.count > 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Donor Management</h1>
        <p className="text-sm text-muted-foreground">Giving at a glance across every appeal</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Raised this year" value={formatMoney(ytd)} icon={TrendingUp} hint={`${year} to date`} />
        <Stat label="This month" value={formatMoney(thisMonth)} icon={HandCoins} hint={moment().format('MMMM')} />
        <Stat label="Donors" value={donors.length} icon={Users} hint={`${activeDonors} gave in the last 12 months`} />
        <Stat label="All-time giving" value={formatMoney(totalRaised)} icon={Target} hint={`${donations.length} gifts recorded`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Giving by month</CardTitle></CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `$${v >= 1000 ? `${v / 1000}k` : v}`} />
                  <Tooltip formatter={(v) => formatMoneyExact(v)} />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Donor pipeline</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {levelCounts.length === 0 && <p className="text-sm text-muted-foreground">No donors yet.</p>}
            {levelCounts.map(({ level, count }) => (
              <div key={level} className="flex items-center justify-between">
                <Badge className={GIVING_LEVELS[level].className}>{GIVING_LEVELS[level].label}</Badge>
                <span className="text-sm font-medium">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Top donors</CardTitle>
            <Link to="/donors/list" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              All donors <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {topDonors.length === 0 && <p className="text-sm text-muted-foreground">Add your first donor to get started.</p>}
            {topDonors.map((d) => (
              <Link key={d.id} to={`/donors/${d.id}`} className="flex items-center justify-between gap-3 rounded-lg p-2 -mx-2 hover:bg-muted">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {[d.first_name, d.last_name].filter(Boolean).join(' ') || d.organization}
                  </div>
                  {d.organization && d.first_name && <div className="text-xs text-muted-foreground truncate">{d.organization}</div>}
                </div>
                <span className="text-sm font-semibold whitespace-nowrap">{formatMoney(d.total_donated)}</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Recent gifts</CardTitle>
            <Link to="/donors/donations" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              All gifts <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.length === 0 && <p className="text-sm text-muted-foreground">No gifts recorded yet.</p>}
            {recent.map((gift) => (
              <div key={gift.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{gift.donor_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {gift.donation_date ? moment(gift.donation_date).format('MMM D, YYYY') : '—'}
                    {gift.campaign_name ? ` · ${gift.campaign_name}` : ''}
                  </div>
                </div>
                <span className="text-sm font-semibold whitespace-nowrap">{formatMoneyExact(gift.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Active campaigns</CardTitle>
          <Link to="/donors/campaigns" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            Manage <ArrowRight className="w-3 h-3" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeCampaigns.length === 0 && <p className="text-sm text-muted-foreground">No active campaigns.</p>}
          {activeCampaigns.slice(0, 4).map((campaign) => {
            const raised = donations
              .filter((d) => d.campaign_id === campaign.id)
              .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
            const pct = campaign.goal_amount ? Math.min(100, Math.round((raised / campaign.goal_amount) * 100)) : 0;
            return (
              <div key={campaign.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{campaign.name}</span>
                  <span className="text-muted-foreground">
                    {formatMoney(raised)}{campaign.goal_amount ? ` of ${formatMoney(campaign.goal_amount)}` : ''}
                  </span>
                </div>
                <div className="h-2 mt-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}