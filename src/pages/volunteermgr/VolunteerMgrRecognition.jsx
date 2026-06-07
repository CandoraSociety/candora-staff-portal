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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Award, Trash2, Trophy, Clock } from 'lucide-react';
import moment from 'moment';
import { getUnawardedMilestones } from '@/lib/milestones';
import EmptyState from '@/components/shared/EmptyState';

const RECOGNITION_TYPES = [
  { value: 'milestone_hours', label: '⏱️ Milestone Hours' },
  { value: 'years_of_service', label: '🏆 Years of Service' },
  { value: 'volunteer_of_month', label: '⭐ Volunteer of the Month' },
  { value: 'outstanding_service', label: '🌟 Outstanding Service' },
  { value: 'special_achievement', label: '🎖️ Special Achievement' },
];

const emptyForm = {
  volunteer_id: '', volunteer_name: '', type: 'outstanding_service',
  title: '', description: '', date_awarded: moment().format('YYYY-MM-DD'), awarded_by: '',
};

export default function VolunteerMgrRecognition() {
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [awardDialog, setAwardDialog] = useState(null); // { volunteer, milestone }
  const [awardForm, setAwardForm] = useState({});
  const queryClient = useQueryClient();

  const { data: recognitions = [] } = useQuery({
    queryKey: ['vol-recognitions'],
    queryFn: () => base44.entities.VolunteerRecognition.list('-date_awarded', 200),
  });

  const { data: volunteers = [] } = useQuery({
    queryKey: ['vol-volunteers'],
    queryFn: () => base44.entities.Volunteer.list(undefined, 500),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.VolunteerRecognition.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vol-recognitions'] });
      queryClient.invalidateQueries({ queryKey: ['vol-recognitions-all'] });
      setFormOpen(false);
      setAwardDialog(null);
      setForm({ ...emptyForm });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VolunteerRecognition.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vol-recognitions'] }); setDeleteTarget(null); },
  });

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const selectVolunteer = (volId) => {
    const vol = volunteers.find(v => v.id === volId);
    setForm(p => ({ ...p, volunteer_id: volId, volunteer_name: vol ? `${vol.first_name} ${vol.last_name}` : '' }));
  };
  const getTypeLabel = (type) => RECOGNITION_TYPES.find(t => t.value === type)?.label || type?.replace(/_/g, ' ');

  // Pending milestones across all volunteers
  const volunteersWithPending = volunteers
    .filter(v => !v.is_deceased)
    .map(v => {
      const volRecs = recognitions.filter(r => r.volunteer_id === v.id);
      const pending = getUnawardedMilestones(v, volRecs);
      return { volunteer: v, pending };
    })
    .filter(v => v.pending.length > 0);

  const openAwardDialog = (volunteer, milestone) => {
    setAwardDialog({ volunteer, milestone });
    setAwardForm({
      volunteer_id: volunteer.id,
      volunteer_name: `${volunteer.first_name} ${volunteer.last_name}`,
      type: milestone.type,
      title: milestone.title,
      description: milestone.description,
      milestone_key: milestone.milestone_key,
      date_awarded: moment().format('YYYY-MM-DD'),
      awarded_by: 'Volunteer Manager',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Recognition</h1>
          <p className="text-sm text-muted-foreground mt-1">{recognitions.length} awards given</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Award Recognition</Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Awards ({recognitions.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Milestones
            {volunteersWithPending.length > 0 && (
              <Badge className="ml-2 bg-yellow-400 text-yellow-900 border-0 text-xs">{volunteersWithPending.reduce((s, v) => s + v.pending.length, 0)}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* All Awards tab */}
        <TabsContent value="all" className="mt-4">
          <div className="grid gap-3">
            {recognitions.map(rec => (
              <Card key={rec.id} className="shadow-sm group">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="text-2xl shrink-0">{getTypeLabel(rec.type)?.split(' ')[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{rec.title}</p>
                    <p className="text-xs text-muted-foreground">{rec.volunteer_name} · {getTypeLabel(rec.type)?.replace(/^[^\s]+ /, '')}</p>
                    {rec.description && <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>}
                  </div>
                  <div className="text-xs text-muted-foreground text-right shrink-0">
                    {rec.date_awarded && <p>{moment(rec.date_awarded).format('MMM D, YYYY')}</p>}
                    {rec.awarded_by && <p>By {rec.awarded_by}</p>}
                  </div>
                  <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(rec.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
            {recognitions.length === 0 && (
              <EmptyState icon={Award} title="No recognitions yet" description="Award your first recognition using the button above." />
            )}
          </div>
        </TabsContent>

        {/* Pending Milestones tab */}
        <TabsContent value="pending" className="mt-4">
          {volunteersWithPending.length === 0 ? (
            <EmptyState icon={Trophy} title="All milestones awarded!" description="Every eligible volunteer has been recognized." />
          ) : (
            <div className="grid gap-6">
              {volunteersWithPending.map(({ volunteer, pending }) => (
                <Card key={volunteer.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{volunteer.first_name} {volunteer.last_name}</CardTitle>
                        <p className="text-sm text-muted-foreground capitalize">
                          {volunteer.volunteer_type?.replace(/_/g, ' ')} · {Math.round(volunteer.total_hours || 0)} hrs
                        </p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        <Clock className="w-3 h-3 mr-1" />{pending.length} pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {pending.map((milestone, idx) => (
                        <div key={idx} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xl">{milestone.icon}</span>
                            <Button size="sm" onClick={() => openAwardDialog(volunteer, milestone)}>Award</Button>
                          </div>
                          <p className="font-medium text-sm">{milestone.title}</p>
                          <p className="text-xs text-muted-foreground">{milestone.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Recognition?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteTarget)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Award new recognition dialog */}
      <Dialog open={formOpen} onOpenChange={o => { setFormOpen(o); if (!o) setForm({ ...emptyForm }); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Award Recognition</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
            <div>
              <Label>Volunteer *</Label>
              <Select value={form.volunteer_id} onValueChange={selectVolunteer}>
                <SelectTrigger><SelectValue placeholder="Select volunteer..." /></SelectTrigger>
                <SelectContent>{volunteers.map(v => <SelectItem key={v.id} value={v.id}>{v.first_name} {v.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Recognition Type *</Label>
              <Select value={form.type} onValueChange={v => update('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RECOGNITION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Title *</Label><Input value={form.title} onChange={e => update('title', e.target.value)} required /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => update('description', e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date Awarded</Label><Input type="date" value={form.date_awarded} onChange={e => update('date_awarded', e.target.value)} /></div>
              <div><Label>Awarded By</Label><Input value={form.awarded_by} onChange={e => update('awarded_by', e.target.value)} /></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : 'Award'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick-award milestone dialog */}
      <Dialog open={!!awardDialog} onOpenChange={o => { if (!o) setAwardDialog(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Award Milestone</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(awardForm); }} className="space-y-4">
            <div><Label>Volunteer</Label><Input value={awardDialog ? `${awardDialog.volunteer.first_name} ${awardDialog.volunteer.last_name}` : ''} disabled /></div>
            <div><Label>Award Title *</Label><Input value={awardForm.title || ''} onChange={e => setAwardForm(p => ({ ...p, title: e.target.value }))} required /></div>
            <div><Label>Description</Label><Textarea value={awardForm.description || ''} onChange={e => setAwardForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date Awarded</Label><Input type="date" value={awardForm.date_awarded || ''} onChange={e => setAwardForm(p => ({ ...p, date_awarded: e.target.value }))} /></div>
              <div><Label>Awarded By</Label><Input value={awardForm.awarded_by || ''} onChange={e => setAwardForm(p => ({ ...p, awarded_by: e.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAwardDialog(null)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Awarding...' : 'Award Milestone'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}