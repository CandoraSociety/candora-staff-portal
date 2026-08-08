import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

const COURSE_OPTIONS = [
  'H2S Alive',
  'Standard First Aid and CPR',
  'Fall Protection',
  'Forklift Operator',
  'Aerial Lift',
  'Security Guard License',
  'Food Safe',
  'ProServe',
  'Other',
];

export default function ExposureCourseRequestForm({ client, existing, onDone, onCancel }) {
  const [rec, setRec] = useState(existing || {
    request_type: 'exposure_course',
    course_type: '',
    course_type_other: '',
    course_identifier: '',
    course_link: '',
    description: '',
    vendor: '',
    program_start_date: '',
    estimated_amount: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const update = (f, v) => setRec(p => ({ ...p, [f]: v }));

  const handleSave = async () => {
    if (!rec.course_type) { toast.error('Please select a course'); return; }
    if (!rec.estimated_amount && rec.estimated_amount !== 0) {
      toast.error('Please enter an estimated amount'); return;
    }
    setSaving(true);
    try {
      const me = await base44.auth.me().catch(() => null);
      const today = format(new Date(), 'yyyy-MM-dd');
      const data = {
        request_type: 'exposure_course',
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
        course_type: rec.course_type,
        course_type_other: rec.course_type === 'Other' ? rec.course_type_other : '',
        course_identifier: rec.course_identifier,
        course_link: rec.course_link,
        description: rec.description,
        vendor: rec.vendor,
        program_start_date: rec.program_start_date,
        estimated_amount: parseFloat(rec.estimated_amount) || 0,
        requested_date: existing?.requested_date || today,
        requested_by: existing?.requested_by || me?.email || client.assigned_worker || '',
        requested_by_name: existing?.requested_by_name || me?.full_name || '',
        assigned_worker: client.assigned_worker || '',
        notes: rec.notes,
        status: existing?.status || 'pending',
      };
      if (existing) {
        await base44.entities.PurchaseRequest.update(existing.id, data);
      } else {
        await base44.entities.PurchaseRequest.create(data);
      }
      toast.success(existing ? 'Exposure course request updated' : 'Exposure course request submitted to managers');
      onDone();
    } catch { toast.error('Failed to submit request'); }
    finally { setSaving(false); }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-indigo-600" />
          {existing ? 'Edit Exposure Course Request' : 'Exposure Course Request Form'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Course</Label>
            <Select value={rec.course_type} onValueChange={v => update('course_type', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select a course" /></SelectTrigger>
              <SelectContent>
                {COURSE_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Course Provider / Vendor</Label>
            <Input value={rec.vendor} onChange={e => update('vendor', e.target.value)} className="mt-1" placeholder="Course provider" />
          </div>
        </div>

        {rec.course_type === 'Other' && (
          <div>
            <Label className="text-xs">Other (specify course)</Label>
            <Input value={rec.course_type_other} onChange={e => update('course_type_other', e.target.value)} className="mt-1" placeholder="Specify the course" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Program Start Date</Label>
            <Input type="date" value={rec.program_start_date} onChange={e => update('program_start_date', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Course Identifier</Label>
            <Input value={rec.course_identifier} onChange={e => update('course_identifier', e.target.value)} className="mt-1" placeholder="Provider code / cohort name" />
          </div>
        </div>

        <div>
          <Label className="text-xs">Course Link</Label>
          <Input value={rec.course_link} onChange={e => update('course_link', e.target.value)} className="mt-1" placeholder="https://…" />
        </div>

        <div>
          <Label className="text-xs">Description</Label>
          <Input value={rec.description} onChange={e => update('description', e.target.value)} className="mt-1" />
        </div>

        <div>
          <Label className="text-xs">Estimated Amount ($)</Label>
          <Input type="number" step="0.01" value={rec.estimated_amount} onChange={e => update('estimated_amount', e.target.value)} className="mt-1" />
        </div>

        <div>
          <Label className="text-xs">Notes</Label>
          <Textarea value={rec.notes} onChange={e => update('notes', e.target.value)} rows={2} className="mt-1 text-xs" />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? 'Submitting...' : 'Request Exposure Course'}
          </Button>
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}