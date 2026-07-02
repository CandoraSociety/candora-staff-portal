import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ClipboardList, CalendarDays, DollarSign, Baby, Plus, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/rc/StatusBadge';
import { PROGRAM_OPTIONS, PROGRAM_LABELS, PROGRAM_COLORS, calculateBilling, BILLING_STATUS_OPTIONS, getProgramLabel, MONTH_NAMES } from '@/lib/childmindingConstants';

export default function ChildmindingDashboard() {
  const { data: records = [], isLoading } = useQuery({ queryKey: ['childminding-records'], queryFn: () => base44.entities.ChildmindingRecord.list('-date', 500) });

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthRecords = records.filter(r => {
    if (!r.date) return false;
    const d = new Date(r.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const pathwaysRecords = records.filter(r => r.program === 'pathways');
  const pathwaysMonthRecords = monthRecords.filter(r => r.program === 'pathways');

  const totalBillingMonth = pathwaysMonthRecords.reduce((sum, r) => sum + (r.billing_amount || calculateBilling(r.program, r.hours)), 0);
  const totalHoursMonth = monthRecords.reduce((sum, r) => sum + (r.hours || 0), 0);
  const uniqueChildrenMonth = new Set(monthRecords.map(r => `${r.child_first_name?.toLowerCase()}_${r.parent_name?.toLowerCase()}`)).size;

  const stats = [
    { label: `${MONTH_NAMES[currentMonth]} Sessions`, value: monthRecords.length, icon: CalendarDays, color: '#3b82f6' },
    { label: `${MONTH_NAMES[currentMonth]} Hours`, value: totalHoursMonth.toFixed(1), icon: Baby, color: '#8b5cf6' },
    { label: 'Unique Children This Month', value: uniqueChildrenMonth, icon: ClipboardList, color: '#22c55e' },
    { label: 'Pathways Billing This Month', value: `$${totalBillingMonth.toFixed(2)}`, icon: DollarSign, color: '#f59e0b' },
  ];

  // Breakdown by program
  const programBreakdown = PROGRAM_OPTIONS.map(p => {
    const pRecords = monthRecords.filter(r => r.program === p.value);
    return { ...p, count: pRecords.length, hours: pRecords.reduce((s, r) => s + (r.hours || 0), 0) };
  }).filter(p => p.count > 0);

  // Upcoming sessions (today and future)
  const todayStr = now.toISOString().split('T')[0];
  const upcoming = records.filter(r => r.date >= todayStr).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Childminding Dashboard</h1><p className="text-muted-foreground text-sm mt-1">{MONTH_NAMES[currentMonth]} {currentYear} overview</p></div>
        <Link to="/childminding/intake"><Button><Plus className="h-4 w-4" /> New Intake</Button></Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => { const Icon = stat.icon; return (
          <Card key={stat.label}><CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.color + '15' }}><Icon className="h-5 w-5" style={{ color: stat.color }} /></div>
            <div><p className="text-2xl font-bold text-foreground">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div>
          </CardContent></Card>
        ); })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Program Breakdown — {MONTH_NAMES[currentMonth]}</CardTitle></CardHeader>
          <CardContent>
            {programBreakdown.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No sessions this month</p> : (
              <div className="space-y-3">{programBreakdown.map(p => (
                <div key={p.value} className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} /><span className="text-sm font-medium">{p.label}</span></div>
                  <div className="text-right"><p className="text-sm font-medium">{p.count} session{p.count !== 1 ? 's' : ''}</p><p className="text-xs text-muted-foreground">{p.hours.toFixed(1)} hours</p></div>
                </div>
              ))}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Upcoming Sessions</CardTitle><Link to="/childminding/schedule" className="text-xs text-primary flex items-center gap-1 hover:underline">View schedule <ArrowRight className="h-3 w-3" /></Link></CardHeader>
          <CardContent>
            {upcoming.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No upcoming sessions</p> : (
              <div className="space-y-2">{upcoming.map(r => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                  <div><p className="text-sm font-medium text-foreground">{r.child_first_name}</p><p className="text-xs text-muted-foreground">{new Date(r.date).toLocaleDateString()} · {r.hours}h · {getProgramLabel(r)}</p></div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: PROGRAM_COLORS[r.program] + '20', color: PROGRAM_COLORS[r.program] }}>{PROGRAM_LABELS[r.program]}</span>
                </div>
              ))}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}