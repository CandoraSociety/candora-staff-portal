import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { format, subDays } from 'date-fns';
import FoodAreaHeader from '@/components/food/FoodAreaHeader';

const AREA_TYPES = {
  dine_in: 'Cafe Candeur',
  takeout: "Auntie Bev's",
  delivery: 'Community Lunch',
  catering: 'Catering',
};

export default function FoodSales() {
  const { data: orders = [] } = useQuery({ queryKey: ['food-orders'], queryFn: () => base44.entities.FoodOrder.list() });

  const completed = orders.filter(o => o.status === 'completed');
  const totalRevenue = completed.reduce((s, o) => s + (o.total || 0), 0);
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayRevenue = completed.filter(o => o.created_date?.startsWith(todayStr)).reduce((s, o) => s + (o.total || 0), 0);

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, bg: 'bg-green-50', color: 'text-green-600' },
            { label: "Today's Revenue", value: `$${todayRevenue.toFixed(2)}`, icon: TrendingUp, bg: 'bg-blue-50', color: 'text-blue-600' },
            { label: 'Completed Orders', value: completed.length, icon: ShoppingBag, bg: 'bg-orange-50', color: 'text-orange-600' },
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
            <CardHeader><CardTitle className="text-sm">Daily Revenue (14 days)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={dailySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => `$${v.toFixed(2)}`} />
                  <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Revenue by Area</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={areaRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => `$${v.toFixed(2)}`} />
                  <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}