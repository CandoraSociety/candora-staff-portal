import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PlacementEvaluationForm from '@/components/food/PlacementEvaluationForm';
import {
  FOOD_PLACEMENT_TYPES, PLACEMENT_CHECKPOINTS, PLACEMENT_STATUSES, formatPlacementDate,
} from '@/lib/internalPlacements';

const buildForm = (p) => ({
  status: p.status || 'referred',
  supervisor_notes: p.supervisor_notes || '',
  evaluation_completed: p.evaluation_completed || false,
  evaluation_date: p.evaluation_date || '',
  evaluation_reliability: p.evaluation_reliability || '',
  evaluation_attitude: p.evaluation_attitude || '',
  evaluation_skill_development: p.evaluation_skill_development || '',
  evaluation_teamwork: p.evaluation_teamwork || '',
  evaluation_communication: p.evaluation_communication || '',
  evaluation_would_hire: p.evaluation_would_hire || '',
  evaluation_strengths: p.evaluation_strengths || '',
  evaluation_areas_for_growth: p.evaluation_areas_for_growth || '',
  evaluation_overall_comments: p.evaluation_overall_comments || '',
  ...PLACEMENT_CHECKPOINTS.reduce((acc, c) => ({
    ...acc,
    [c.doneKey]: p[c.doneKey] || false,
    [c.dateKey]: p[c.dateKey] || '',
  }), {}),
});

export default function PlacementDetailDialog({ placement, open, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(() => buildForm(placement || {}));
  const [saving, setSaving] = useState(false);
  const [supervisorEmail, setSupervisorEmail] = useState('');

  const { data: employees = [] } = useQuery({
    queryKey: ['food-employees'],
    queryFn: () => base44.entities.Employee.filter({ status: 'active' }),
  });

  useEffect(() => {
    if (placement) {
      setForm(buildForm(placement));
      setSupervisorEmail(placement.supervisor_email || '');
    }
  }, [placement]);

  if (!placement) return null;

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const toggleCheckpoint = (c, checked) => {
    set({
      [c.doneKey]: checked,
      [c.dateKey]: checked ? (form[c.dateKey] || new Date().toISOString().slice(0, 10)) : '',
    });
  };

  const save = async () => {
    setSaving(true);
    const patch = { ...form };
    if (form.status === 'completed' && !placement.actual_end_date) {
      patch.actual_end_date = new Date().toISOString().slice(0, 10);
    }
    if (supervisorEmail !== (placement.supervisor_email || '')) {
      const sup = employees.find((e) => e.email === supervisorEmail);
      patch.supervisor_email = supervisorEmail;
      patch.supervisor_name = sup ? `${sup.first_name} ${sup.last_name}` : '';
    }
    await base44.entities.InternalTraining.update(placement.id, patch);
    qc.invalidateQueries({ queryKey: ['food-internal-placements'] });
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{placement.client_name || 'Internal placement'}</DialogTitle>
          <p className="text-xs text-muted-foreground">
            {FOOD_PLACEMENT_TYPES[placement.placement_type]?.label || placement.placement_type}
            {' · '}Start {formatPlacementDate(placement.start_date)}
            {placement.expected_end_date && ` · Expected end ${formatPlacementDate(placement.expected_end_date)}`}
          </p>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div className="grid gap-2 sm:grid-cols-2 text-xs">
            <div><span className="text-muted-foreground">Pathways worker: </span>{placement.assigned_worker_name || '—'}</div>
            <div><span className="text-muted-foreground">Supervisor: </span>{placement.supervisor_name || '—'}</div>
            {placement.training_goals && (
              <div className="sm:col-span-2">
                <span className="text-muted-foreground">Training goals: </span>{placement.training_goals}
              </div>
            )}
          </div>

          <label className="text-xs block">
            <span className="text-muted-foreground">Food Services supervisor</span>
            <select
              value={supervisorEmail}
              onChange={(e) => setSupervisorEmail(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm"
            >
              <option value="">Not assigned</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.email}>{emp.first_name} {emp.last_name}</option>
              ))}
            </select>
          </label>

          <label className="text-xs block">
            <span className="text-muted-foreground">Placement status</span>
            <select
              value={form.status}
              onChange={(e) => set({ status: e.target.value })}
              className="w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm capitalize"
            >
              {PLACEMENT_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          <div>
            <h4 className="text-sm font-semibold mb-2">Checkpoints</h4>
            <div className="space-y-2">
              {PLACEMENT_CHECKPOINTS.map((c) => (
                <div key={c.key} className="flex items-center gap-3 rounded-md border px-3 py-2">
                  <input
                    type="checkbox"
                    checked={!!form[c.doneKey]}
                    onChange={(e) => toggleCheckpoint(c, e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm flex-1">{c.label}</span>
                  <Input
                    type="date"
                    value={form[c.dateKey] || ''}
                    onChange={(e) => set({ [c.dateKey]: e.target.value })}
                    className="w-40"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Supervisor notes</h4>
            <textarea
              value={form.supervisor_notes}
              onChange={(e) => set({ supervisor_notes: e.target.value })}
              placeholder="How the placement is going, attendance, concerns."
              className="w-full min-h-[64px] rounded-md border border-input px-2 py-1.5 text-sm bg-background"
            />
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Final evaluation</h4>
            <PlacementEvaluationForm values={form} onChange={set} />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save placement'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}