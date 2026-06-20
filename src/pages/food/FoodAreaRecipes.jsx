import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLocation } from 'react-router-dom';
import { BookOpen, Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const AREA_LABELS = {
  'cafe-candeur': 'Cafe Candeur',
  'auntie-bevs': "Auntie Bev's",
};

export default function FoodAreaRecipes() {
  const location = useLocation();
  const segment = location.pathname.split('/').filter(Boolean)[1];
  const areaLabel = AREA_LABELS[segment] || 'Recipes';
  const areaTag = segment;

  const qc = useQueryClient();
  const { data: allRecipes = [] } = useQuery({ queryKey: ['recipes'], queryFn: () => base44.entities.Recipe.list() });
  const createRecipe = useMutation({ mutationFn: d => base44.entities.Recipe.create(d), onSuccess: () => qc.invalidateQueries(['recipes']) });
  const updateRecipe = useMutation({ mutationFn: ({ id, data }) => base44.entities.Recipe.update(id, data), onSuccess: () => qc.invalidateQueries(['recipes']) });
  const deleteRecipe = useMutation({ mutationFn: id => base44.entities.Recipe.delete(id), onSuccess: () => qc.invalidateQueries(['recipes']) });

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', category: 'entree', servings: '', prep_time_minutes: '', cook_time_minutes: '' });

  const recipes = allRecipes.filter(r =>
    (r.tags || []).includes(areaTag) &&
    (!search || r.name?.toLowerCase().includes(search.toLowerCase()))
  );

  const openNew = () => { setEditing(null); setForm({ name: '', description: '', category: 'entree', servings: '', prep_time_minutes: '', cook_time_minutes: '' }); setDialogOpen(true); };
  const openEdit = (r) => { setEditing(r); setForm({ name: r.name, description: r.description || '', category: r.category || 'entree', servings: r.servings || '', prep_time_minutes: r.prep_time_minutes || '', cook_time_minutes: r.cook_time_minutes || '' }); setDialogOpen(true); };

  const handleSave = () => {
    const data = { ...form, servings: parseInt(form.servings) || null, prep_time_minutes: parseInt(form.prep_time_minutes) || null, cook_time_minutes: parseInt(form.cook_time_minutes) || null, tags: [...new Set([...(editing?.tags || []), areaTag])] };
    if (editing) updateRecipe.mutate({ id: editing.id, data });
    else createRecipe.mutate(data);
    setDialogOpen(false);
  };

  const CATEGORIES = ['appetizer','entree','side','dessert','beverage','breakfast','sauce','base'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{areaLabel} — Recipes</h1>
          <p className="text-sm text-muted-foreground mt-1">{recipes.length} recipe{recipes.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Add Recipe</Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No recipes yet for {areaLabel}</p>
          <Button variant="outline" className="mt-4" onClick={openNew}>Add First Recipe</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map(r => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{r.name}</div>
                    {r.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.description}</div>}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge variant="secondary" className="text-xs capitalize">{r.category}</Badge>
                      {r.servings && <span className="text-xs text-muted-foreground">{r.servings} servings</span>}
                      {r.prep_time_minutes && <span className="text-xs text-muted-foreground">Prep {r.prep_time_minutes}m</span>}
                      {r.cook_time_minutes && <span className="text-xs text-muted-foreground">Cook {r.cook_time_minutes}m</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteRecipe.mutate(r.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Recipe' : 'New Recipe'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Input placeholder="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full border rounded-md px-3 py-2 text-sm bg-background">
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
            <div className="grid grid-cols-3 gap-2">
              <Input type="number" placeholder="Servings" value={form.servings} onChange={e => setForm(f => ({ ...f, servings: e.target.value }))} />
              <Input type="number" placeholder="Prep (min)" value={form.prep_time_minutes} onChange={e => setForm(f => ({ ...f, prep_time_minutes: e.target.value }))} />
              <Input type="number" placeholder="Cook (min)" value={form.cook_time_minutes} onChange={e => setForm(f => ({ ...f, cook_time_minutes: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name}>{editing ? 'Save' : 'Create'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}