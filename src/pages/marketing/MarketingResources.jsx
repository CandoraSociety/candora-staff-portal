import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, BookOpen, Globe, Phone, Mail, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const RESOURCE_TYPES = [
  'print_vendor', 'design_tool', 'social_platform', 'email_service',
  'photography', 'videography', 'web_service', 'seo_tool', 'advertising', 'other'
];
const TYPE_COLORS = {
  print_vendor: 'bg-blue-100 text-blue-700', design_tool: 'bg-purple-100 text-purple-700',
  social_platform: 'bg-pink-100 text-pink-700', email_service: 'bg-yellow-100 text-yellow-700',
  photography: 'bg-green-100 text-green-700', videography: 'bg-red-100 text-red-700',
  web_service: 'bg-teal-100 text-teal-700', seo_tool: 'bg-orange-100 text-orange-700',
  advertising: 'bg-indigo-100 text-indigo-700', other: 'bg-slate-100 text-slate-700',
};

const EMPTY_FORM = { name: '', resource_type: 'print_vendor', website: '', contact_name: '', contact_email: '', contact_phone: '', description: '', services_offered: '', account_info: '', notes: '', is_active: true };

export default function MarketingResources() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterType, setFilterType] = useState('');

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['mkt-resources'],
    queryFn: () => base44.entities.MarketingResource.list(),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, data }) => id ? base44.entities.MarketingResource.update(id, data) : base44.entities.MarketingResource.create(data),
    onSuccess: () => { qc.invalidateQueries(['mkt-resources']); closeForm(); toast.success('Resource saved'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MarketingResource.delete(id),
    onSuccess: () => qc.invalidateQueries(['mkt-resources']),
  });

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (r) => { setEditing(r); setForm({ ...EMPTY_FORM, ...r }); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const filtered = resources.filter(r => !filterType || r.resource_type === filterType);

  // Group by type
  const grouped = {};
  filtered.forEach(r => { if (!grouped[r.resource_type]) grouped[r.resource_type] = []; grouped[r.resource_type].push(r); });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Resources Directory</h1>
          <p className="text-sm text-slate-500 mt-1">External vendors, tools, and services we use for marketing and fundraising.</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Add Resource</Button>
      </div>

      <Select value={filterType} onValueChange={setFilterType}>
        <SelectTrigger className="w-48"><SelectValue placeholder="All Types" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={null}>All Types</SelectItem>
          {RESOURCE_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, ' ')}</SelectItem>)}
        </SelectContent>
      </Select>

      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400"><BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>No resources added yet.</p></div>
      ) : (
        Object.entries(grouped).map(([type, items]) => (
          <div key={type}>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 capitalize">{type.replace(/_/g, ' ')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {items.map(r => (
                <Card key={r.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-800">{r.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[r.resource_type]}`}>{r.resource_type?.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(r)} className="p-1 hover:bg-slate-100 rounded"><Pencil className="w-3.5 h-3.5 text-slate-500" /></button>
                        <button onClick={() => deleteMutation.mutate(r.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                      </div>
                    </div>
                    {r.description && <p className="text-xs text-slate-500 mb-2 line-clamp-2">{r.description}</p>}
                    <div className="space-y-1 text-xs text-slate-500">
                      {r.website && (
                        <a href={r.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                          <Globe className="w-3 h-3" /> {r.website}
                        </a>
                      )}
                      {r.contact_name && <p className="flex items-center gap-1">Contact: {r.contact_name}</p>}
                      {r.contact_email && <a href={`mailto:${r.contact_email}`} className="flex items-center gap-1 hover:text-blue-600"><Mail className="w-3 h-3" /> {r.contact_email}</a>}
                      {r.contact_phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {r.contact_phone}</p>}
                    </div>
                    {r.services_offered && <p className="text-xs text-slate-400 mt-2 border-t pt-2">{r.services_offered}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Resource' : 'Add Resource'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div>
              <Label>Type</Label>
              <Select value={form.resource_type} onValueChange={v => setForm(f => ({ ...f, resource_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RESOURCE_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Website</Label><Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Contact Name</Label><Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} /></div>
              <div><Label>Contact Email</Label><Input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} /></div>
              <div className="col-span-2"><Label>Contact Phone</Label><Input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} /></div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div><Label>Services Offered</Label><Textarea value={form.services_offered} onChange={e => setForm(f => ({ ...f, services_offered: e.target.value }))} rows={2} /></div>
            <div><Label>Account Info / Notes</Label><Textarea value={form.account_info} onChange={e => setForm(f => ({ ...f, account_info: e.target.value }))} rows={2} placeholder="Account numbers, login notes, etc." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate({ id: editing?.id, data: form })} disabled={!form.name || saveMutation.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}