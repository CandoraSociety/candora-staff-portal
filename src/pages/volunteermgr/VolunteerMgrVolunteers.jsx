import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Mail, Phone, Pencil } from 'lucide-react';

const statusColors = {
  active: 'bg-green-50 text-green-700 border-green-200',
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  occasional: 'bg-blue-50 text-blue-700 border-blue-200',
  inactive: 'bg-gray-50 text-gray-500 border-gray-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
};

const emptyForm = {
  first_name: '', last_name: '', email: '', phone: '', volunteer_type: 'community',
  status: 'active', start_date: '', skills: '', availability: '', notes: '',
};

export default function VolunteerMgrVolunteers() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const queryClient = useQueryClient();

  const { data: volunteers = [], isLoading } = useQuery({
    queryKey: ['vol-volunteers'],
    queryFn: () => base44.entities.Volunteer.list('-created_date', 200),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.Volunteer.update(editing.id, data)
      : base44.entities.Volunteer.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vol-volunteers'] });
      setFormOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
  });

  const openEdit = (vol) => { setEditing(vol); setForm(vol); setFormOpen(true); };
  const openNew = () => { setEditing(null); setForm(emptyForm); setFormOpen(true); };
  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const filtered = volunteers.filter(v => {
    const matchesSearch = `${v.first_name} ${v.last_name} ${v.email}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    const matchesType = typeFilter === 'all' || v.volunteer_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Volunteers</h1>
          <p className="text-sm text-muted-foreground mt-1">{volunteers.length} total volunteers</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Add Volunteer</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search volunteers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="occasional">Occasional</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="community">Community</SelectItem>
            <SelectItem value="skilled">Skilled</SelectItem>
            <SelectItem value="practicum">Practicum</SelectItem>
            <SelectItem value="corporate">Corporate</SelectItem>
            <SelectItem value="internal_placement">Internal Placement</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(vol => (
            <Card key={vol.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {vol.first_name?.[0]}{vol.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">
                    {vol.volunteer_type === 'corporate' ? vol.company_name || 'Unknown Company' : `${vol.first_name} ${vol.last_name}`}
                    {vol.is_deceased && ' 🕊️'}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {vol.email && <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{vol.email}</span>}
                    {vol.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{vol.phone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs capitalize">{vol.volunteer_type?.replace(/_/g, ' ')}</Badge>
                  <Badge className={`text-xs border ${statusColors[vol.status] || statusColors.inactive}`}>{vol.status}</Badge>
                  <span className="text-xs text-muted-foreground">{Math.round(vol.total_hours || 0)} hrs</span>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(vol)}><Pencil className="w-3.5 h-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground">No volunteers found.</div>}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={o => { setFormOpen(o); if (!o) { setEditing(null); setForm(emptyForm); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Volunteer' : 'Add Volunteer'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>First Name *</Label><Input value={form.first_name} onChange={e => update('first_name', e.target.value)} required /></div>
              <div><Label>Last Name *</Label><Input value={form.last_name} onChange={e => update('last_name', e.target.value)} required /></div>
            </div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => update('email', e.target.value)} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => update('phone', e.target.value)} /></div>
            <div>
              <Label>Volunteer Type *</Label>
              <Select value={form.volunteer_type} onValueChange={v => update('volunteer_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="community">Community</SelectItem>
                  <SelectItem value="skilled">Skilled</SelectItem>
                  <SelectItem value="practicum">Practicum</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="internal_placement">Internal Placement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => update('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="occasional">Occasional</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => update('start_date', e.target.value)} /></div>
            <div><Label>Skills</Label><Textarea value={form.skills} onChange={e => update('skills', e.target.value)} rows={2} /></div>
            <div><Label>Availability</Label><Input value={form.availability} onChange={e => update('availability', e.target.value)} /></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={2} /></div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : 'Save'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}