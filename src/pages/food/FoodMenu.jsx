import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIES = ['appetizer','entree','side','dessert','beverage','breakfast','lunch_special','catering'];
const EMPTY = { name: '', description: '', category: 'entree', price: '', cost: '', is_available: true, tags: [] };

export default function FoodMenu() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);

  const { data: items = [], isLoading } = useQuery({ queryKey: ['menu-items'], queryFn: () => base44.entities.MenuItem.list() });

  const save = useMutation({
    mutationFn: async () => {
      const data = { ...form, price: parseFloat(form.price), cost: parseFloat(form.cost) || 0 };
      if (editing) return base44.entities.MenuItem.update(editing, data);
      return base44.entities.MenuItem.create(data);
    },
    onSuccess: () => { qc.invalidateQueries(['menu-items']); setDialog(false); setForm(EMPTY); setEditing(null); }
  });

  const del = useMutation({
    mutationFn: (id) => base44.entities.MenuItem.delete(id),
    onSuccess: () => qc.invalidateQueries(['menu-items'])
  });

  const toggle = useMutation({
    mutationFn: ({ id, val }) => base44.entities.MenuItem.update(id, { is_available: val }),
    onSuccess: () => qc.invalidateQueries(['menu-items'])
  });

  const openEdit = (item) => { setEditing(item.id); setForm({ ...item, price: item.price?.toString(), cost: item.cost?.toString() || '' }); setDialog(true); };
  const openNew = () => { setEditing(null); setForm(EMPTY); setDialog(true); };

  const filtered = items.filter(i => {
    const matchSearch = i.name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || i.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Menu Items</h1><p className="text-muted-foreground text-sm">Manage your food and beverage offerings</p></div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Add Item</Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No menu items found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => (
            <Card key={item.id} className={`relative ${!item.is_available ? 'opacity-60' : ''}`}>
              {item.image_url && <img src={item.image_url} alt={item.name} className="w-full h-36 object-cover rounded-t-lg" />}
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm">{item.name}</div>
                    <Badge variant="secondary" className="text-xs mt-1">{item.category?.replace('_',' ')}</Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-base">${item.price?.toFixed(2)}</div>
                    {item.cost > 0 && <div className="text-xs text-muted-foreground">Cost: ${item.cost?.toFixed(2)}</div>}
                  </div>
                </div>
                {item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
                <div className="flex items-center justify-between pt-1">
                  <button onClick={() => toggle.mutate({ id: item.id, val: !item.is_available })}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {item.is_available ? 'Available' : 'Unavailable'}
                  </button>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del.mutate(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Item' : 'Add Menu Item'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Price ($)</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
              <div><Label>Cost ($)</Label><Input type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} /></div>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace('_',' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Image URL</Label><Input value={form.image_url || ''} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
              <Button onClick={() => save.mutate()} disabled={!form.name || !form.price || save.isPending}>
                {save.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}