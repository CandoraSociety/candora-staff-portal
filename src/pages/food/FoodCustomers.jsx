import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';

export default function FoodCustomers() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const { data: customers = [], isLoading } = useQuery({ queryKey: ['food-customers'], queryFn: () => base44.entities.FoodCustomer.list('-total_orders') });
  const { data: orders = [] } = useQuery({ queryKey: ['food-orders'], queryFn: () => base44.entities.FoodOrder.list('-created_date') });

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const customerOrders = selected ? orders.filter(o => o.customer_name === selected.name) : [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="text-muted-foreground text-sm">{customers.length} total customers</p>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {['Name','Email','Phone','Total Orders','Total Spent','Last Order','Preferred Type'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => setSelected(c)}>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone || '—'}</td>
                  <td className="px-4 py-3 font-mono">{c.total_orders || 0}</td>
                  <td className="px-4 py-3 font-mono">${(c.total_spent || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.last_order_date ? format(new Date(c.last_order_date), 'MMM d, yyyy') : '—'}</td>
                  <td className="px-4 py-3">{c.preferred_order_type && <Badge variant="outline" className="text-xs">{c.preferred_order_type.replace('_',' ')}</Badge>}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No customers found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Users className="w-5 h-5" />{selected.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-1 text-sm">
              {selected.email && <div><span className="text-muted-foreground">Email: </span>{selected.email}</div>}
              {selected.phone && <div><span className="text-muted-foreground">Phone: </span>{selected.phone}</div>}
              <div><span className="text-muted-foreground">Total Orders: </span><strong>{selected.total_orders || 0}</strong></div>
              <div><span className="text-muted-foreground">Total Spent: </span><strong>${(selected.total_spent || 0).toFixed(2)}</strong></div>
              {selected.notes && <div className="pt-2 text-muted-foreground">{selected.notes}</div>}
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-2">Order History</h3>
              {customerOrders.length === 0 ? (
                <div className="text-sm text-muted-foreground">No orders found</div>
              ) : (
                <div className="space-y-2">
                  {customerOrders.slice(0, 10).map(o => (
                    <div key={o.id} className="flex items-center justify-between text-sm border rounded-lg px-3 py-2">
                      <div>
                        <div className="font-medium">{o.order_type?.replace('_',' ')} · {o.items?.length || 0} items</div>
                        <div className="text-xs text-muted-foreground">{o.created_date ? format(new Date(o.created_date), 'MMM d, yyyy') : ''}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${o.total?.toFixed(2)}</div>
                        <Badge variant="secondary" className="text-xs">{o.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}