import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, GraduationCap, Trash2 } from 'lucide-react';

export default function VolunteerMgrTraining() {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', modules: [], total_hours: 0, status: 'active' });
  const [moduleInput, setModuleInput] = useState({ name: '', description: '', duration_hours: 1, required: true });
  const queryClient = useQueryClient();

  const { data: pathways = [] } = useQuery({
    queryKey: ['vol-pathways'],
    queryFn: () => base44.entities.VolunteerTrainingPathway.list('-created_date', 50),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.VolunteerTrainingPathway.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vol-pathways'] });
      setFormOpen(false);
      setForm({ title: '', description: '', modules: [], total_hours: 0, status: 'active' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VolunteerTrainingPathway.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vol-pathways'] }); setDeleteTarget(null); },
  });

  const addModule = () => {
    if (!moduleInput.name) return;
    const newModules = [...(form.modules || []), moduleInput];
    const totalH = newModules.reduce((s, m) => s + (m.duration_hours || 0), 0);
    setForm({ ...form, modules: newModules, total_hours: totalH });
    setModuleInput({ name: '', description: '', duration_hours: 1, required: true });
  };

  const removeModule = (idx) => {
    const newModules = form.modules.filter((_, i) => i !== idx);
    setForm({ ...form, modules: newModules, total_hours: newModules.reduce((s, m) => s + (m.duration_hours || 0), 0) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Training Pathways</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage volunteer training programs</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> New Pathway</Button>
      </div>

      <div className="grid gap-4">
        {pathways.map(pw => (
          <Card key={pw.id} className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    {pw.title}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">{pw.total_hours || 0} hours · {pw.modules?.length || 0} modules</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs capitalize">{pw.status}</Badge>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(pw.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {pw.description && <p className="text-sm text-muted-foreground mb-3">{pw.description}</p>}
              <div className="space-y-1.5">
                {pw.modules?.map((mod, i) => (
                  <div key={i} className="flex items-center justify-between text-sm bg-muted/40 rounded px-3 py-1.5">
                    <span>{mod.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{mod.duration_hours}h</span>
                      {mod.required && <Badge variant="outline" className="text-[10px]">Required</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {pathways.length === 0 && <div className="text-center py-12 text-muted-foreground">No training pathways yet.</div>}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Training Pathway?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this training pathway.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteTarget)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={formOpen} onOpenChange={o => { setFormOpen(o); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Training Pathway</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
            <div className="border rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">Add Modules</p>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Module Name</Label><Input value={moduleInput.name} onChange={e => setModuleInput(p => ({ ...p, name: e.target.value }))} placeholder="Module name" /></div>
                <div><Label className="text-xs">Hours</Label><Input type="number" min="0.5" step="0.5" value={moduleInput.duration_hours} onChange={e => setModuleInput(p => ({ ...p, duration_hours: Number(e.target.value) }))} /></div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addModule}>+ Add Module</Button>
              {form.modules?.map((mod, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-muted/40 rounded px-3 py-1.5">
                  <span>{mod.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{mod.duration_hours}h</span>
                    <button type="button" onClick={() => removeModule(i)} className="text-destructive hover:text-destructive/70 text-xs">Remove</button>
                  </div>
                </div>
              ))}
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