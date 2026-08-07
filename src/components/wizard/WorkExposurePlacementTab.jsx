import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Briefcase, MapPin, Clock, Calendar, DollarSign, Building2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import EmployerPickerDialog from './EmployerPickerDialog';
import TimesheetSubmissionForm from './TimesheetSubmissionForm';
import { syncSubmissionDelete } from '@/lib/workExposureSync';

const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};
const STATUS_BADGE = {
  pending: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
};

const fmtDate = (d) => {
  if (!d) return '—';
  try { return format(new Date(d), 'MMM d, yy'); } catch { return '—'; }
};

function PlacementForm({ client, existing, onDone, onCancel }) {
  const [rec, setRec] = useState(existing || {
    employer_id: '',
    business_name: '',
    location: '',
    position_type: '',
    expected_hours_per_week: '',
    hourly_rate: 15,
    start_date: '',
    anticipated_completion_date: '',
    status: 'pending',
    notes: '',
  });
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const update = (f, v) => setRec(p => ({ ...p, [f]: v }));

  const handlePickEmployer = (emp) => {
    setRec(p => ({ ...p, employer_id: emp.id, business_name: emp.name, location: p.location || emp.address || '' }));
    setShowPicker(false);
  };

  const handleSave = async () => {
    if (!rec.employer_id && !rec.business_name.trim()) {
      toast.error('Please choose an employer');
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...rec,
        expected_hours_per_week: parseFloat(rec.expected_hours_per_week) || 0,
        hourly_rate: parseFloat(rec.hourly_rate) || 15,
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
        assigned_worker: client.assigned_worker,
        assigned_worker_name: client.assigned_worker_name,
      };
      if (existing) {
        await base44.entities.WorkExposurePlacement.update(existing.id, data);
      } else {
        await base44.entities.WorkExposurePlacement.create(data);
      }

      // Keep the client's CRT work-exposure / wage-subsidy flags in sync with
      // completed placements. (Hours-based flags are handled by submissions.)
      const allPlacements = await base44.entities.WorkExposurePlacement.filter({ client_id: client.id });
      const hasCompleted = allPlacements.some(p => p.status === 'completed');
      await base44.entities.Client.update(client.id, {
        paid_external_placement: hasCompleted,
        wage_subsidy_accessed: hasCompleted,
      });

      toast.success(existing ? 'Placement updated' : 'Work exposure placement added');
      onDone();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <Dialog open onOpenChange={(o) => !o && onCancel()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{existing ? 'Edit Work Exposure Placement' : 'Add Work Exposure Placement'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Employer *</Label>
              {rec.employer_id ? (
                <div className="mt-1 flex items-center justify-between gap-2 p-2 rounded-md border bg-slate-50">
                  <span className="text-sm font-medium flex items-center gap-1"><Building2 className="w-4 h-4 text-slate-400" />{rec.business_name}</span>
                  <Button size="sm" variant="ghost" onClick={() => setShowPicker(true)}>Change</Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" className="mt-1 w-full" onClick={() => setShowPicker(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Choose employer or add new
                </Button>
              )}
            </div>
            <div>
              <Label className="text-xs">Location</Label>
              <Input value={rec.location} onChange={e => update('location', e.target.value)} className="mt-1" placeholder="Address or area" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Position Type</Label>
                <Input value={rec.position_type} onChange={e => update('position_type', e.target.value)} className="mt-1" placeholder="e.g. Warehouse Associate" />
              </div>
              <div>
                <Label className="text-xs">Expected Hours / Week</Label>
                <Input type="number" step="0.5" value={rec.expected_hours_per_week} onChange={e => update('expected_hours_per_week', e.target.value)} className="mt-1" placeholder="e.g. 30" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Work Start Date</Label>
                <Input type="date" value={rec.start_date} onChange={e => update('start_date', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Anticipated Completion</Label>
                <Input type="date" value={rec.anticipated_completion_date} onChange={e => update('anticipated_completion_date', e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Hourly Rate ($)</Label>
                <Input type="number" step="0.25" min="0" value={rec.hourly_rate} onChange={e => update('hourly_rate', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={rec.status} onValueChange={v => update('status', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Hours worked are submitted by the employer (or by you) via the "Submit Hours" button — they are no longer entered here.</p>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={rec.notes} onChange={e => update('notes', e.target.value)} rows={2} className="mt-1 text-xs" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Placement'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {showPicker && (
        <EmployerPickerDialog onPick={handlePickEmployer} onCancel={() => setShowPicker(false)} />
      )}
    </>
  );
}

function PlacementCard({ placement, submissions, onEdit, onDelete, onSubmitHours, onDeleteSubmission }) {
  const totalHours = (submissions || []).reduce((s, x) => s + (Number(x.hours_worked) || 0), 0);
  const timesheetCount = (submissions || []).filter(s => s.timesheet_url).length;
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-semibold text-sm truncate">{placement.business_name}</span>
              <Badge className={`text-xs ${STATUS_BADGE[placement.status] || ''}`}>{STATUS_LABELS[placement.status] || placement.status}</Badge>
            </div>
            {placement.position_type && <div className="text-sm text-slate-600 ml-6">{placement.position_type}</div>}
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground ml-6">
              {placement.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{placement.location}</span>}
              {placement.expected_hours_per_week > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{placement.expected_hours_per_week} hrs/week</span>}
              {placement.start_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtDate(placement.start_date)}{placement.anticipated_completion_date ? ` – ${fmtDate(placement.anticipated_completion_date)}` : ''}</span>}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs ml-6">
              <span className="flex items-center gap-1 font-semibold text-slate-700"><Clock className="w-3 h-3" />{totalHours} hrs submitted</span>
              {placement.hourly_rate > 0 && <span className="flex items-center gap-1 text-slate-600"><DollarSign className="w-3 h-3" />{placement.hourly_rate}/hr</span>}
              {timesheetCount > 0 && <span className="flex items-center gap-1 text-blue-600"><FileText className="w-3 h-3" />{timesheetCount} timesheet{timesheetCount > 1 ? 's' : ''}</span>}
            </div>
            {submissions && submissions.length > 0 && (
              <div className="ml-6 mt-1 space-y-0.5">
                {submissions.map(s => (
                  <div key={s.id} className="text-xs text-slate-600 flex items-center gap-2">
                    <span>{s.period_end_date ? format(new Date(s.period_end_date + 'T00:00:00'), 'MMM d, yy') : ''}: <strong>{s.hours_worked} hrs</strong></span>
                    {s.submitted_by_staff && <Badge variant="outline" className="text-[10px]">staff</Badge>}
                    {s.timesheet_url && <a href={s.timesheet_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 inline-flex items-center"><FileText className="w-3 h-3" /></a>}
                    {s.comments && <span className="text-slate-400 truncate max-w-[160px]" title={s.comments}>· {s.comments}</span>}
                    <button className="text-red-400 hover:text-red-600" onClick={() => onDeleteSubmission(s, placement)}><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <Button variant="outline" size="sm" onClick={onSubmitHours}><Clock className="w-3.5 h-3.5 mr-1" /> Submit Hours</Button>
            <div className="flex gap-1 justify-end">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}><Pencil className="w-3.5 h-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function WorkExposurePlacementTab({ client, onSave, onPlacementsChange }) {
  const [placements, setPlacements] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlacement, setEditingPlacement] = useState(null);
  const [submitPlacement, setSubmitPlacement] = useState(null);
  const [user, setUser] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ps, subs] = await Promise.all([
        base44.entities.WorkExposurePlacement.filter({ client_id: client.id }, '-created_date'),
        base44.entities.WorkExposureHoursSubmission.filter({ client_id: client.id }),
      ]);
      setPlacements(ps);
      setSubmissions(subs);
    } catch { toast.error('Failed to load placements'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchAll();
    base44.auth.me().then(setUser).catch(() => {});
  }, [client.id]);

  const submissionsFor = (placementId) => submissions.filter(s => s.placement_id === placementId);

  const handleDone = async () => {
    setShowForm(false);
    setEditingPlacement(null);
    await fetchAll();
    onPlacementsChange?.();
  };

  const handleDelete = async (placement) => {
    if (!confirm(`Delete placement at ${placement.business_name}? Submitted hours will remain but be unlinked.`)) return;
    try {
      await base44.entities.WorkExposurePlacement.delete(placement.id);
      toast.success('Placement deleted');
      fetchAll();
      onPlacementsChange?.();
    } catch { toast.error('Failed to delete'); }
  };

  const handleDeleteSubmission = async (submission, placement) => {
    if (!confirm(`Delete the ${submission.hours_worked}-hour submission?`)) return;
    try {
      await syncSubmissionDelete(submission, placement);
      toast.success('Submission deleted');
      fetchAll();
      onPlacementsChange?.();
    } catch { toast.error('Failed to delete submission'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-600" />
            Work Exposure Placements
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Link an employer to this client. Hours are submitted by the employer via the Employer Portal, or by you below.
          </p>
        </div>
        <Button size="sm" onClick={() => { setEditingPlacement(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add Work Exposure Placement
        </Button>
      </div>

      {showForm && !editingPlacement && (
        <PlacementForm client={client} onDone={handleDone} onCancel={() => setShowForm(false)} />
      )}
      {editingPlacement && (
        <PlacementForm client={client} existing={editingPlacement} onDone={handleDone} onCancel={() => setEditingPlacement(null)} />
      )}

      {submitPlacement && (
        <TimesheetSubmissionForm
          placement={submitPlacement}
          user={user}
          isStaff
          onDone={() => { setSubmitPlacement(null); fetchAll(); onPlacementsChange?.(); }}
          onCancel={() => setSubmitPlacement(null)}
        />
      )}

      {loading ? (
        <div className="text-center py-6 text-muted-foreground text-sm">Loading...</div>
      ) : placements.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No work exposure placements yet. Click "Add Work Exposure Placement" to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {placements.map(p => (
            <PlacementCard
              key={p.id}
              placement={p}
              submissions={submissionsFor(p.id)}
              onEdit={() => { setEditingPlacement(p); setShowForm(false); }}
              onDelete={() => handleDelete(p)}
              onSubmitHours={() => setSubmitPlacement(p)}
              onDeleteSubmission={handleDeleteSubmission}
            />
          ))}
        </div>
      )}
    </div>
  );
}