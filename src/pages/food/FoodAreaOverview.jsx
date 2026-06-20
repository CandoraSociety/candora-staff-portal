import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLocation } from 'react-router-dom';
import { ShoppingBag, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FoodAreaHeader from '@/components/food/FoodAreaHeader';

const AREA_CONFIG = {
  'cafe-candeur':    { label: 'Cafe Candeur',    orderType: 'dine_in',  tag: 'cafe-candeur' },
  'auntie-bevs':    { label: "Auntie Bev's",    orderType: 'takeout',  tag: 'auntie-bevs' },
};

export default function FoodAreaOverview() {
  const location = useLocation();
  const segment = location.pathname.split('/').filter(Boolean)[1];
  const config = AREA_CONFIG[segment] || {};

  const { data: allOrders = [] } = useQuery({ queryKey: ['food-orders'], queryFn: () => base44.entities.FoodOrder.list() });

  const orders = allOrders.filter(o => !config.orderType || o.order_type === config.orderType);
  const revenue = orders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.total || 0), 0);
  const active = orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).length;

  return (
    <div>
      <FoodAreaHeader area={segment} />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Total Revenue</div>
                <div className="text-xl font-bold">${revenue.toFixed(2)}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Active Orders</div>
                <div className="text-xl font-bold">{active}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Total Orders</div>
                <div className="text-xl font-bold">{orders.length}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}