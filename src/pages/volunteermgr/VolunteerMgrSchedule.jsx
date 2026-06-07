import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Plus, Trash2, Users } from 'lucide-react';
import moment from 'moment';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const emptyTemplate = {
  role_title: '',
  day_of_week: 1,
  start_time: '09:00',
  end_time: '12:00',
  volunteers_needed: 1,
  location: '',
  notes: '',
  is_active: true,
};

export default function VolunteerMgrSchedule() {
  const [weekStart, setWeekStart] = useState(moment().startOf('isoWeek'));
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState(emptyTemplate);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assigningTemplate, setAssigningTemplate] = useState(null);
  const [assigningDate, setAssigningDate] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['shift-templates'],
    queryFn: () => base44.entities.ShiftTemplate.list(),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['shift-assignments', weekStart.format('YYYY-MM-DD')],
    queryFn: () => {
      const from = weekStart.format('YYYY-MM-DD');
      const to = weekStart.clone().add(6, 'days').format('YYYY-MM-DD');
      return base44.entities.ShiftAssignment.filter({ date: { $gte: from, $lte: to } });
    },
  });

  const { data: volunteers = [] } = useQuery({
    queryKey: ['vol-volunteers'],
    queryFn: () => base44.entities.Volunteer.filter({ status: 'active' }, 'first_name', 200),
  });

  const saveTemplateMutation = useMutation({
    mutationFn: (data) => base44.entities.ShiftTemplate.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['shift-templates'] }); setTemplateOpen(false); setTemplateForm(emptyTemplate); },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.ShiftTemplate.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shift-templates'] }),
  });

  const assignMutation = useMutation({
    mutationFn: () => {
      const vol = volunteers.find(v => v.id === selectedVolunteer);
      return base44.entities.ShiftAssignment.create({
        template_id: assigningTemplate.id,
        volunteer_id: selectedVolunteer,
        volunteer_name: vol ? `${vol.first_name} ${vol.last_name}` : '',
        date: assigningDate,
        status: 'scheduled',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-assignments', weekStart.format('YYYY-MM-DD')] });
      setAssignOpen(false); setSelectedVolunteer('');
    },
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: (id) => base44.entities.ShiftAssignment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shift-assignments', weekStart.format('YYYY-MM-DD')] }),
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => weekStart.clone().add(i, 'days'));
  const isToday = (d) => d.isSame(moment(), 'day');

  const getTemplatesForDay = (dayIndex) => templates.filter(t => t.day_of_week === dayIndex && t.is_active);
  const getAssignmentsForTemplateDate = (templateId, date) => assignments.filter(a => a.template_id === templateId && a.date === date);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Schedule</h1>
          <p className="text-sm text-muted-foreground mt-1">Weekly volunteer schedule & shift templates</p>
        </div>
      </div>

      <Tabs defaultValue="weekly">
        <TabsList>
          <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
          <TabsTrigger value="templates">Shift Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="mt-4">
          {/* Week navigation */}
          <div className="flex items-center gap-3 mb-4">
            <Button variant="outline" size="sm" onClick={() => setWeekStart(w => w.clone().subtract(1, 'week'))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-medium text-sm">
              {weekStart.format('MMM D')} – {weekStart.clone().add(6, 'days').format('MMM D, YYYY')}
            </span>
            <Button variant="outline" size="sm" onClick={() => setWeekStart(w => w.clone().add(1, 'week'))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setWeekStart(moment().startOf('isoWeek'))}>Today</Button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, idx) => {
              const dayTemplates = getTemplatesForDay(day.day());
              return (
                <div key={idx} className={`min-h-32 rounded-lg border p-2 space-y-2 ${isToday(day) ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{day.format('ddd')}</p>
                    <p className={`text-sm font-bold ${isToday(day) ? 'text-primary' : ''}`}>{day.format('D')}</p>
                  </div>
                  {dayTemplates.map(tmpl => {
                    const dateStr = day.format('YYYY-MM-DD');
                    const slotAssignments = getAssignmentsForTemplateDate(tmpl.id, dateStr);
                    const filled = slotAssignments.length;
                    const needed = tmpl.volunteers_needed || 1;
                    return (
                      <div key={tmpl.id} className="bg-accent/10 rounded p-1.5 space-y-1">
                        <p className="text-[10px] font-semibold text-accent-foreground truncate">{tmpl.role_title}</p>
                        <p className="text-[9px] text-muted-foreground">{tmpl.start_time}–{tmpl.end_time}</p>
                        <div className="flex items-center gap-1">
                          <Users className="w-2.5 h-2.5 text-muted-foreground" />
                          <span className={`text-[9px] font-medium ${filled >= needed ? 'text-green-600' : 'text-amber-600'}`}>{filled}/{needed}</span>
                        </div>
                        {slotAssignments.map(a => (
                          <div key={a.id} className="flex items-center justify-between bg-white rounded px-1 py-0.5 group">
                            <span className="text-[9px] truncate">{a.volunteer_name}</span>
                            <button onClick={() => removeAssignmentMutation.mutate(a.id)} className="opacity-0 group-hover:opacity-100 text-destructive">
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                        {filled < needed && (
                          <button
                            onClick={() => { setAssigningTemplate(tmpl); setAssigningDate(dateStr); setAssignOpen(true); }}
                            className="text-[9px] text-primary hover:underline w-full text-left"
                          >
                            + Assign
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setTemplateOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Add Template</Button>
          </div>
          <div className="grid gap-3">
            {DAYS.map((day, idx) => {
              const dayTemplates = templates.filter(t => t.day_of_week === idx);
              if (dayTemplates.length === 0) return null;
              return (
                <div key={day}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">{day}</h3>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {dayTemplates.map(t => (
                      <Card key={t.id} className="shadow-sm">
                        <CardContent className="p-3 flex items-center justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm">{t.role_title}</p>
                            <p className="text-xs text-muted-foreground">{t.start_time} – {t.end_time} · {t.volunteers_needed} volunteer{t.volunteers_needed !== 1 ? 's' : ''}</p>
                            {t.location && <p className="text-xs text-muted-foreground">{t.location}</p>}
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant={t.is_active ? 'default' : 'secondary'} className="text-xs">{t.is_active ? 'Active' : 'Inactive'}</Badge>
                            <Button size="sm" variant="ghost" onClick={() => deleteTemplateMutation.mutate(t.id)} className="text-destructive hover:text-destructive">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
            {templates.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No shift templates yet. Add one to get started.</p>}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add template dialog */}
      <Dialog open={templateOpen} onOpenChange={o => { setTemplateOpen(o); if (!o) setTemplateForm(emptyTemplate); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Shift Template</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); saveTemplateMutation.mutate(templateForm); }} className="space-y-4">
            <div><Label>Role Title *</Label><Input value={templateForm.role_title} onChange={e => setTemplateForm(p => ({ ...p, role_title: e.target.value }))} required className="mt-1" /></div>
            <div>
              <Label>Day of Week</Label>
              <Select value={String(templateForm.day_of_week)} onValueChange={v => setTemplateForm(p => ({ ...p, day_of_week: Number(v) }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Time</Label><Input type="time" value={templateForm.start_time} onChange={e => setTemplateForm(p => ({ ...p, start_time: e.target.value }))} className="mt-1" /></div>
              <div><Label>End Time</Label><Input type="time" value={templateForm.end_time} onChange={e => setTemplateForm(p => ({ ...p, end_time: e.target.value }))} className="mt-1" /></div>
            </div>
            <div><Label>Volunteers Needed</Label><Input type="number" min={1} value={templateForm.volunteers_needed} onChange={e => setTemplateForm(p => ({ ...p, volunteers_needed: Number(e.target.value) }))} className="mt-1" /></div>
            <div><Label>Location</Label><Input value={templateForm.location} onChange={e => setTemplateForm(p => ({ ...p, location: e.target.value }))} className="mt-1" /></div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setTemplateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveTemplateMutation.isPending}>{saveTemplateMutation.isPending ? 'Saving...' : 'Save'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign volunteer dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Assign Volunteer</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {assigningTemplate && (
              <p className="text-sm text-muted-foreground">{assigningTemplate.role_title} · {assigningDate} · {assigningTemplate.start_time}–{assigningTemplate.end_time}</p>
            )}
            <div>
              <Label>Volunteer</Label>
              <Select value={selectedVolunteer} onValueChange={setSelectedVolunteer}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select volunteer..." /></SelectTrigger>
                <SelectContent>
                  {volunteers.map(v => <SelectItem key={v.id} value={v.id}>{v.first_name} {v.last_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
              <Button onClick={() => assignMutation.mutate()} disabled={!selectedVolunteer || assignMutation.isPending}>
                {assignMutation.isPending ? 'Assigning...' : 'Assign'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}