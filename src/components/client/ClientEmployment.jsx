import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: 'E-RF', label: 'Employed - Regular Full-time' },
  { value: 'E-UF', label: 'Employed - Unions Full-time' },
  { value: 'E-PT', label: 'Employed - Part-time' },
  { value: 'UE', label: 'Unemployed' },
  { value: 'UE-LA', label: 'Unemployed - Looking Actively' },
  { value: 'UE-S', label: 'Unemployed - Student' },
  { value: 'NA', label: 'Not Applicable' },
];

export default function ClientEmployment({ client, onSave }) {
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    employment_status: client?.employment_status || 'NA',
    employer_name: client?.employer_name || '',
    employer_contact: client?.employer_contact || '',
    job_title: client?.job_title || '',
    job_start_date: client?.job_start_date || '',
    job_wage: client?.job_wage || '',
    job_hours: client?.job_hours || '',
    post_completion_employment_status: client?.post_completion_employment_status || 'NA',
    post_completion_employment_date: client?.post_completion_employment_date || '',
    followup_90day_status: client?.followup_90day_status || 'NA',
    followup_90day_date: client?.followup_90day_date || '',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const changes = {};
      const taskFields = [
        'employment_status', 'employer_name', 'job_title',
        'post_completion_employment_status', 'followup_90day_status'
      ];

      taskFields.forEach(field => {
        if (data[field] !== client?.[field]) {
          changes[field] = data[field];
        }
      });

      await onSave(data);

      if (Object.keys(changes).length > 0) {
        await base44.functions.invoke('sendAlertEmail', {
          client_id: client.id,
          client_name: `${client.first_name} ${client.last_name}`,
          change_type: 'employment_update',
          changes: Object.keys(changes).join(', '),
        });
      }

      toast.success('Employment data saved');
      setEditMode(false);
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!editMode) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => setEditMode(true)}>Edit Employment Data</Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Current Employment Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium">{EMPLOYMENT_STATUS_OPTIONS.find(s => s.value === data.employment_status)?.label || data.employment_status}</span>
              </div>
              {data.employer_name && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Employer:</span>
                    <span>{data.employer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contact:</span>
                    <span>{data.employer_contact}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Job Title:</span>
                    <span>{data.job_title}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Post-Program Completion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span>{EMPLOYMENT_STATUS_OPTIONS.find(s => s.value === data.post_completion_employment_status)?.label || data.post_completion_employment_status}</span>
              </div>
              {data.post_completion_employment_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span>{data.post_completion_employment_date}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>90-Day Follow-Up</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span>{EMPLOYMENT_STATUS_OPTIONS.find(s => s.value === data.followup_90day_status)?.label || data.followup_90day_status}</span>
              </div>
              {data.followup_90day_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span>{data.followup_90day_date}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Employment Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Employment Status</Label>
              <Select value={data.employment_status} onValueChange={(v) => setData(prev => ({ ...prev, employment_status: v }))}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Employer Name</Label>
              <Input
                value={data.employer_name}
                onChange={(e) => setData(prev => ({ ...prev, employer_name: e.target.value }))}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Employer Contact</Label>
              <Input
                value={data.employer_contact}
                onChange={(e) => setData(prev => ({ ...prev, employer_contact: e.target.value }))}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Job Title</Label>
              <Input
                value={data.job_title}
                onChange={(e) => setData(prev => ({ ...prev, job_title: e.target.value }))}
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={data.job_start_date}
                  onChange={(e) => setData(prev => ({ ...prev, job_start_date: e.target.value }))}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Wage ($/hr)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={data.job_wage}
                  onChange={(e) => setData(prev => ({ ...prev, job_wage: e.target.value }))}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label>Hours</Label>
              <Input
                value={data.job_hours}
                onChange={(e) => setData(prev => ({ ...prev, job_hours: e.target.value }))}
                className="mt-2"
                placeholder="e.g., 40 hrs/week"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Post-Program Completion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Employment Status</Label>
                <Select value={data.post_completion_employment_status} onValueChange={(v) => setData(prev => ({ ...prev, post_completion_employment_status: v }))}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={data.post_completion_employment_date}
                  onChange={(e) => setData(prev => ({ ...prev, post_completion_employment_date: e.target.value }))}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>90-Day Follow-Up</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Employment Status</Label>
                <Select value={data.followup_90day_status} onValueChange={(v) => setData(prev => ({ ...prev, followup_90day_status: v }))}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={data.followup_90day_date}
                  onChange={(e) => setData(prev => ({ ...prev, followup_90day_date: e.target.value }))}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}