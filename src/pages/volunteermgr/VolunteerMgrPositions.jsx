import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MapPin, Users, Clock, Pencil, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const departments = ['administration', 'programs', 'outreach', 'events', 'education', 'support_services', 'other'];
const statusColors = { open: 'bg-green-50 text-green-700', filled: 'bg-blue-50 text-blue-700', closed: 'bg-gray-50 text-gray-500' };

const emptyForm = {
  title: '', department: 'programs', location: '', description: '', responsibilities: '',
  qualifications: '', training_required: '', commitment_type: 'ongoing', hours_per_week: 0,
  supervisor: '', max_volunteers: 1, status: 'open', skills_needed: '', benefits: '',
};

export default function VolunteerMgrPositions() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();

  const { data: positions = [] } = useQuery({
    queryKey: ['vol-positions'],
    queryFn: () => base44.entities.VolunteerPosition.list('-created_date', 100),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.VolunteerPosition.update(editing.id, data)
      : base44.entities.VolunteerPosition.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vol-positions'] });
      setFormOpen(false); setEditing(null); setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VolunteerPosition.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vol-positions'] }); setDeleteTarget(null); },
  });

  const openEdit = (pos) => { setEditing(pos); setForm(pos); setFormOpen(true); };
  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Positions</h1>
          <p className="text-sm text-muted-foreground mt-1">{positions.length} volunteer positions</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm(emptyForm); setFormOpen(true); }} className="gap-2"><Plus className="w-4 h-4" /> New Position</Button>
      </div>

      <div className="grid gap-4">
        {positions.map(pos => (
          <Card key={pos.id} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{pos.title}</h3>
                    <Badge className={`text-xs ${statusColors[pos.status]}`}>{pos.status}</Badge>
                    <Badge variant="outline" className="text-xs capitalize">{pos.department?.replace(/_/g, ' ')}</Badge>
                  </div>
                  {pos.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{pos.description}</p>}
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                    {pos.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{pos.location}</span>}
                    {pos.max_volunteers && <span className="flex items-center gap-1"><Users className="w-3 h-3" />Max {pos.max_volunteers}</span>}
                    {pos.hours_per_week > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{pos.hours_per_week}h/wk</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(pos)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(pos)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {positions.length === 0 && <div className="text-center py-12 text-muted-foreground">No positions yet.</div>}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Position?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete "{deleteTarget?.title}".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteTarget.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={formOpen} onOpenChange={o => { setFormOpen(o); if (!o) { setEditing(null); setForm(emptyForm); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Position' : 'New Position'}</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => update('title', e.target.value)} required /></div>
            <div>
              <Label>Department *</Label>
              <Select value={form.department} onValueChange={v => update('department', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => <SelectItem key={d} value={d}>{d.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Location</Label><Input value={form.location} onChange={e => update('location', e.target.value)} /></div>
              <div><Label>Supervisor</Label><Input value={form.supervisor} onChange={e => update('supervisor', e.target.value)} /></div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3} /></div>
            <div><Label>Responsibilities</Label><Textarea value={form.responsibilities} onChange={e => update('responsibilities', e.target.value)} rows={2} /></div>
            <div><Label>Qualifications</Label><Textarea value={form.qualifications} onChange={e => update('qualifications', e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Max Volunteers</Label><Input type="number" min="1" value={form.max_volunteers} onChange={e => update('max_volunteers', Number(e.target.value))} /></div>
              <div><Label>Hours/Week</Label><Input type="number" min="0" value={form.hours_per_week} onChange={e => update('hours_per_week', Number(e.target.value))} /></div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => update('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="filled">Filled</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
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