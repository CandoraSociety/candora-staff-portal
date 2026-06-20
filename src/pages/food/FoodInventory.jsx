import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIES = ['produce','dairy','meat','seafood','dry_goods','spices','beverages','frozen','packaging','other'];
const UNITS = ['lbs','oz','gal','each','cases','bags','boxes','liters','kg'];
const EMPTY = { name: '', category: 'dry_goods', quantity: '', unit: 'each', unit_cost: '', reorder_level: '', supplier: '' };

export default function FoodInventory() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [lowOnly, setLowOnly] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);

  const { data: items = [], isLoading } = useQuery({ queryKey: ['inventory'], queryFn: () => base44.entities.InventoryItem.list() });

  const save = useMutation({
    mutationFn: async () => {
      const qty = parseFloat(form.quantity);
      const reorder = parseFloat(form.reorder_level) || 0;
      const data = { ...form, quantity: qty, unit_cost: parseFloat(form.unit_cost) || 0, reorder_level: reorder, is_low_stock: qty <= reorder && reorder > 0 };
      if (editing) return base44.entities.InventoryItem.update(editing, data);
      return base44.entities.InventoryItem.create(data);
    },
    onSuccess: () => { qc.invalidateQueries(['inventory']); setDialog(false); setForm(EMPTY); setEditing(null); }
  });

  const del = useMutation({
    mutationFn: (id) => base44.entities.InventoryItem.delete(id),
    onSuccess: () => qc.invalidateQueries(['inventory'])
  });

  const openEdit = (item) => { setEditing(item.id); setForm({ ...item, quantity: item.quantity?.toString(), unit_cost: item.unit_cost?.toString() || '', reorder_level: item.reorder_level?.toString() || '' }); setDialog(true); };
  const openNew = () => { setEditing(null); setForm(EMPTY); setDialog(true); };

  const filtered = items.filter(i => {
    const isLow = i.is_low_stock || (i.reorder_level > 0 && i.quantity <= i.reorder_level);
    return i.name?.toLowerCase().includes(search.toLowerCase()) &&
      (catFilter === 'all' || i.category === catFilter) &&
      (!lowOnly || isLow);
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Inventory</h1><p className="text-muted-foreground text-sm">Track stock levels and supplies</p></div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Add Item</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search inventory..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace('_',' ')}</SelectItem>)}
          </SelectContent>
        </Select>
        <button onClick={() => setLowOnly(!lowOnly)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${lowOnly ? 'bg-red-50 border-red-300 text-red-700' : 'bg-background border-border'}`}>
          <AlertTriangle className="w-4 h-4" />Low Stock Only
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {['Name','Category','Quantity','Unit Cost','Reorder Level','Supplier','Status',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const isLow = item.is_low_stock || (item.reorder_level > 0 && item.quantity <= item.reorder_level);
                return (
                  <tr key={item.id} className={`border-t hover:bg-muted/30 ${isLow ? 'bg-red-50/50' : ''}`}>
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3"><Badge variant="secondary" className="text-xs">{item.category?.replace('_',' ')}</Badge></td>
                    <td className="px-4 py-3 font-mono">{item.quantity} {item.unit}</td>
                    <td className="px-4 py-3">{item.unit_cost ? `$${item.unit_cost.toFixed(2)}` : '—'}</td>
                    <td className="px-4 py-3">{item.reorder_level || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.supplier || '—'}</td>
                    <td className="px-4 py-3">{isLow && <Badge variant="destructive" className="text-xs">Low Stock</Badge>}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>Edit</Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => del.mutate(item.id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No items found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Item' : 'Add Inventory Item'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace('_',' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unit</Label>
                <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} /></div>
              <div><Label>Unit Cost ($)</Label><Input type="number" value={form.unit_cost} onChange={e => setForm(f => ({ ...f, unit_cost: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Reorder Level</Label><Input type="number" value={form.reorder_level} onChange={e => setForm(f => ({ ...f, reorder_level: e.target.value }))} /></div>
              <div><Label>Supplier</Label><Input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
              <Button onClick={() => save.mutate()} disabled={!form.name || !form.quantity || save.isPending}>
                {save.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}