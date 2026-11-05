import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UtensilsCrossed, TrendingUp, Receipt, Info } from 'lucide-react';
import SalesReportsPanel from '@/components/food/SalesReportsPanel';
import { FOOD_UNITS, money, reportMonth, sumReports } from '@/lib/foodUnits';
import { abToday } from '@/lib/abTime';

const UNIT_BADGE = {
  cafe_candeur: 'bg-amber-100 text-amber-800',
  auntie_bevs: 'bg-pink-100 text-pink-800',
  catering: 'bg-indigo-100 text-indigo-800',
  community_lunch: 'bg-emerald-100 text-emerald-800',
};

function UnitSection({ unit, reports }) {
  const monthKey = abToday().slice(0, 7);
  const unitReports = reports.filter(r => r.unit === unit.value);
  const monthTotals = sumReports(unitReports.filter(r => reportMonth(r) === monthKey));
  const allTotals = sumReports(unitReports);
  const Icon = unit.icon;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Revenue (MTD)</div>
            <div className="text-lg font-bold text-green-700">{money(monthTotals.net)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><Receipt className="w-3 h-3" /> Expenses (MTD)</div>
            <div className="text-sm font-medium text-muted-foreground mt-1">Not tracked yet</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Net (MTD)</div>
            <div className="text-lg font-bold text-foreground">{money(monthTotals.net)}</div>
            <div className="text-[10px] text-muted-foreground">Revenue only — expenses pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Reports filed</div>
            <div className="text-lg font-bold text-foreground">{unitReports.length}</div>
            <div className="text-[10px] text-muted-foreground">{money(allTotals.net)} recorded all-time</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Icon className="w-4 h-4" /> {unit.label} — Sales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Revenue arrives as the Square reports the Food Services team files for {unit.label}. Nothing is entered in Finance —
            each report is read here exactly as it was recorded in the food portal.
          </p>
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>
              Operation expenses are not in the portal yet. Capturing food cost, wages and supplies so each operation shows a true
              net profit is planned — until then the net figure above is revenue only.
            </span>
          </div>
        </CardContent>
      </Card>

      <SalesReportsPanel
        unit={unit.value}
        showUnit={false}
        emptyHint={`No reports filed for ${unit.label} yet. The Food Services team files them from the food portal's Sales page.`}
      />
    </div>
  );
}

export default function FinanceFoodServices() {
  const [unit, setUnit] = useState('cafe_candeur');
  const active = FOOD_UNITS.find(u => u.value === unit) || FOOD_UNITS[0];

  const { data: reports = [] } = useQuery({
    queryKey: ['food-sales-reports'],
    queryFn: () => base44.entities.FoodSalesReport.list(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><UtensilsCrossed className="h-6 w-6 text-primary" /> Candora Food Services</h1>
        <p className="text-sm text-muted-foreground mt-1">Financials for our food-services social venture across all operations. Revenue is forwarded here from the Food Services portal.</p>
      </div>

      <Tabs value={unit} onValueChange={setUnit} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          {FOOD_UNITS.map(u => (
            <TabsTrigger key={u.value} value={u.value} className="text-xs">
              <Badge className={`text-xs ${UNIT_BADGE[u.value]} mr-1`}>{u.shortLabel}</Badge>
              {u.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={unit} className="mt-4">
          <UnitSection unit={active} reports={reports} />
        </TabsContent>
      </Tabs>
    </div>
  );
}