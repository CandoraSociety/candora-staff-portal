import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const BARRIER_CATEGORIES = [
  { key: 'housing', label: 'Housing Stability' },
  { key: 'childcare', label: 'Childcare' },
  { key: 'transportation', label: 'Transportation' },
  { key: 'mental_health', label: 'Mental Health' },
  { key: 'physical_health', label: 'Physical Health' },
  { key: 'addiction', label: 'Addiction Recovery' },
  { key: 'domestic_violence', label: 'Domestic Violence' },
  { key: 'language', label: 'Language/Communication' },
  { key: 'education', label: 'Education/Skills' },
  { key: 'employment', label: 'Employment Related' },
  { key: 'legal', label: 'Legal Issues' },
  { key: 'financial', label: 'Financial Literacy' },
  { key: 'social_isolation', label: 'Social Isolation' },
  { key: 'cultural', label: 'Cultural Adjustment' },
];

export default function BarrierIdentificationTool({ client, onSave, onComplete }) {
  const [barriers, setBarriers] = useState({});
  const [saving, setSaving] = useState(false);

  const handleBarrierChange = (barrierKey, field, value) => {
    setBarriers(prev => ({
      ...prev,
      [barrierKey]: {
        ...prev[barrierKey],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = {
        barriers_addressed: true,
        bit_completed: true,
      };

      let barrierCount = 0;
      Object.entries(barriers).forEach(([key, data]) => {
        if (data.support_needed === 'yes') {
          barrierCount++;
          const barrierNum = barrierCount;
          updates[`barrier_${barrierNum}`] = BARRIER_CATEGORIES.find(c => c.key === key)?.label || key;
          updates[`barrier_${barrierNum}_status`] = 'unresolved';
          updates[`barrier_${barrierNum}_notes`] = data.notes || '';
        }
      });

      await onSave(updates);
      
      await base44.entities.CompassTask.create({
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
        task_type: 'barriers_identified',
        title: `Barriers Identified - ${client.first_name} ${client.last_name}`,
        instructions: `${barrierCount} barrier(s) identified`,
        status: 'pending'
      });

      toast.success('Barrier identification saved');
      onComplete?.();
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Identify barriers that may impact the client's employment journey.
      </div>

      <div className="space-y-4">
        {BARRIER_CATEGORIES.map((category) => (
          <Card key={category.key}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">{category.label}</Label>
                <div className="flex items-center gap-4">
                  <Label className="font-normal">Support Needed?</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={barriers[category.key]?.support_needed === 'yes' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleBarrierChange(category.key, 'support_needed', 'yes')}
                    >
                      Yes
                    </Button>
                    <Button
                      variant={barriers[category.key]?.support_needed === 'no' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleBarrierChange(category.key, 'support_needed', 'no')}
                    >
                      No
                    </Button>
                  </div>
                </div>
              </div>

              {barriers[category.key]?.support_needed === 'yes' && (
                <div className="mt-4 pl-4 border-l-2 border-primary">
                  <Label>Notes</Label>
                  <Textarea
                    value={barriers[category.key]?.notes || ''}
                    onChange={(e) => handleBarrierChange(category.key, 'notes', e.target.value)}
                    rows={2}
                    className="mt-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? 'Saving...' : 'Save Barrier Identification'}
      </Button>
    </div>
  );
}