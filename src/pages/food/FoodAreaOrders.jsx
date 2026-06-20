import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useParams, useLocation } from 'react-router-dom';
import { ShoppingBag, Plus, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

// Map URL segments to order_type values
const AREA_CONFIG = {
  'cafe-candeur':    { label: 'Cafe Candeur',    orderType: 'dine_in' },
  'auntie-bevs':    { label: "Auntie Bev's",     orderType: 'takeout' },
  'community-lunch': { label: 'Community Lunch', orderType: 'delivery' },
};

const STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-700',
  preparing: 'bg-orange-100 text-orange-700',
  ready:     'bg-teal-100 text-teal-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUSES = ['pending','preparing','ready','completed','cancelled'];

export default function FoodAreaOrders() {
  const location = useLocation();
  // Derive area from URL: /food/<area>/orders
  const segment = location.pathname.split('/').filter(Boolean)[1];
  const config = AREA_CONFIG[segment] || { label: 'Orders', orderType: null };

  const qc = useQueryClient();
  const { data: allOrders = [] } = useQuery({ queryKey: ['food-orders'], queryFn: () => base44.entities.FoodOrder.list() });
  const updateOrder = useMutation({ mutationFn: ({ id, data }) => base44.entities.FoodOrder.update(id, data), onSuccess: () => qc.invalidateQueries(['food-orders']) });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const orders = allOrders.filter(o =>
    (!config.orderType || o.order_type === config.orderType) &&
    (!statusFilter || o.status === statusFilter) &&
    (!search || o.customer_name?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{config.label} — Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search customer..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-background"
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <Card key={o.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{o.customer_name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {o.items?.length || 0} item{o.items?.length !== 1 ? 's' : ''}
                    {o.created_date && <span> · {format(new Date(o.created_date), 'MMM d, yyyy')}</span>}
                    {o.notes && <span> · {o.notes}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {o.total != null && <span className="font-semibold">${o.total.toFixed(2)}</span>}
                  <select
                    value={o.status}
                    onChange={e => updateOrder.mutate({ id: o.id, data: { status: e.target.value } })}
                    className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[o.status] || ''}`}
                  >
                    {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}