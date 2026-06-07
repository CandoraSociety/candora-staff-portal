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
import { Plus, Search, Mail, Phone, Pencil, MoreHorizontal, Eye, LayoutGrid, List, Upload, ArrowUpDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import VolunteerTypeBadge from '@/components/volunteermgr/VolunteerTypeBadge';
import { Link } from 'react-router-dom';

const statusColors = {
  active: 'bg-green-50 text-green-700 border-green-200',
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  occasional: 'bg-blue-50 text-blue-700 border-blue-200',
  inactive: 'bg-gray-50 text-gray-500 border-gray-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
};

const emptyForm = {
  first_name: '', last_name: '', email: '', phone: '', address: '', city: '', birth_date: '', gender: '',
  emergency_contact_name: '', emergency_contact_phone: '', volunteer_type: 'community', company_name: '', school_name: '',
  skills: '', availability: '', status: 'pending', notes: '', pin_code: '',
  allergies: '', food_restriction: '', pictures_consent: '', how_heard: '', ell_level: '',
  corporate_members: [], programs: [], is_deceased: false, deceased_date: '', start_date: '',
};

export default function VolunteerMgrVolunteers() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name_asc');
  const queryClient = useQueryClient();

  const { data: volunteers = [], isLoading } = useQuery({
    queryKey: ['vol-volunteers'],
    queryFn: () => base44.entities.Volunteer.list('-created_date', 200),
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: () => base44.entities.VolunteerProgram.list('name', 200),
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
    const matchesProgram = programFilter === 'all' || (v.programs || []).includes(programFilter);
    return matchesSearch && matchesStatus && matchesType && matchesProgram;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name_asc': return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
      case 'name_desc': return `${b.first_name} ${b.last_name}`.localeCompare(`${a.first_name} ${a.first_name}`);
      case 'start_date_newest': return new Date(b.start_date || 0) - new Date(a.start_date || 0);
      case 'start_date_oldest': return new Date(a.start_date || 0) - new Date(b.start_date || 0);
      case 'hours_desc': return (b.total_hours || 0) - (a.total_hours || 0);
      case 'hours_asc': return (a.total_hours || 0) - (b.total_hours || 0);
      case 'status': return (a.status || '').localeCompare(b.status || '');
      default: return 0;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Volunteers</h1>
          <p className="text-sm text-muted-foreground mt-1">{volunteers.length} total volunteers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.href = '/volunteermgr/import'} className="gap-2"><Upload className="w-4 h-4" /> Import</Button>
          <Button variant="outline" onClick={() => window.location.href = '/volunteermgr/email'} className="gap-2"><Mail className="w-4 h-4" /> Email</Button>
          <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Add Volunteer</Button>
        </div>
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
        <Select value={programFilter} onValueChange={setProgramFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Program" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            {programs.map((p) => (
              <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Sort" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="name_asc">Name (A → Z)</SelectItem>
            <SelectItem value="name_desc">Name (Z → A)</SelectItem>
            <SelectItem value="start_date_newest">Start Date (Newest)</SelectItem>
            <SelectItem value="start_date_oldest">Start Date (Oldest)</SelectItem>
            <SelectItem value="hours_desc">Hours (Most)</SelectItem>
            <SelectItem value="hours_asc">Hours (Least)</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 border rounded-md p-1">
          <Button size="sm" variant="ghost" onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''}><LayoutGrid className="w-4 h-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''}><List className="w-4 h-4" /></Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(vol => (
            <Card key={vol.id} className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = `/volunteermgr/volunteers/${vol.id}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {vol.is_deceased ? '🕊️' : <>{vol.first_name?.[0]}{vol.last_name?.[0]}</>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {vol.volunteer_type === 'corporate' ? `${vol.company_name || 'Unknown Company'}${vol.first_name ? ` — ${vol.first_name}` : ''}` : `${vol.first_name} ${vol.last_name}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <VolunteerTypeBadge type={vol.volunteer_type} />
                      <Badge className={`text-xs border ${statusColors[vol.status] || statusColors.inactive}`}>{vol.status}</Badge>
                    </div>
                  </div>
                </div>
                {vol.email && <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{vol.email}</p>}
                {vol.phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{vol.phone}</p>}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">{Math.round(vol.total_hours || 0)} hours</span>
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openEdit(vol); }}><Pencil className="w-3.5 h-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(vol => (
            <Card key={vol.id} className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = `/volunteermgr/volunteers/${vol.id}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {vol.is_deceased ? '🕊️' : <>{vol.first_name?.[0]}{vol.last_name?.[0]}</>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {vol.volunteer_type === 'corporate' ? `${vol.company_name || 'Unknown Company'}${vol.first_name ? ` — ${vol.first_name}` : ''}` : `${vol.first_name} ${vol.last_name}`}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {vol.email && <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{vol.email}</span>}
                    {vol.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{vol.phone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <VolunteerTypeBadge type={vol.volunteer_type} />
                  <Badge className={`text-xs border ${statusColors[vol.status] || statusColors.inactive}`}>{vol.status}</Badge>
                  <span className="text-xs text-muted-foreground">{Math.round(vol.total_hours || 0)} hrs</span>
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openEdit(vol); }}><Pencil className="w-3.5 h-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
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