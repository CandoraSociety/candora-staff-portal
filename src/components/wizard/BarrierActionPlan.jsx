import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function BarrierActionPlan({ client, onSave, onComplete }) {
  const [saving, setSaving] = useState(false);

  const getBarriers = () => {
    const barriers = [];
    for (let i = 1; i <= 3; i++) {
      if (client[`barrier_${i}`]) {
        barriers.push({
          num: i,
          name: client[`barrier_${i}`],
          action_steps: client[`barrier_${i}_action_steps`] || [],
          timeline_start: client[`barrier_${i}_timeline_start`] || '',
          timeline_end: client[`barrier_${i}_timeline_end`] || '',
          responsible: client[`barrier_${i}_responsible`] || '',
          resources: client[`barrier_${i}_resources`] || '',
        });
      }
    }
    return barriers;
  };

  const [barriers, setBarriers] = useState(getBarriers());

  const handleBarrierChange = (barrierNum, field, value) => {
    setBarriers(prev =>
      prev.map(b =>
        b.num === barrierNum ? { ...b, [field]: value } : b
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = { barrier_action_plan_completed: true };
      barriers.forEach(barrier => {
        updates[`barrier_${barrier.num}_action_steps`] = barrier.action_steps;
        updates[`barrier_${barrier.num}_timeline_start`] = barrier.timeline_start;
        updates[`barrier_${barrier.num}_timeline_end`] = barrier.timeline_end;
        updates[`barrier_${barrier.num}_responsible`] = barrier.responsible;
        updates[`barrier_${barrier.num}_resources`] = barrier.resources;
      });

      await onSave(updates);
      toast.success('Barrier action plan saved');
      onComplete?.();
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const activeBarriers = barriers.filter(b => b.name);

  if (activeBarriers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No barriers identified. Complete Barrier Identification first.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Create detailed resolution plans for each identified barrier.
      </div>

      {activeBarriers.map(barrier => (
        <Card key={barrier.num}>
          <CardHeader>
            <CardTitle>Barrier {barrier.num}: {barrier.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Action Steps (comma-separated)</Label>
              <Textarea
                value={Array.isArray(barrier.action_steps) ? barrier.action_steps.join(', ') : barrier.action_steps}
                onChange={(e) => handleBarrierChange(barrier.num, 'action_steps', e.target.value.split(',').map(s => s.trim()))}
                rows={3}
                className="mt-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={barrier.timeline_start}
                  onChange={(e) => handleBarrierChange(barrier.num, 'timeline_start', e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Target Completion</Label>
                <Input
                  type="date"
                  value={barrier.timeline_end}
                  onChange={(e) => handleBarrierChange(barrier.num, 'timeline_end', e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
            <div>
              <Label>Responsible Party</Label>
              <Input
                value={barrier.responsible}
                onChange={(e) => handleBarrierChange(barrier.num, 'responsible', e.target.value)}
                className="mt-2"
                placeholder="Who is responsible?"
              />
            </div>
            <div>
              <Label>Resources / Referrals Needed</Label>
              <Textarea
                value={barrier.resources}
                onChange={(e) => handleBarrierChange(barrier.num, 'resources', e.target.value)}
                rows={2}
                className="mt-2"
                placeholder="What resources are needed?"
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? 'Saving...' : 'Save Action Plan'}
      </Button>
    </div>
  );
}