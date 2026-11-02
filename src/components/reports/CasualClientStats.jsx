import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserCheck, UserX, Footprints, Building2, Globe, Search } from 'lucide-react';
import moment from 'moment';

const PERIODS = {
  all: { label: 'All time', days: null },
  month: { label: 'This month', days: 'month' },
  quarter: { label: 'Last 90 days', days: 90 },
  year: { label: 'This fiscal year', days: 'fiscal' },
};

const fiscalStart = () => {
  const now = moment();
  const start = moment().month() >= 3 ? moment().month(3).startOf('month') : moment().month(3).subtract(1, 'year').startOf('month');
  return start.isAfter(now) ? start.subtract(1, 'year') : start;
};

const periodStart = (period) => {
  if (period === 'month') return moment().startOf('month');
  if (period === 'quarter') return moment().subtract(90, 'days').startOf('day');
  if (period === 'fiscal') return fiscalStart();
  return null;
};

const formatDate = (value) => (value ? moment(value).format('MMM D, YYYY') : '—');
const formatDateTime = (value) => (value ? moment(value).format('MMM D, YYYY · h:mm a') : '—');

function Tile({ label, value, hint, icon: Icon, tone }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <div className={`rounded-lg p-2.5 ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {hint && <p className="text-[11px] text-muted-foreground/80">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CasualClientStats() {
  const [period, setPeriod] = useState('all');
  const [account, setAccount] = useState('all');
  const [search, setSearch] = useState('');

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['joblab-casual-clients'],
    queryFn: async () => {
      const page = await base44.entities.JobLabClientStat.list('-last_visit', 2000);
      return Array.isArray(page) ? page : page.items || [];
    },
  });

  const stats = useMemo(() => {
    const start = periodStart(period);
    const term = search.trim().toLowerCase();

    return rows
      .filter((row) => (account === 'all' ? true : account === 'account' ? !!row.has_account : !row.has_account))
      .filter((row) => (start ? row.last_visit && moment(row.last_visit).isAfter(start) : true))
      .filter((row) =>
        term
          ? [row.full_name, row.email, row.phone].filter(Boolean).some((v) => String(v).toLowerCase().includes(term))
          : true
      )
      .sort((a, b) => String(b.last_visit || '').localeCompare(String(a.last_visit || '')));
  }, [rows, period, account, search]);

  const totals = useMemo(() => {
    const monthStart = moment().startOf('month');
    return {
      clients: stats.length,
      withAccount: stats.filter((r) => r.has_account).length,
      noAccount: stats.filter((r) => !r.has_account).length,
      visits: stats.reduce((sum, r) => sum + (r.total_visits || 0), 0),
      onsite: stats.reduce((sum, r) => sum + (r.onsite_visits || 0), 0),
      offsite: stats.reduce((sum, r) => sum + (r.offsite_visits || 0), 0),
      seenThisMonth: stats.filter((r) => r.last_visit && moment(r.last_visit).isAfter(monthStart)).length,
      newThisMonth: stats.filter((r) => r.first_visit && moment(r.first_visit).isAfter(monthStart)).length,
    };
  }, [stats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Job Lab visitors are filed automatically as casual clients in Pathways CM. They are never added to the
          Central Database.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PERIODS).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={account} onValueChange={setAccount}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All visitors</SelectItem>
              <SelectItem value="account">With an account</SelectItem>
              <SelectItem value="guest">No account (guest)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Casual clients" value={totals.clients} hint={`${totals.newThisMonth} new this month`} icon={Users} tone="bg-accent/5 text-accent" />
        <Tile label="With Job Lab account" value={totals.withAccount} icon={UserCheck} tone="bg-green-50 text-green-600" />
        <Tile label="No account (guest)" value={totals.noAccount} icon={UserX} tone="bg-amber-50 text-amber-600" />
        <Tile label="Recorded visits" value={totals.visits} hint={`${totals.seenThisMonth} clients seen this month`} icon={Footprints} tone="bg-blue-50 text-blue-600" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center justify-between py-3">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" /> Onsite visits
            </span>
            <span className="text-lg font-semibold">{totals.onsite}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between py-3">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" /> Offsite visits
            </span>
            <span className="text-lg font-semibold">{totals.offsite}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold">Casual client visits</p>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email or phone"
                className="pl-8"
              />
            </div>
          </div>

          {stats.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No casual clients in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Client</th>
                    <th className="py-2 pr-3 font-medium">Account</th>
                    <th className="py-2 pr-3 text-right font-medium">Visits</th>
                    <th className="py-2 pr-3 text-right font-medium">Onsite</th>
                    <th className="py-2 pr-3 text-right font-medium">Offsite</th>
                    <th className="py-2 pr-3 font-medium">First visit</th>
                    <th className="py-2 font-medium">Last visit</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.slice(0, 200).map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-2.5 pr-3">
                        <p className="font-medium text-foreground">{row.full_name}</p>
                        <p className="text-xs text-muted-foreground">{[row.email, row.phone].filter(Boolean).join(' · ') || 'No contact info'}</p>
                      </td>
                      <td className="py-2.5 pr-3">
                        <Badge variant="outline" className={row.has_account ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-700'}>
                          {row.has_account ? 'Registered' : 'No account'}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-3 text-right font-medium">{row.total_visits || 0}</td>
                      <td className="py-2.5 pr-3 text-right text-muted-foreground">{row.onsite_visits || 0}</td>
                      <td className="py-2.5 pr-3 text-right text-muted-foreground">{row.offsite_visits || 0}</td>
                      <td className="py-2.5 pr-3 text-muted-foreground">{formatDate(row.first_visit)}</td>
                      <td className="py-2.5 text-muted-foreground">{formatDateTime(row.last_visit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {stats.length > 200 && (
                <p className="pt-3 text-xs text-muted-foreground">Showing the 200 most recent of {stats.length} casual clients.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}