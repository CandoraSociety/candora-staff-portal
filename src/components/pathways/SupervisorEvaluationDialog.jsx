import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { CheckCircle2, Clock } from 'lucide-react';

const PLACEMENT_TYPES = [
  { value: 'cleaning_arc',           label: 'Cleaning (ARC)' },
  { value: 'food_services_onsite',   label: 'Food Services (Onsite)' },
  { value: 'food_services_offsite',  label: 'Food Services (Offsite)' },
  { value: 'reception',              label: 'Reception' },
  { value: 'childcare',              label: 'Childcare' },
];

const EVAL_RATINGS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'satisfactory', label: 'Satisfactory' },
  { value: 'needs_improvement', label: 'Needs Improvement' },
  { value: 'unsatisfactory', label: 'Unsatisfactory' },
];

const EVAL_FIELDS = [
  { key: 'evaluation_reliability', label: 'Reliability' },
  { key: 'evaluation_attitude', label: 'Attitude' },
  { key: 'evaluation_skill_development', label: 'Skill Development' },
  { key: 'evaluation_teamwork', label: 'Teamwork' },
  { key: 'evaluation_communication', label: 'Communication' },
];

const MILESTONES = [
  { key: 'orientation_completed', dateKey: 'orientation_date', label: 'Orientation Completed' },
  { key: 'health_safety_completed', dateKey: 'health_safety_date', label: 'Health & Safety Completed' },
  { key: 'midpoint_checkin_completed', dateKey: 'midpoint_checkin_date', label: 'Midpoint Check-in' },
  { key: 'program_completion_completed', dateKey: 'program_completion_date', label: 'Program Completion' },
];

export default function SupervisorEvaluationDialog({ training, open, onOpenChange, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (training) {
      setForm({
        orientation_completed: !!training.orientation_completed,
        orientation_date: training.orientation_date || '',
        health_safety_completed: !!training.health_safety_completed,
        health_safety_date: training.health_safety_date || '',
        midpoint_checkin_completed: !!training.midpoint_checkin_completed,
        midpoint_checkin_date: training.midpoint_checkin_date || '',
        program_completion_completed: !!training.program_completion_completed,
        program_completion_date: training.program_completion_date || '',
        supervisor_notes: training.supervisor_notes || '',
        evaluation_reliability: training.evaluation_reliability || '',
        evaluation_attitude: training.evaluation_attitude || '',
        evaluation_skill_development: training.evaluation_skill_development || '',
        evaluation_teamwork: training.evaluation_teamwork || '',
        evaluation_communication: training.evaluation_communication || '',
        evaluation_would_hire: training.evaluation_would_hire || '',
        evaluation_strengths: training.evaluation_strengths || '',
        evaluation_areas_for_growth: training.evaluation_areas_for_growth || '',
        evaluation_overall_comments: training.evaluation_overall_comments || '',
        evaluation_date: training.evaluation_date || new Date().toISOString().split('T')[0],
        status: training.status || 'referred',
      });
    }
  }, [training]);

  const update = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const hasEval = EVAL_FIELDS.some(f => form[f.key]);
      await base44.entities.InternalTraining.update(training.id, {
        ...form,
        evaluation_completed: hasEval,
      });
      toast.success('Progress & evaluation saved');
      onSaved?.();
      onOpenChange(false);
    } catch {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  if (!training) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Placement Progress & Evaluation</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-slate-700">{training.client_name}</span> — {PLACEMENT_TYPES.find(p => p.value === training.placement_type)?.label || training.placement_type}
            {training.supervisor_name && (
              <span className="block mt-1">Supervisor: {training.supervisor_name}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Status */}
          <div className="flex items-center gap-3">
            <Label className="text-xs font-semibold">Placement Status</Label>
            <Select value={form.status} onValueChange={v => update('status', v)}>
              <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="referred">Referred</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            {training.evaluation_completed && (
              <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />Evaluated</Badge>
            )}
          </div>

          {/* Progress Milestones */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Progress Milestones</h4>
            <div className="space-y-2">
              {MILESTONES.map(m => (
                <div key={m.key} className="flex items-center gap-3 p-2 rounded-lg border">
                  <input
                    type="checkbox"
                    className="accent-amber-500 w-4 h-4"
                    checked={!!form[m.key]}
                    onChange={e => update(m.key, e.target.checked)}
                  />
                  <span className="text-sm flex-1">{m.label}</span>
                  {form[m.key] ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-300" />
                  )}
                  <Input
                    type="date"
                    value={form[m.dateKey] || ''}
                    onChange={e => update(m.dateKey, e.target.value)}
                    className="w-40 h-7 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Supervisor Notes */}
          <div>
            <Label className="text-xs font-semibold">Supervisor Notes</Label>
            <Textarea
              value={form.supervisor_notes || ''}
              onChange={e => update('supervisor_notes', e.target.value)}
              rows={3}
              className="mt-1 text-sm"
              placeholder="Progress observations, attendance, etc."
            />
          </div>

          <Separator />

          {/* Evaluation */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Final Evaluation</h4>
            <div className="space-y-3">
              {EVAL_FIELDS.map(f => (
                <div key={f.key} className="flex items-center gap-3">
                  <Label className="text-xs w-32 shrink-0">{f.label}</Label>
                  <Select value={form[f.key]} onValueChange={v => update(f.key, v)}>
                    <SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="Not rated" /></SelectTrigger>
                    <SelectContent>
                      {EVAL_RATINGS.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <Label className="text-xs w-32 shrink-0">Would Hire?</Label>
                <Select value={form.evaluation_would_hire} onValueChange={v => update('evaluation_would_hire', v)}>
                  <SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="Not rated" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="yes_with_conditions">Yes, with conditions</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="not_applicable">N/A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label className="text-xs font-semibold">Strengths</Label>
              <Textarea
                value={form.evaluation_strengths || ''}
                onChange={e => update('evaluation_strengths', e.target.value)}
                rows={2}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Areas for Growth</Label>
              <Textarea
                value={form.evaluation_areas_for_growth || ''}
                onChange={e => update('evaluation_areas_for_growth', e.target.value)}
                rows={2}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Overall Comments</Label>
              <Textarea
                value={form.evaluation_overall_comments || ''}
                onChange={e => update('evaluation_overall_comments', e.target.value)}
                rows={3}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Evaluation Date</Label>
              <Input
                type="date"
                value={form.evaluation_date || ''}
                onChange={e => update('evaluation_date', e.target.value)}
                className="mt-1 w-48"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Progress & Evaluation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}