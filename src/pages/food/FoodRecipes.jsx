import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Clock, Users, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIES = ['appetizer','entree','side','dessert','beverage','breakfast','sauce','base'];
const EMPTY_RECIPE = { name: '', description: '', category: 'entree', servings: '', prep_time_minutes: '', cook_time_minutes: '', image_url: '', tags: [], ingredients: [], steps: [] };
const EMPTY_ING = { name: '', amount: '', unit: '' };
const EMPTY_STEP = { step_number: 1, instruction: '', duration_minutes: '', tip: '' };

export default function FoodRecipes() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [dialog, setDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(null);
  const [form, setForm] = useState(EMPTY_RECIPE);
  const [editing, setEditing] = useState(null);
  const [checkedSteps, setCheckedSteps] = useState({});

  const { data: recipes = [], isLoading } = useQuery({ queryKey: ['recipes'], queryFn: () => base44.entities.Recipe.list() });

  const save = useMutation({
    mutationFn: async () => {
      const data = { ...form, servings: parseInt(form.servings) || 0, prep_time_minutes: parseInt(form.prep_time_minutes) || 0, cook_time_minutes: parseInt(form.cook_time_minutes) || 0 };
      if (editing) return base44.entities.Recipe.update(editing, data);
      return base44.entities.Recipe.create(data);
    },
    onSuccess: () => { qc.invalidateQueries(['recipes']); setDialog(false); setForm(EMPTY_RECIPE); setEditing(null); }
  });

  const del = useMutation({
    mutationFn: (id) => base44.entities.Recipe.delete(id),
    onSuccess: () => qc.invalidateQueries(['recipes'])
  });

  const openEdit = (recipe) => { setEditing(recipe.id); setForm({ ...recipe, servings: recipe.servings?.toString(), prep_time_minutes: recipe.prep_time_minutes?.toString(), cook_time_minutes: recipe.cook_time_minutes?.toString() }); setDialog(true); };
  const openNew = () => { setEditing(null); setForm(EMPTY_RECIPE); setDialog(true); };

  const filtered = recipes.filter(r => r.name?.toLowerCase().includes(search.toLowerCase()) && (catFilter === 'all' || r.category === catFilter));

  const addIngredient = () => setForm(f => ({ ...f, ingredients: [...f.ingredients, { ...EMPTY_ING }] }));
  const addStep = () => setForm(f => ({ ...f, steps: [...f.steps, { ...EMPTY_STEP, step_number: f.steps.length + 1 }] }));
  const updateIng = (i, field, val) => setForm(f => ({ ...f, ingredients: f.ingredients.map((ing, idx) => idx === i ? { ...ing, [field]: val } : ing) }));
  const updateStep = (i, field, val) => setForm(f => ({ ...f, steps: f.steps.map((s, idx) => idx === i ? { ...s, [field]: val } : s) }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Recipes</h1><p className="text-muted-foreground text-sm">Your kitchen recipe library</p></div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />New Recipe</Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search recipes..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No recipes found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(recipe => (
            <Card key={recipe.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setViewDialog(recipe); setCheckedSteps({}); }}>
              {recipe.image_url && <img src={recipe.image_url} alt={recipe.name} className="w-full h-40 object-cover rounded-t-lg" />}
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{recipe.name}</h3>
                  <Badge variant="secondary" className="text-xs flex-shrink-0">{recipe.category}</Badge>
                </div>
                {recipe.description && <p className="text-xs text-muted-foreground line-clamp-2">{recipe.description}</p>}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {recipe.prep_time_minutes > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{recipe.prep_time_minutes + (recipe.cook_time_minutes || 0)} min</span>}
                  {recipe.servings > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{recipe.servings} servings</span>}
                </div>
                <div className="flex justify-end gap-1 pt-1" onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(recipe)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del.mutate(recipe.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Recipe Dialog */}
      {viewDialog && (
        <Dialog open={!!viewDialog} onOpenChange={() => setViewDialog(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{viewDialog.name}</DialogTitle></DialogHeader>
            {viewDialog.image_url && <img src={viewDialog.image_url} alt={viewDialog.name} className="w-full h-48 object-cover rounded-lg" />}
            <div className="flex gap-4 text-sm text-muted-foreground">
              {viewDialog.prep_time_minutes > 0 && <span>Prep: {viewDialog.prep_time_minutes} min</span>}
              {viewDialog.cook_time_minutes > 0 && <span>Cook: {viewDialog.cook_time_minutes} min</span>}
              {viewDialog.servings > 0 && <span>Serves: {viewDialog.servings}</span>}
            </div>
            {viewDialog.description && <p className="text-sm text-muted-foreground">{viewDialog.description}</p>}
            {viewDialog.ingredients?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Ingredients</h3>
                <ul className="space-y-1">
                  {viewDialog.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="rounded" onChange={e => setCheckedSteps(p => ({ ...p, [`i${i}`]: e.target.checked }))} checked={!!checkedSteps[`i${i}`]} />
                      <span className={checkedSteps[`i${i}`] ? 'line-through text-muted-foreground' : ''}>{ing.amount} {ing.unit} {ing.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {viewDialog.steps?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Steps</h3>
                <ol className="space-y-3">
                  {viewDialog.steps.map((step, i) => (
                    <li key={i} className={`flex gap-3 p-3 rounded-lg border text-sm ${checkedSteps[`s${i}`] ? 'bg-muted/50 opacity-70' : 'bg-background'}`}>
                      <button onClick={() => setCheckedSteps(p => ({ ...p, [`s${i}`]: !p[`s${i}`] }))}
                        className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${checkedSteps[`s${i}`] ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground'}`}>{i + 1}</button>
                      <div>
                        <p className={checkedSteps[`s${i}`] ? 'line-through' : ''}>{step.instruction}</p>
                        {step.tip && <p className="text-xs text-muted-foreground mt-1">💡 {step.tip}</p>}
                        {step.duration_minutes > 0 && <p className="text-xs text-muted-foreground mt-1"><Clock className="w-3 h-3 inline mr-1" />{step.duration_minutes} min</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Recipe' : 'New Recipe'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Servings</Label><Input type="number" value={form.servings} onChange={e => setForm(f => ({ ...f, servings: e.target.value }))} /></div>
              <div><Label>Prep Time (min)</Label><Input type="number" value={form.prep_time_minutes} onChange={e => setForm(f => ({ ...f, prep_time_minutes: e.target.value }))} /></div>
              <div><Label>Cook Time (min)</Label><Input type="number" value={form.cook_time_minutes} onChange={e => setForm(f => ({ ...f, cook_time_minutes: e.target.value }))} /></div>
              <div className="col-span-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="col-span-2"><Label>Image URL</Label><Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} /></div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2"><Label className="font-semibold">Ingredients</Label><Button variant="outline" size="sm" onClick={addIngredient}><Plus className="w-3 h-3 mr-1" />Add</Button></div>
              {form.ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <Input placeholder="Name" value={ing.name} onChange={e => updateIng(i, 'name', e.target.value)} />
                  <Input placeholder="Amount" className="w-24" value={ing.amount} onChange={e => updateIng(i, 'amount', e.target.value)} />
                  <Input placeholder="Unit" className="w-20" value={ing.unit} onChange={e => updateIng(i, 'unit', e.target.value)} />
                  <Button variant="ghost" size="icon" className="text-destructive flex-shrink-0" onClick={() => setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, j) => j !== i) }))}><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2"><Label className="font-semibold">Steps</Label><Button variant="outline" size="sm" onClick={addStep}><Plus className="w-3 h-3 mr-1" />Add</Button></div>
              {form.steps.map((step, i) => (
                <div key={i} className="flex gap-2 mb-2 items-start">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-2">{i + 1}</span>
                  <div className="flex-1 space-y-1">
                    <Input placeholder="Instruction" value={step.instruction} onChange={e => updateStep(i, 'instruction', e.target.value)} />
                    <Input placeholder="Tip (optional)" value={step.tip} onChange={e => updateStep(i, 'tip', e.target.value)} />
                  </div>
                  <Input placeholder="Min" className="w-16 mt-2" value={step.duration_minutes} onChange={e => updateStep(i, 'duration_minutes', e.target.value)} />
                  <Button variant="ghost" size="icon" className="text-destructive flex-shrink-0 mt-2" onClick={() => setForm(f => ({ ...f, steps: f.steps.filter((_, j) => j !== i) }))}><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
              <Button onClick={() => save.mutate()} disabled={!form.name || save.isPending}>{save.isPending ? 'Saving...' : 'Save Recipe'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}