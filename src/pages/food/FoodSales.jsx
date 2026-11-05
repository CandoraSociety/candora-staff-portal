import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, ShoppingBag, TrendingUp, Upload, Receipt, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, subDays } from 'date-fns';
import FoodAreaHeader from '@/components/food/FoodAreaHeader';
import SalesReportsPanel from '@/components/food/SalesReportsPanel';
import SquareReportImportDialog from '@/components/food/SquareReportImportDialog';
import { money, reportMonth, sumReports } from '@/lib/foodUnits';
import { abToday } from '@/lib/abTime';

const AREA_TYPES = {
  dine_in: 'Cafe Candeur',
  takeout: "Auntie Bev's",
  delivery: 'Community Lunch',
  catering: 'Catering',
};

export default function FoodSales() {
  const [importOpen, setImportOpen] = useState(false);
  const { data: orders = [] } = useQuery({ queryKey: ['food-orders'], queryFn: () => base44.entities.FoodOrder.list() });
  const { data: reports = [] } = useQuery({ queryKey: ['food-sales-reports'], queryFn: () => base44.entities.FoodSalesReport.list() });

  const completed = orders.filter(o => o.status === 'completed');
  const totalRevenue = completed.reduce((s, o) => s + (o.total || 0), 0);
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayRevenue = completed.filter(o => o.created_date?.startsWith(todayStr)).reduce((s, o) => s + (o.total || 0), 0);

  // Square reports — the revenue figure the portal records and Finance reads.
  const monthKey = abToday().slice(0, 7);
  const monthTotals = sumReports(reports.filter(r => reportMonth(r) === monthKey));
  const allTotals = sumReports(reports);

  // Daily revenue last 14 days
  const dailySales = Array.from({ length: 14 }, (_, i) => {
    const d = format(subDays(new Date(), 13 - i), 'yyyy-MM-dd');
    const rev = completed.filter(o => o.created_date?.startsWith(d)).reduce((s, o) => s + (o.total || 0), 0);
    return { date: format(subDays(new Date(), 13 - i), 'MMM d'), revenue: rev };
  });

  // Revenue by area
  const areaRevenue = Object.entries(AREA_TYPES).map(([type, label]) => ({
    name: label,
    revenue: completed.filter(o => o.order_type === type).reduce((s, o) => s + (o.total || 0), 0),
  }));

  return (
    <div>
      <FoodAreaHeader area="sales" />
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-bold">Sales &amp; revenue</h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              File each Square report against its operation. The revenue is recorded here and the same report appears in the Finance portal.
            </p>
          </div>
          <Button onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4" /> Import Square report
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Revenue this month', value: money(monthTotals.net), icon: DollarSign, bg: 'bg-green-50', color: 'text-green-600' },
            { label: 'Revenue recorded (all)', value: money(allTotals.net), icon: TrendingUp, bg: 'bg-blue-50', color: 'text-blue-600' },
            { label: 'Transactions this month', value: monthTotals.transactions || 0, icon: ShoppingBag, bg: 'bg-orange-50', color: 'text-orange-600' },
            { label: 'Reports filed', value: reports.length, icon: Receipt, bg: 'bg-purple-50', color: 'text-purple-600' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                  <div className="text-xl font-bold">{s.value}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Revenue and net profit — this month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Revenue (Square reports)</span>
              <span className="font-semibold text-green-700">{money(monthTotals.net)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Expenses recorded</span>
              <Badge variant="secondary" className="text-[10px] font-normal">Not tracked yet</Badge>
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-sm font-medium">Net profit</span>
              <span className="text-lg font-bold">{money(monthTotals.net)}</span>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>
                Expenses (food cost, wages, supplies) are not captured in the portal yet, so this line is revenue only for now.
                Recording costs per operation is the next step — it turns this figure into a true net profit.
              </span>
            </div>
          </CardContent>
        </Card>

        <SalesReportsPanel emptyHint="No Square reports filed yet. Use “Import Square report” above to file one — it records the revenue and sends it to Finance." />

        <div className="pt-2">
          <h2 className="text-lg font-bold">Counter orders in the portal</h2>
          <p className="text-sm text-muted-foreground">Orders taken inside the portal, shown separately from the Square reports above.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Order revenue', value: money(totalRevenue), icon: DollarSign, bg: 'bg-green-50', color: 'text-green-600' },
            { label: "Today's orders", value: money(todayRevenue), icon: TrendingUp, bg: 'bg-blue-50', color: 'text-blue-600' },
            { label: 'Completed orders', value: completed.length, icon: ShoppingBag, bg: 'bg-orange-50', color: 'text-orange-600' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                  <div className="text-xl font-bold">{s.value}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Daily order revenue (14 days)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={dailySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => money(v)} />
                  <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Order revenue by area</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={areaRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => money(v)} />
                  <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      <SquareReportImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}