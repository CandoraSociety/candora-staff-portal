import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    record_type: 'exposure_course',
    course_type: '',
    course_type_other: '',
    course_identifier: '',
    course_link: '',
    description: '',
    vendor: '',
    date: '',
    amount: '',
    tax: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const update = (f, v) => setRec(p => ({ ...p, [f]: v }));
  const total = (parseFloat(rec.amount) || 0) + (parseFloat(rec.tax) || 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        ...rec,
        record_type: 'exposure_course',
        amount: parseFloat(rec.amount) || 0,
        tax: parseFloat(rec.tax) || 0,
        total,
        billing_month: rec.date ? format(new Date(rec.date), 'yyyy-MM') : format(new Date(), 'yyyy-MM'),
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
        assigned_worker: client.assigned_worker,
      };
      if (existing) {
        await base44.entities.FinancialRecord.update(existing.id, data);
      } else {
        await base44.entities.FinancialRecord.create(data);
      }
      toast.success('Exposure course request saved');
      onDone();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">
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
            <Input type="date" value={rec.date} onChange={e => update('date', e.target.value)} className="mt-1" />
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

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Amount ($)</Label>
            <Input type="number" step="0.01" value={rec.amount} onChange={e => update('amount', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Tax ($)</Label>
            <Input type="number" step="0.01" value={rec.tax} onChange={e => update('tax', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Total ($)</Label>
            <Input value={total.toFixed(2)} disabled className="mt-1" />
          </div>
        </div>

        <div>
          <Label className="text-xs">Notes</Label>
          <Textarea value={rec.notes} onChange={e => update('notes', e.target.value)} rows={2} className="mt-1 text-xs" />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} size="sm">{saving ? 'Saving...' : 'Save Request'}</Button>
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}