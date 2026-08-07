import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Search } from 'lucide-react';

// Lets a career counsellor either select an existing employer or create a new
// one inline. onPick(employer) returns the chosen Employer record.
export default function EmployerPickerDialog({ onPick, onCancel }) {
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('select');
  const [selectedId, setSelectedId] = useState('');
  const [q, setQ] = useState('');
  const [form, setForm] = useState({
    name: '', first_name: '', last_name: '', position: '',
    contact_email: '', contact_phone: '', address: '', industry: '',
    alt_contact_name: '', alt_contact_position: '', alt_contact_phone: '', alt_contact_email: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchEmployers = async () => {
    setLoading(true);
    try { setEmployers((await base44.entities.Employer.list('-created_date', 500)) || []); } catch {}
    finally { setLoading(false); }
  };
  useEffect(() => { fetchEmployers(); }, []);

  const filtered = employers.filter(e =>
    !q || (e.name || '').toLowerCase().includes(q.toLowerCase()) || (e.contact_email || '').toLowerCase().includes(q.toLowerCase())
  );

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleCreate = async () => {
    if (!form.name.trim()) return toast.error('Company name required');
    if (!form.contact_email.trim()) return toast.error('Contact email required');
    setSaving(true);
    try {
      const created = await base44.entities.Employer.create({
        name: form.name.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        position: form.position.trim(),
        contact_name: `${form.first_name.trim()} ${form.last_name.trim()}`.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim(),
        alt_contact_name: form.alt_contact_name.trim(),
        alt_contact_position: form.alt_contact_position.trim(),
        alt_contact_phone: form.alt_contact_phone.trim(),
        alt_contact_email: form.alt_contact_email.trim(),
        address: form.address.trim(),
        industry: form.industry.trim(),
        status: 'pending',
      });
      toast.success('Employer created');
      onPick(created);
    } catch (e) {
      toast.error('Failed: ' + (e.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handlePick = () => {
    const emp = employers.find(e => e.id === selectedId);
    if (!emp) return toast.error('Select an employer');
    onPick(emp);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Choose Employer</DialogTitle></DialogHeader>
        <div className="flex gap-2 mb-3">
          <button className={`px-3 py-1.5 rounded-md text-xs font-medium ${mode === 'select' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`} onClick={() => setMode('select')}>Select existing</button>
          <button className={`px-3 py-1.5 rounded-md text-xs font-medium ${mode === 'new' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`} onClick={() => setMode('new')}>Add new employer</button>
        </div>
        {mode === 'select' ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search employers..." value={q} onChange={e => setQ(e.target.value)} className="pl-8" />
            </div>
            <div className="max-h-64 overflow-y-auto border rounded-md">
              {loading ? <div className="p-3 text-sm text-slate-500">Loading...</div> :
                filtered.length === 0 ? <div className="p-3 text-sm text-slate-500">No employers found. Try "Add new employer".</div> :
                  filtered.map(e => (
                    <button key={e.id} onClick={() => setSelectedId(e.id)} className={`w-full text-left p-3 border-b last:border-0 hover:bg-slate-50 ${selectedId === e.id ? 'bg-amber-50' : ''}`}>
                      <div className="font-medium text-sm">{e.name}</div>
                      <div className="text-xs text-slate-500">{e.contact_name} • {e.contact_email}{e.industry ? ` • ${e.industry}` : ''}</div>
                    </button>
                  ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            <Input placeholder="Company name *" value={form.name} onChange={e => set('name', e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Contact first name" value={form.first_name} onChange={e => set('first_name', e.target.value)} />
              <Input placeholder="Contact last name" value={form.last_name} onChange={e => set('last_name', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Position" value={form.position} onChange={e => set('position', e.target.value)} />
              <Input placeholder="Phone" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} />
            </div>
            <Input type="email" placeholder="Contact email (login) *" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} />
            <Input placeholder="Company address" value={form.address} onChange={e => set('address', e.target.value)} />
            <Input placeholder="Industry" value={form.industry} onChange={e => set('industry', e.target.value)} />
            <div className="text-xs font-semibold text-slate-500 pt-1">Alternate contact (optional)</div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Alt name" value={form.alt_contact_name} onChange={e => set('alt_contact_name', e.target.value)} />
              <Input placeholder="Alt position" value={form.alt_contact_position} onChange={e => set('alt_contact_position', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Alt phone" value={form.alt_contact_phone} onChange={e => set('alt_contact_phone', e.target.value)} />
              <Input placeholder="Alt email" value={form.alt_contact_email} onChange={e => set('alt_contact_email', e.target.value)} />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          {mode === 'select'
            ? <Button size="sm" onClick={handlePick} disabled={!selectedId}>Select Employer</Button>
            : <Button size="sm" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create & Select'}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}