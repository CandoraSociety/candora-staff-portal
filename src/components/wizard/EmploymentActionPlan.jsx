import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const WORKSHOP_OPTIONS = [
  'resume_writing',
  'interview_skills',
  'job_search_strategies',
  'workplace_communication',
  'computer_skills',
  'financial_literacy'
];

const PROGRAM_OPTIONS = [
  'ell_classes',
  'upgrading',
  'certification_program',
  'vocational_training',
  'mentorship'
];

const PLACEMENT_OPTIONS = [
  'internal_placement',
  'external_placement',
  'job_shadowing',
  'work_experience'
];

const JOB_SEARCH_OPTIONS = [
  'online_applications',
  'networking',
  'job_fair',
  'employment_agency',
  'direct_employer_contact'
];

const SUPPORT_OPTIONS = [
  'transportation_support',
  'childcare_support',
  'mental_health_support',
  'addiction_support',
  'housing_support'
];

export default function EmploymentActionPlan({ client, onSave, onComplete }) {
  const [selectedItems, setSelectedItems] = useState(client?.sdp_items || []);
  const [notes, setNotes] = useState(client?.sdp_notes || '');
  const [compassEntered, setCompassEntered] = useState(client?.action_plan_compass_entered || false);
  const [saving, setSaving] = useState(false);

  const handleToggle = (item) => {
    setSelectedItems(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        sdp_items: selectedItems,
        sdp_notes: notes,
        action_plan_submitted: true
      });
      toast.success('Employment action plan saved');
      onComplete?.();
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCompassEntered = async () => {
    await onSave({ action_plan_compass_entered: true });
    setCompassEntered(true);
    toast.success('Marked as entered in Compass');
  };

  const generateCompassText = () => {
    const lines = [`Employment Action Plan for ${client.first_name} ${client.last_name}`, ''];
    
    if (selectedItems.length === 0) {
      lines.push('No action items selected.');
    } else {
      lines.push('Selected Activities:');
      selectedItems.forEach(item => {
        lines.push(`- ${item.replace(/_/g, ' ')}`);
      });
    }
    
    if (notes) {
      lines.push('', `Notes: ${notes}`);
    }
    
    return lines.join('\n');
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Build a customized employment action plan. Select activities and supports that align with the client's goals.
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Workshops</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {WORKSHOP_OPTIONS.map(item => (
              <div key={item} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedItems.includes(item)}
                  onCheckedChange={() => handleToggle(item)}
                />
                <Label className="text-sm font-normal">{item.replace(/_/g, ' ')}</Label>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Programs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {PROGRAM_OPTIONS.map(item => (
              <div key={item} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedItems.includes(item)}
                  onCheckedChange={() => handleToggle(item)}
                />
                <Label className="text-sm font-normal">{item.replace(/_/g, ' ')}</Label>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Placement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {PLACEMENT_OPTIONS.map(item => (
              <div key={item} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedItems.includes(item)}
                  onCheckedChange={() => handleToggle(item)}
                />
                <Label className="text-sm font-normal">{item.replace(/_/g, ' ')}</Label>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {JOB_SEARCH_OPTIONS.map(item => (
              <div key={item} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedItems.includes(item)}
                  onCheckedChange={() => handleToggle(item)}
                />
                <Label className="text-sm font-normal">{item.replace(/_/g, ' ')}</Label>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Supports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {SUPPORT_OPTIONS.map(item => (
              <div key={item} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedItems.includes(item)}
                  onCheckedChange={() => handleToggle(item)}
                />
                <Label className="text-sm font-normal">{item.replace(/_/g, ' ')}</Label>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Add any additional notes about the action plan..."
          />
        </CardContent>
      </Card>

      {!compassEntered && (
        <Card className="bg-slate-50">
          <CardHeader>
            <CardTitle className="text-sm">Compass Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="bg-white p-4 rounded text-sm whitespace-pre-wrap border">
              {generateCompassText()}
            </pre>
            <Button onClick={handleCompassEntered} variant="outline">
              Mark as Entered in Compass
            </Button>
          </CardContent>
        </Card>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? 'Saving...' : 'Save Action Plan'}
      </Button>
    </div>
  );
}