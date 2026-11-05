import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIES = ['beverage', 'breakfast', 'entree', 'lunch_special', 'side', 'dessert', 'appetizer', 'catering'];

const EMPTY = {
  name: '', description: '', price: '', category: 'beverage',
  section_id: '', is_available: true, is_sold_out: false, is_featured: false, tags: [],
};

export default function MenuItemDialog({ open, onOpenChange, item, sections = [], onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm({ ...EMPTY, ...(item || {}), price: item?.price ?? '' });
    setTags((item?.tags || []).filter((t) => !['cafe-candeur', 'auntie-bevs'].includes(t)).join(', '));
  }, [open, item]);

  const submit = () => {
    if (!form.name.trim()) return;
    onSave({
      ...form,
      name: form.name.trim(),
      price: Number(form.price) || 0,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit menu item' : 'Add menu item'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-[2fr_1fr] gap-3">
            <div>
              <Label>Item name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Price</Label>
              <Input type="number" min="0" step="0.25" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea rows={2} value={form.description || ''}
              placeholder="House-made, served warm"
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Section on the board</Label>
              <Select value={form.section_id || 'none'} onValueChange={(v) => setForm({ ...form, section_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {sections.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Labels (comma separated)</Label>
            <Input value={tags} placeholder="vegetarian, gluten-free, staff pick"
              onChange={(e) => setTags(e.target.value)} />
          </div>

          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!form.is_available}
                onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
              Sell this item
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!form.is_sold_out}
                onChange={(e) => setForm({ ...form, is_sold_out: e.target.checked })} />
              Sold out today (shown struck through on the screen)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!form.is_featured}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
              Feature this item
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={submit} disabled={!form.name.trim()}>Save item</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}