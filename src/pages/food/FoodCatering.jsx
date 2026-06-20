import React, { useState } from 'react';
import FoodAreaHeader from '@/components/food/FoodAreaHeader';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
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

const EVENT_TYPES = ['corporate','wedding','birthday','funeral','holiday','community','fundraiser','other'];
const SERVICE_STYLES = ['buffet','plated','family_style','boxed_meals','food_stations','cocktail'];
const STATUSES = ['draft','sent','accepted','declined'];
const STATUS_COLORS = { draft: 'bg-gray-100 text-gray-600', sent: 'bg-blue-100 text-blue-700', accepted: 'bg-green-100 text-green-700', declined: 'bg-red-100 text-red-600' };
const EMPTY = { customer_name: '', customer_email: '', customer_phone: '', event_date: '', event_type: 'corporate', guest_count: '', service_style: 'buffet', notes: '', subtotal: '', service_fee: '', total: '', status: 'draft' };

export default function FoodCatering() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);

  const { data: quotes = [], isLoading } = useQuery({ queryKey: ['catering-quotes'], queryFn: () => base44.entities.CateringQuote.list('-created_date') });
  const { data: menuItems = [] } = useQuery({ queryKey: ['menu-items'], queryFn: () => base44.entities.MenuItem.filter({ category: 'catering' }) });

  const save = useMutation({
    mutationFn: async () => {
      const data = { ...form, guest_count: parseInt(form.guest_count) || 0, subtotal: parseFloat(form.subtotal) || 0, service_fee: parseFloat(form.service_fee) || 0, total: parseFloat(form.total) || 0 };
      if (editing) return base44.entities.CateringQuote.update(editing, data);
      return base44.entities.CateringQuote.create(data);
    },
    onSuccess: () => { qc.invalidateQueries(['catering-quotes']); setDialog(false); setForm(EMPTY); setEditing(null); }
  });

  const del = useMutation({
    mutationFn: (id) => base44.entities.CateringQuote.delete(id),
    onSuccess: () => qc.invalidateQueries(['catering-quotes'])
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.CateringQuote.update(id, { status }),
    onSuccess: () => qc.invalidateQueries(['catering-quotes'])
  });

  const openEdit = (q) => { setEditing(q.id); setForm({ ...q, guest_count: q.guest_count?.toString(), subtotal: q.subtotal?.toString(), service_fee: q.service_fee?.toString(), total: q.total?.toString() }); setDialog(true); };
  const openNew = () => { setEditing(null); setForm(EMPTY); setDialog(true); };

  const filtered = quotes.filter(q => {
    const matchSearch = q.customer_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <FoodAreaHeader area="catering" />
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-muted-foreground text-sm">Manage catering inquiries and quotes</p>
        <div className="flex items-center gap-2">
          <Link to="/catering-portal/admin/bookings" target="_blank" className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Booking Portal Admin
          </Link>
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />New Quote</Button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by customer..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No quotes found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(q => (
            <Card key={q.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{q.customer_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[q.status]}`}>{q.status}</span>
                    <Badge variant="outline" className="text-xs">{q.event_type}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {q.guest_count} guests · {q.service_style?.replace('_',' ')} · {q.event_date || 'No date'}
                    {q.total > 0 && ` · $${q.total?.toFixed(2)}`}
                  </div>
                  {q.notes && <div className="text-xs text-muted-foreground mt-1">📝 {q.notes}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <Select value={q.status} onValueChange={v => updateStatus.mutate({ id: q.id, status: v })}>
                    <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(q)}>Edit</Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => del.mutate(q.id)}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Quote' : 'New Catering Quote'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Customer Name</Label><Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} /></div>
              <div><Label>Email</Label><Input value={form.customer_email} onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))} /></div>
              <div><Label>Phone</Label><Input value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} /></div>
              <div><Label>Event Date</Label><Input type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} /></div>
              <div><Label>Guest Count</Label><Input type="number" value={form.guest_count} onChange={e => setForm(f => ({ ...f, guest_count: e.target.value }))} /></div>
              <div>
                <Label>Event Type</Label>
                <Select value={form.event_type} onValueChange={v => setForm(f => ({ ...f, event_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Service Style</Label>
                <Select value={form.service_style} onValueChange={v => setForm(f => ({ ...f, service_style: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SERVICE_STYLES.map(s => <SelectItem key={s} value={s}>{s.replace('_',' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Subtotal ($)</Label><Input type="number" value={form.subtotal} onChange={e => setForm(f => ({ ...f, subtotal: e.target.value }))} /></div>
              <div><Label>Service Fee ($)</Label><Input type="number" value={form.service_fee} onChange={e => setForm(f => ({ ...f, service_fee: e.target.value }))} /></div>
              <div><Label>Total ($)</Label><Input type="number" value={form.total} onChange={e => setForm(f => ({ ...f, total: e.target.value }))} /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
              <Button onClick={() => save.mutate()} disabled={!form.customer_name || save.isPending}>{save.isPending ? 'Saving...' : 'Save Quote'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}