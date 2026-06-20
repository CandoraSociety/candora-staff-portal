import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

const CATS = ['appetizers','entrees','sides','desserts','beverages','platters'];
const EMPTY = { name:'', description:'', style:'buffet', category:'entrees', price_per_person:'', price_per_unit:'', dietary_tags:'', is_active:true };
const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm";

export default function AdminMenus() {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [styleFilter, setStyleFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');

  const { data: items = [] } = useQuery({ queryKey: ['admin-menu-items'], queryFn: () => base44.entities.CateringMenuItem.list() });

  const save = useMutation({
    mutationFn: () => {
      const data = { ...form, dietary_tags: form.dietary_tags ? form.dietary_tags.split(',').map(t => t.trim()).filter(Boolean) : [], price_per_person: parseFloat(form.price_per_person) || undefined, price_per_unit: parseFloat(form.price_per_unit) || undefined };
      return editing ? base44.entities.CateringMenuItem.update(editing, data) : base44.entities.CateringMenuItem.create(data);
    },
    onSuccess: () => { qc.invalidateQueries(['admin-menu-items']); setDialog(false); setForm(EMPTY); setEditing(null); }
  });

  const del = useMutation({ mutationFn: (id) => base44.entities.CateringMenuItem.delete(id), onSuccess: () => qc.invalidateQueries(['admin-menu-items']) });
  const toggle = useMutation({ mutationFn: ({ id, v }) => base44.entities.CateringMenuItem.update(id, { is_active: v }), onSuccess: () => qc.invalidateQueries(['admin-menu-items']) });

  const openNew = () => { setEditing(null); setForm(EMPTY); setDialog(true); };
  const openEdit = (item) => { setEditing(item.id); setForm({ ...item, dietary_tags: (item.dietary_tags || []).join(', '), price_per_person: item.price_per_person?.toString() || '', price_per_unit: item.price_per_unit?.toString() || '' }); setDialog(true); };

  const filtered = items.filter(i => (styleFilter === 'all' || i.style === styleFilter) && (catFilter === 'all' || i.category === catFilter));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-gray-800">Catering Menu Items</h1>
        <button onClick={openNew} className="flex items-center gap-2 bg-cp-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90"><Plus className="w-4 h-4" /> Add Item</button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select value={styleFilter} onChange={e => setStyleFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="all">All Styles</option><option value="buffet">Buffet</option><option value="plated">Plated</option>
        </select>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="all">All Categories</option>
          {CATS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
            <tr>{['Name','Style','Category','$/person','$/unit','Dietary Tags','Active',''].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${item.style === 'plated' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>{item.style}</span></td>
                <td className="px-4 py-3 capitalize text-gray-500">{item.category}</td>
                <td className="px-4 py-3">{item.price_per_person ? `$${item.price_per_person}` : '—'}</td>
                <td className="px-4 py-3">{item.price_per_unit ? `$${item.price_per_unit}` : '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{(item.dietary_tags || []).join(', ') || '—'}</td>
                <td className="px-4 py-3"><input type="checkbox" checked={item.is_active} onChange={e => toggle.mutate({ id: item.id, v: e.target.checked })} className="accent-cp-primary" /></td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => openEdit(item)} className="text-xs text-cp-primary hover:underline">Edit</button>
                  <button onClick={() => { if (confirm(`Delete "${item.name}"?`)) del.mutate(item.id); }} className="text-xs text-red-400 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-gray-400">No items found.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Menu Item</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-xs font-medium text-gray-500">Name</label><input className={inputCls} value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} /></div>
            <div><label className="text-xs font-medium text-gray-500">Description</label><textarea rows={2} className={inputCls} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-gray-500">Style</label>
                <select className={inputCls} value={form.style} onChange={e => setForm(f => ({...f, style: e.target.value}))}><option value="buffet">Buffet</option><option value="plated">Plated</option></select>
              </div>
              <div><label className="text-xs font-medium text-gray-500">Category</label>
                <select className={inputCls} value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>{CATS.map(c => <option key={c} value={c}>{c}</option>)}</select>
              </div>
              <div><label className="text-xs font-medium text-gray-500">Price/Person ($)</label><input type="number" className={inputCls} value={form.price_per_person} onChange={e => setForm(f => ({...f, price_per_person: e.target.value}))} /></div>
              <div><label className="text-xs font-medium text-gray-500">Price/Unit ($)</label><input type="number" className={inputCls} value={form.price_per_unit} onChange={e => setForm(f => ({...f, price_per_unit: e.target.value}))} /></div>
            </div>
            <div><label className="text-xs font-medium text-gray-500">Dietary Tags (comma-separated)</label><input className={inputCls} value={form.dietary_tags} onChange={e => setForm(f => ({...f, dietary_tags: e.target.value}))} placeholder="vegan, gluten-free, vegetarian" /></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({...f, is_active: e.target.checked}))} className="accent-cp-primary" /><label className="text-sm">Active</label></div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setDialog(false)} className="border border-gray-200 px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={() => save.mutate()} disabled={!form.name || save.isPending} className="bg-cp-primary text-white px-5 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50">{save.isPending ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}