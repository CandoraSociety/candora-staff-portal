import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FileText, Users, Heart, Briefcase, Download, RefreshCw } from 'lucide-react';

const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

export default function MarketingAnnualReport() {
  const [year, setYear] = useState(String(CURRENT_YEAR));

  const { data: clients = [], isLoading: loadingClients } = useQuery({ queryKey: ['clients-report'], queryFn: () => base44.entities.Client.list() });
  const { data: volunteers = [], isLoading: loadingVols } = useQuery({ queryKey: ['volunteers-report'], queryFn: () => base44.entities.Volunteer.list() });
  const { data: volunteerLogs = [] } = useQuery({ queryKey: ['volLogs-report'], queryFn: () => base44.entities.VolunteerTimeLog.list() });
  const { data: donations = [] } = useQuery({ queryKey: ['donations-report'], queryFn: () => base44.entities.Donation.list() });
  const { data: donors = [] } = useQuery({ queryKey: ['donors-report'], queryFn: () => base44.entities.Donor.list() });

  const isLoading = loadingClients || loadingVols;

  const yearClients = useMemo(() => clients.filter(c => {
    const d = c.service_start_date || c.intake_date || c.created_date;
    return d && d.startsWith(year);
  }), [clients, year]);

  const yearVols = useMemo(() => volunteers.filter(v => {
    const d = v.start_date || v.created_date;
    return d && d.startsWith(year);
  }), [volunteers, year]);

  const yearDonations = useMemo(() => donations.filter(d => d.donation_date?.startsWith(year)), [donations, year]);
  const totalRaised = yearDonations.reduce((s, d) => s + (d.amount || 0), 0);

  const yearVolHours = useMemo(() => {
    return volunteerLogs
      .filter(l => (l.date || l.created_date || '').startsWith(year))
      .reduce((s, l) => s + (l.hours || 0), 0);
  }, [volunteerLogs, year]);

  const employedClients = yearClients.filter(c => c.employment_status && ['E-RF', 'E-UF', 'E-PT'].includes(c.employment_status)).length;
  const completedClients = yearClients.filter(c => c.program_status === 'complete').length;

  const serviceTypeData = useMemo(() => {
    const counts = {};
    yearClients.forEach(c => {
      const t = c.service_type || 'unknown';
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));
  }, [yearClients]);

  const employmentOutcomeData = [
    { name: 'Employed (Related)', value: yearClients.filter(c => c.employment_status === 'E-RF').length },
    { name: 'Employed (Unrelated)', value: yearClients.filter(c => c.employment_status === 'E-UF').length },
    { name: 'Employed (Part-Time)', value: yearClients.filter(c => c.employment_status === 'E-PT').length },
    { name: 'Looking for Work', value: yearClients.filter(c => c.employment_status === 'UE-LFW').length },
    { name: 'Unemployed', value: yearClients.filter(c => c.employment_status === 'UE').length },
  ].filter(d => d.value > 0);

  const monthlyDonations = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const m = String(i + 1).padStart(2, '0');
      const month = `${year}-${m}`;
      return {
        name: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
        amount: yearDonations.filter(d => d.donation_date?.startsWith(month)).reduce((s, d) => s + (d.amount || 0), 0)
      };
    });
    return months;
  }, [yearDonations, year]);

  const volTypeData = useMemo(() => {
    const counts = {};
    volunteers.forEach(v => {
      const t = v.volunteer_type || 'other';
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));
  }, [volunteers]);

  const statCards = [
    { label: 'Clients Served', value: yearClients.length, icon: Users, color: 'text-blue-600', sub: `${completedClients} completed programs` },
    { label: 'Employment Outcomes', value: employedClients, icon: Briefcase, color: 'text-green-600', sub: yearClients.length > 0 ? `${Math.round((employedClients / yearClients.length) * 100)}% employment rate` : '' },
    { label: 'Volunteer Hours', value: yearVolHours.toLocaleString(), icon: Users, color: 'text-purple-600', sub: `${yearVols.length} new volunteers` },
    { label: 'Donations Raised', value: `$${totalRaised.toLocaleString()}`, icon: Heart, color: 'text-rose-600', sub: `${yearDonations.length} donations` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-display font-bold">Annual Report Builder</h1>
          <p className="text-sm text-muted-foreground">Live impact summary drawn from all program and donor data</p>
        </div>
        <div className="flex gap-3 items-center">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" disabled>
            <Download className="w-4 h-4 mr-1" /> Export PDF
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Hero Impact Banner */}
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border p-6">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">{year} Impact at a Glance</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-4">Data automatically pulled from Pathways CM, Volunteer Manager, and Donor records.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statCards.map(({ label, value, icon: Icon, color, sub }) => (
                <div key={label} className="bg-background rounded-lg p-4 shadow-sm">
                  <Icon className={`w-5 h-5 ${color} mb-2`} />
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs font-medium">{label}</p>
                  {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service Breakdown */}
            <Card>
              <CardHeader><CardTitle className="text-base">Clients by Service Type</CardTitle></CardHeader>
              <CardContent>
                {serviceTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={serviceTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                        {serviceTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground py-8 text-center">No data for {year}</p>}
              </CardContent>
            </Card>

            {/* Employment Outcomes */}
            <Card>
              <CardHeader><CardTitle className="text-base">Employment Outcomes</CardTitle></CardHeader>
              <CardContent>
                {employmentOutcomeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={employmentOutcomeData} layout="vertical">
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground py-8 text-center">No data for {year}</p>}
              </CardContent>
            </Card>

            {/* Monthly Donations */}
            <Card>
              <CardHeader><CardTitle className="text-base">Monthly Donations — {year}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyDonations}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => `$${v.toLocaleString()}`} />
                    <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Volunteer Breakdown */}
            <Card>
              <CardHeader><CardTitle className="text-base">Volunteers by Type</CardTitle></CardHeader>
              <CardContent>
                {volTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={volTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                        {volTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground py-8 text-center">No data for {year}</p>}
              </CardContent>
            </Card>
          </div>

          {/* Donor Summary */}
          <Card>
            <CardHeader><CardTitle className="text-base">Donor Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Donors', value: donors.length },
                  { label: 'Active Donors (Year)', value: new Set(yearDonations.map(d => d.donor_id)).size },
                  { label: 'Total Raised (Year)', value: `$${totalRaised.toLocaleString()}` },
                  { label: 'Average Gift', value: yearDonations.length > 0 ? `$${Math.round(totalRaised / yearDonations.length).toLocaleString()}` : '$0' },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground text-center p-4 bg-muted/20 rounded-lg">
            <p>All data is live and automatically sourced from Pathways CM, Volunteer Manager, and Donor Management.</p>
            <p className="mt-1">PDF export coming soon — data can be copy-pasted into your annual report template.</p>
          </div>
        </>
      )}
    </div>
  );
}