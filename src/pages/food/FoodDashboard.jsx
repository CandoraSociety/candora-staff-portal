import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShoppingBag, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, parseISO } from 'date-fns';

const COLORS = ['#f97316','#22c55e','#3b82f6','#a855f7','#ec4899','#14b8a6'];

export default function FoodDashboard() {
  const { data: orders = [] } = useQuery({ queryKey: ['food-orders'], queryFn: () => base44.entities.FoodOrder.list() });
  const { data: menuItems = [] } = useQuery({ queryKey: ['menu-items'], queryFn: () => base44.entities.MenuItem.list() });
  const { data: inventory = [] } = useQuery({ queryKey: ['inventory'], queryFn: () => base44.entities.InventoryItem.list() });

  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.total || 0), 0);
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayRevenue = orders.filter(o => o.status === 'completed' && o.created_date?.startsWith(today)).reduce((s, o) => s + (o.total || 0), 0);
  const activeOrders = orders.filter(o => ['pending','preparing','ready'].includes(o.status)).length;
  const lowStock = inventory.filter(i => i.is_low_stock || (i.reorder_level && i.quantity <= i.reorder_level));

  // Daily sales last 14 days
  const dailySales = Array.from({ length: 14 }, (_, i) => {
    const d = format(subDays(new Date(), 13 - i), 'yyyy-MM-dd');
    const rev = orders.filter(o => o.status === 'completed' && o.created_date?.startsWith(d)).reduce((s, o) => s + (o.total || 0), 0);
    return { date: format(subDays(new Date(), 13 - i), 'MMM d'), revenue: rev };
  });

  // Revenue by category
  const catMap = {};
  orders.filter(o => o.status === 'completed').forEach(o => {
    (o.items || []).forEach(item => {
      const mi = menuItems.find(m => m.id === item.menu_item_id);
      const cat = mi?.category || 'other';
      catMap[cat] = (catMap[cat] || 0) + (item.price * item.quantity || 0);
    });
  });
  const pieData = Object.entries(catMap).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));

  const stats = [
    { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: "Today's Revenue", value: `$${todayRevenue.toFixed(2)}`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Orders', value: activeOrders, icon: ShoppingBag, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Low Stock Items', value: lowStock.length, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Food Services Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of operations and performance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
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
          <CardHeader><CardTitle className="text-sm">Revenue by Category</CardTitle></CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => `$${v}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {lowStock.length > 0 && (
        <Card className="border-red-200">
          <CardHeader><CardTitle className="text-sm text-red-600 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Low Stock Alerts</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStock.map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                  <span className="font-medium">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{item.quantity} {item.unit}</span>
                    <Badge variant="destructive" className="text-xs">Low Stock</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}