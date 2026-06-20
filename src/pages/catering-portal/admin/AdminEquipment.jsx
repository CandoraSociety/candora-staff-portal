import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

const CATS = ['serving_equipment','linens','furniture','audio_visual','kitchen','other'];
const EMPTY = { name:'', description:'', category:'serving_equipment', quantity_available:'', price_per_unit:'', price_per_day:'', is_active:true };
const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm";

export default function AdminEquipment() {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [catFilter, setCatFilter] = useState('all');

  const { data: items = [] } = useQuery({ queryKey: ['admin-equipment'], queryFn: () => base44.entities.RentalEquipment.list() });

  const save = useMutation({
    mutationFn: () => {
      const data = { ...form, quantity_available: parseInt(form.quantity_available) || 0, price_per_unit: parseFloat(form.price_per_unit) || 0, price_per_day: parseFloat(form.price_per_day) || 0 };
      return editing ? base44.entities.RentalEquipment.update(editing, data) : base44.entities.RentalEquipment.create(data);
    },
    onSuccess: () => { qc.invalidateQueries(['admin-equipment']); setDialog(false); setForm(EMPTY); setEditing(null); }
  });

  const del = useMutation({ mutationFn: (id) => base44.entities.RentalEquipment.delete(id), onSuccess: () => qc.invalidateQueries(['admin-equipment']) });
  const toggle = useMutation({ mutationFn: ({ id, v }) => base44.entities.RentalEquipment.update(id, { is_active: v }), onSuccess: () => qc.invalidateQueries(['admin-equipment']) });

  const openEdit = (item) => { setEditing(item.id); setForm({ ...item, quantity_available: item.quantity_available?.toString(), price_per_unit: item.price_per_unit?.toString(), price_per_day: item.price_per_day?.toString() }); setDialog(true); };

  const filtered = items.filter(i => catFilter === 'all' || i.category === catFilter);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-gray-800">Rental Equipment</h1>
        <button onClick={() => { setEditing(null); setForm(EMPTY); setDialog(true); }} className="flex items-center gap-2 bg-cp-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90"><Plus className="w-4 h-4" /> Add Equipment</button>
      </div>

      <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
        <option value="all">All Categories</option>
        {CATS.map(c => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
      </select>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
            <tr>{['Name','Category','Qty','$/Unit','$/Day','Active',''].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-gray-400 capitalize text-xs">{item.category?.replace(/_/g,' ')}</td>
                <td className="px-4 py-3">{item.quantity_available}</td>
                <td className="px-4 py-3">${item.price_per_unit}</td>
                <td className="px-4 py-3">${item.price_per_day}</td>
                <td className="px-4 py-3"><input type="checkbox" checked={item.is_active} onChange={e => toggle.mutate({ id: item.id, v: e.target.checked })} className="accent-cp-primary" /></td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => openEdit(item)} className="text-xs text-cp-primary hover:underline">Edit</button>
                  <button onClick={() => { if (confirm(`Delete "${item.name}"?`)) del.mutate(item.id); }} className="text-xs text-red-400 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">No equipment found.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Equipment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-xs font-medium text-gray-500">Name</label><input className={inputCls} value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} /></div>
            <div><label className="text-xs font-medium text-gray-500">Description</label><textarea rows={2} className={inputCls} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} /></div>
            <div><label className="text-xs font-medium text-gray-500">Category</label>
              <select className={inputCls} value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>{CATS.map(c => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}</select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs font-medium text-gray-500">Qty Available</label><input type="number" className={inputCls} value={form.quantity_available} onChange={e => setForm(f => ({...f, quantity_available: e.target.value}))} /></div>
              <div><label className="text-xs font-medium text-gray-500">$/Unit</label><input type="number" className={inputCls} value={form.price_per_unit} onChange={e => setForm(f => ({...f, price_per_unit: e.target.value}))} /></div>
              <div><label className="text-xs font-medium text-gray-500">$/Day</label><input type="number" className={inputCls} value={form.price_per_day} onChange={e => setForm(f => ({...f, price_per_day: e.target.value}))} /></div>
            </div>
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