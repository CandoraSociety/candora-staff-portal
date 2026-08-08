import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UtensilsCrossed, Coffee, Store, ChefHat, TrendingUp, Receipt } from 'lucide-react';

const UNITS = [
  { value: 'cafe',   label: 'Café Candeur', icon: Coffee,  color: 'bg-amber-100 text-amber-800' },
  { value: 'bevs',   label: "Auntie Bev's", icon: Store,   color: 'bg-pink-100 text-pink-800' },
  { value: 'cater',  label: 'Catering',    icon: ChefHat, color: 'bg-indigo-100 text-indigo-800' },
];

function UnitSection({ unit }) {
  const Icon = unit.icon;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Revenue (MTD)</div>
            <div className="text-lg font-bold text-green-700">$0.00</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><Receipt className="w-3 h-3" /> Expenses (MTD)</div>
            <div className="text-lg font-bold text-red-700">$0.00</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Net (MTD)</div>
            <div className="text-lg font-bold text-foreground">$0.00</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Transactions</div>
            <div className="text-lg font-bold text-foreground">0</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Icon className="w-4 h-4" /> {unit.label} — Sales &amp; Expenses</CardTitle>
        </CardHeader>
        <CardContent className="py-10 text-center">
          <Icon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Sales reports and expense tracking for {unit.label} will appear here. Square reader automation is planned to feed revenue data automatically.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function FinanceFoodServices() {
  const [unit, setUnit] = useState('cafe');
  const active = UNITS.find(u => u.value === unit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><UtensilsCrossed className="h-6 w-6 text-primary" /> Candora Food Services</h1>
        <p className="text-sm text-muted-foreground mt-1">Financials for our food-services social venture across all three business operations.</p>
      </div>

      <Tabs value={unit} onValueChange={setUnit} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {UNITS.map(u => (
            <TabsTrigger key={u.value} value={u.value} className="text-xs">
              <Badge className={`text-xs ${u.color} mr-1`}>{u.label.split(' ')[0]}</Badge>
              {u.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={unit} className="mt-4">
          <UnitSection unit={active} />
        </TabsContent>
      </Tabs>
    </div>
  );
}