import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLocation } from 'react-router-dom';
import { UtensilsCrossed, Search, Plus, Pencil, Trash2 } from 'lucide-react';
import FoodAreaHeader from '@/components/food/FoodAreaHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const AREA_LABELS = {
  'cafe-candeur': 'Cafe Candeur',
  'auntie-bevs': "Auntie Bev's",
};

// Tag each menu item by area using a tag convention: "cafe-candeur" or "auntie-bevs"
export default function FoodAreaMenu() {
  const location = useLocation();
  const segment = location.pathname.split('/').filter(Boolean)[1];
  const areaLabel = AREA_LABELS[segment] || 'Menu';
  const areaTag = segment;

  const qc = useQueryClient();
  const { data: allItems = [] } = useQuery({ queryKey: ['menu-items'], queryFn: () => base44.entities.MenuItem.list() });
  const createItem = useMutation({ mutationFn: d => base44.entities.MenuItem.create(d), onSuccess: () => qc.invalidateQueries(['menu-items']) });
  const updateItem = useMutation({ mutationFn: ({ id, data }) => base44.entities.MenuItem.update(id, data), onSuccess: () => qc.invalidateQueries(['menu-items']) });
  const deleteItem = useMutation({ mutationFn: id => base44.entities.MenuItem.delete(id), onSuccess: () => qc.invalidateQueries(['menu-items']) });

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: 'entree', is_available: true });

  // Filter items belonging to this area by tag
  const items = allItems.filter(i =>
    (i.tags || []).includes(areaTag) &&
    (!search || i.name?.toLowerCase().includes(search.toLowerCase()))
  );

  const openNew = () => { setEditing(null); setForm({ name: '', description: '', price: '', category: 'entree', is_available: true }); setDialogOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm({ name: item.name, description: item.description || '', price: item.price || '', category: item.category || 'entree', is_available: item.is_available !== false }); setDialogOpen(true); };

  const handleSave = () => {
    const data = { ...form, price: parseFloat(form.price) || 0, tags: [...new Set([...(editing?.tags || []), areaTag])] };
    if (editing) updateItem.mutate({ id: editing.id, data });
    else createItem.mutate(data);
    setDialogOpen(false);
  };

  const CATEGORIES = ['appetizer','entree','side','dessert','beverage','breakfast','lunch_special','catering'];

  return (
    <div>
      <FoodAreaHeader area={areaTag} />
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} item{items.length !== 1 ? 's' : ''}</p>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Add Item</Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <UtensilsCrossed className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No menu items yet for {areaLabel}</p>
          <Button variant="outline" className="mt-4" onClick={openNew}>Add First Item</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <Card key={item.id} className="overflow-hidden">
              {item.image_url && <img src={item.image_url} alt={item.name} className="w-full h-32 object-cover" />}
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{item.name}</div>
                    {item.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</div>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm font-bold">${item.price?.toFixed(2)}</span>
                      <Badge variant={item.is_available ? 'default' : 'secondary'} className="text-xs capitalize">{item.is_available ? 'Available' : 'Unavailable'}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteItem.mutate(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Item' : 'New Menu Item'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Input placeholder="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <Input type="number" placeholder="Price" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full border rounded-md px-3 py-2 text-sm bg-background">
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c.replace('_', ' ')}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_available} onChange={e => setForm(f => ({ ...f, is_available: e.target.checked }))} />
              Available
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name}>{editing ? 'Save' : 'Create'}</Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}