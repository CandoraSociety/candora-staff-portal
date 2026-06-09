import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Plus, X, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

function loadPlans(client) {
  const plans = [];
  for (let n = 1; n <= 3; n++) {
    if (!client?.[`barrier_${n}`]) continue;
    const stepsRaw = client[`barrier_${n}_action_steps`] || '';
    const stepsArr = typeof stepsRaw === 'string'
      ? stepsRaw.split('\n').map(s => s.trim()).filter(Boolean)
      : Array.isArray(stepsRaw) ? stepsRaw : [];
    plans.push({
      num: n,
      barrier: client[`barrier_${n}`],
      action_steps: stepsArr.length > 0 ? stepsArr : [''],
      timeline_start: client[`barrier_${n}_timeline_start`] || '',
      timeline_end: client[`barrier_${n}_timeline_end`] || '',
      responsible_party: client[`barrier_${n}_responsible`] || '',
      resources_needed: client[`barrier_${n}_resources`] || '',
    });
  }
  return plans;
}

export default function BarrierActionPlan({ client, onSave, onComplete }) {
  const isCompleted = !!client?.barrier_action_plan_completed;
  const [submitted, setSubmitted] = useState(isCompleted);
  const [editing, setEditing] = useState(!isCompleted);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState(() => loadPlans(client));

  // Re-sync if BIT data changes (parent refreshes client)
  useEffect(() => {
    setPlans(loadPlans(client));
  }, [client?.barrier_1, client?.barrier_2, client?.barrier_3, client?.barrier_1_action_steps, client?.barrier_2_action_steps, client?.barrier_3_action_steps]);

  const updatePlan = (num, field, value) =>
    setPlans(prev => prev.map(p => p.num === num ? { ...p, [field]: value } : p));

  const addStep = (num) =>
    setPlans(prev => prev.map(p => p.num === num ? { ...p, action_steps: [...p.action_steps, ''] } : p));

  const removeStep = (num, idx) =>
    setPlans(prev => prev.map(p => {
      if (p.num !== num) return p;
      const arr = p.action_steps.filter((_, i) => i !== idx);
      return { ...p, action_steps: arr.length > 0 ? arr : [''] };
    }));

  const updateStep = (num, idx, val) =>
    setPlans(prev => prev.map(p => {
      if (p.num !== num) return p;
      const arr = [...p.action_steps];
      arr[idx] = val;
      return { ...p, action_steps: arr };
    }));

  const handleSave = async (andComplete = false) => {
    setSaving(true);
    try {
      const updates = { barrier_action_plan_completed: true };
      plans.forEach(p => {
        updates[`barrier_${p.num}_action_steps`] = p.action_steps.filter(Boolean).join('\n');
        updates[`barrier_${p.num}_timeline_start`] = p.timeline_start;
        updates[`barrier_${p.num}_timeline_end`] = p.timeline_end;
        updates[`barrier_${p.num}_responsible`] = p.responsible_party;
        updates[`barrier_${p.num}_resources`] = p.resources_needed;
      });
      await onSave(updates);
      toast.success('Barrier action plan saved');
      setSubmitted(true);
      setEditing(false);
      if (andComplete) onComplete?.();
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Guard: no barriers identified
  if (!client?.barriers_addressed) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 text-muted-foreground">
          <p className="font-medium">No barriers identified</p>
          <p className="text-sm mt-1">Complete Step 1 (BIT) first, or skip if no barriers apply.</p>
        </div>
        <Button
          className="w-full"
          onClick={() => onSave({ barrier_action_plan_completed: true }).then(() => onComplete?.())}
        >
          Skip to Next Step <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    );
  }

  // Guard: plans empty after BIT
  if (plans.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 text-muted-foreground">
          <p className="font-medium">Complete BIT first</p>
          <p className="text-sm mt-1">No barriers have been loaded yet. Go back to Step 1.</p>
        </div>
        <Button variant="outline" className="w-full" onClick={() => onComplete?.()}>Continue</Button>
      </div>
    );
  }

  // Read-only summary
  if (submitted && !editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold">Barrier Resolution Plan Completed</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
        </div>
        {plans.map(p => (
          <Card key={p.num}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Barrier {p.num}: {p.barrier}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div><span className="text-muted-foreground">Steps:</span> {p.action_steps.filter(Boolean).join(', ')}</div>
              <div><span className="text-muted-foreground">Timeline:</span> {p.timeline_start} – {p.timeline_end}</div>
              <div><span className="text-muted-foreground">Responsible:</span> {p.responsible_party}</div>
              {p.resources_needed && <div><span className="text-muted-foreground">Resources:</span> {p.resources_needed}</div>}
            </CardContent>
          </Card>
        ))}
        <Button className="w-full" onClick={() => onComplete?.()}>
          Continue to Next Step <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    );
  }

  // Edit form
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Create detailed resolution plans for each identified barrier.
      </p>

      {plans.map(p => (
        <Card key={p.num}>
          <CardHeader>
            <CardTitle className="text-sm">Barrier {p.num}: {p.barrier}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs font-semibold">Action Steps</Label>
              <div className="space-y-2 mt-2">
                {p.action_steps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4 shrink-0">{idx + 1}.</span>
                    <Input
                      value={step}
                      onChange={(e) => updateStep(p.num, idx, e.target.value)}
                      className="text-sm flex-1"
                      placeholder={`Step ${idx + 1}...`}
                    />
                    <button type="button" onClick={() => removeStep(p.num, idx)} className="text-muted-foreground hover:text-destructive">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => addStep(p.num)}>
                  <Plus className="w-3 h-3 mr-1" /> Add Step
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Start Date</Label>
                <Input type="date" value={p.timeline_start} onChange={(e) => updatePlan(p.num, 'timeline_start', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Target Completion Date</Label>
                <Input type="date" value={p.timeline_end} onChange={(e) => updatePlan(p.num, 'timeline_end', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Responsible Party</Label>
                <Input value={p.responsible_party} onChange={(e) => updatePlan(p.num, 'responsible_party', e.target.value)} className="mt-1" placeholder="Who is responsible?" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Resources / Referrals Needed</Label>
                <Input value={p.resources_needed} onChange={(e) => updatePlan(p.num, 'resources_needed', e.target.value)} className="mt-1" placeholder="Resources needed" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
        <Button onClick={() => handleSave(true)} disabled={saving}>
          Finish &amp; Continue <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}