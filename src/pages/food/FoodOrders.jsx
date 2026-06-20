import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

const TAX_RATE = 0.08;
const STATUS_COLORS = { pending:'bg-yellow-100 text-yellow-700', preparing:'bg-blue-100 text-blue-700', ready:'bg-green-100 text-green-700', completed:'bg-gray-100 text-gray-600', cancelled:'bg-red-100 text-red-600' };
const STATUSES = ['pending','preparing','ready','completed','cancelled'];
const ORDER_TYPES = ['dine_in','takeout','catering','delivery','kiosk'];

export default function FoodOrders() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialog, setDialog] = useState(false);
  const [cart, setCart] = useState([]);
  const [form, setForm] = useState({ customer_name: '', customer_email: '', customer_phone: '', order_type: 'takeout', notes: '', payment_method: 'card' });

  const { data: orders = [], isLoading } = useQuery({ queryKey: ['food-orders'], queryFn: () => base44.entities.FoodOrder.list('-created_date') });
  const { data: menuItems = [] } = useQuery({ queryKey: ['menu-items'], queryFn: () => base44.entities.MenuItem.filter({ is_available: true }) });

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const addToCart = (item) => {
    setCart(prev => {
      const ex = prev.find(c => c.menu_item_id === item.id);
      if (ex) return prev.map(c => c.menu_item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menu_item_id: item.id, name: item.name, price: item.price, quantity: 1, notes: '' }];
    });
  };

  const createOrder = useMutation({
    mutationFn: async () => {
      const order = await base44.entities.FoodOrder.create({
        ...form, items: cart, subtotal, tax, total, status: 'pending'
      });
      // Update/create customer
      const existing = await base44.entities.FoodCustomer.filter({ name: form.customer_name });
      if (existing.length > 0) {
        const c = existing[0];
        await base44.entities.FoodCustomer.update(c.id, {
          total_orders: (c.total_orders || 0) + 1,
          total_spent: (c.total_spent || 0) + total,
          last_order_date: format(new Date(), 'yyyy-MM-dd')
        });
      } else if (form.customer_name) {
        await base44.entities.FoodCustomer.create({
          name: form.customer_name, email: form.customer_email, phone: form.customer_phone,
          total_orders: 1, total_spent: total, last_order_date: format(new Date(), 'yyyy-MM-dd')
        });
      }
      return order;
    },
    onSuccess: () => { qc.invalidateQueries(['food-orders']); qc.invalidateQueries(['food-customers']); setDialog(false); setCart([]); setForm({ customer_name: '', customer_email: '', customer_phone: '', order_type: 'takeout', notes: '', payment_method: 'card' }); }
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.FoodOrder.update(id, { status }),
    onSuccess: () => qc.invalidateQueries(['food-orders'])
  });

  const filtered = orders.filter(o => {
    const matchSearch = o.customer_name?.toLowerCase().includes(search.toLowerCase()) || o.id?.includes(search);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Orders</h1><p className="text-muted-foreground text-sm">Manage customer orders</p></div>
        <Button onClick={() => setDialog(true)}><Plus className="w-4 h-4 mr-2" />New Order</Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No orders found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <Card key={order.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{order.customer_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                    <Badge variant="outline" className="text-xs">{order.order_type?.replace('_',' ')}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {order.items?.length || 0} items · ${order.total?.toFixed(2)} · {order.created_date ? format(new Date(order.created_date), 'MMM d, h:mm a') : ''}
                  </div>
                  {order.notes && <div className="text-xs text-muted-foreground mt-1">📝 {order.notes}</div>}
                </div>
                <Select value={order.status} onValueChange={v => updateStatus.mutate({ id: order.id, status: v })}>
                  <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Order</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div><Label>Customer Name</Label><Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} /></div>
              <div><Label>Email</Label><Input value={form.customer_email} onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))} /></div>
              <div><Label>Phone</Label><Input value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} /></div>
              <div>
                <Label>Order Type</Label>
                <Select value={form.order_type} onValueChange={v => setForm(f => ({ ...f, order_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ORDER_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace('_',' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Payment</Label>
                <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['cash','card','square','invoice'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            </div>
            <div className="space-y-3">
              <Label className="font-semibold">Menu Items</Label>
              <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2">
                {menuItems.map(item => (
                  <button key={item.id} onClick={() => addToCart(item)}
                    className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-muted flex justify-between items-center">
                    <span>{item.name}</span>
                    <span className="text-muted-foreground">${item.price?.toFixed(2)}</span>
                  </button>
                ))}
              </div>
              <Label className="font-semibold">Cart</Label>
              <div className="space-y-1 min-h-[60px]">
                {cart.length === 0 && <div className="text-xs text-muted-foreground py-2">No items added</div>}
                {cart.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span>{c.name} × {c.quantity}</span>
                    <div className="flex items-center gap-2">
                      <span>${(c.price * c.quantity).toFixed(2)}</span>
                      <button onClick={() => setCart(prev => prev.filter((_, j) => j !== i))} className="text-destructive text-xs">✕</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax (8%)</span><span>${tax.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold"><span>Total</span><span>${total.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={() => createOrder.mutate()} disabled={!form.customer_name || cart.length === 0 || createOrder.isPending}>
              {createOrder.isPending ? 'Creating...' : 'Create Order'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}