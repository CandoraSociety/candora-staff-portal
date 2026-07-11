import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ACTION_TYPES = [
  { value: 'verbal_warning', label: 'Verbal Warning' },
  { value: 'written_warning', label: 'Written Warning' },
  { value: 'final_warning', label: 'Final Warning' },
  { value: 'suspension', label: 'Suspension' },
  { value: 'performance_improvement_plan', label: 'Performance Improvement Plan' },
  { value: 'termination', label: 'Termination' },
];

export default function CorrectiveActionForm({ employees, user, onSubmit, isLoading }) {
  const [form, setForm] = useState({
    employee_id: '',
    employee_name: '',
    action_type: '',
    issue_date: '',
    reason: '',
    description: '',
    improvement_plan: '',
    follow_up_date: '',
  });

  const handleEmployeeChange = (id) => {
    const emp = employees.find(e => e.id === id);
    setForm({ ...form, employee_id: id, employee_name: emp ? `${emp.first_name} ${emp.last_name}` : '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      issued_by_email: user?.email,
      issued_by_name: user?.full_name,
      status: 'active',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label>Employee *</Label>
        <Select value={form.employee_id} onValueChange={handleEmployeeChange}>
          <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
          <SelectContent>
            {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Action Type *</Label>
          <Select value={form.action_type} onValueChange={val => setForm({ ...form, action_type: val })}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {ACTION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Issue Date *</Label>
          <Input type="date" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} required />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Reason *</Label>
        <Input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Reason for corrective action" required />
      </div>
      <div className="space-y-1">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detailed description" rows={3} />
      </div>
      <div className="space-y-1">
        <Label>Improvement Plan</Label>
        <Textarea value={form.improvement_plan} onChange={e => setForm({ ...form, improvement_plan: e.target.value })} placeholder="Steps the employee must take" rows={2} />
      </div>
      <div className="space-y-1">
        <Label>Follow-up Date</Label>
        <Input type="date" value={form.follow_up_date} onChange={e => setForm({ ...form, follow_up_date: e.target.value })} />
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Saving...' : 'Submit Corrective Action'}
      </Button>
    </form>
  );
}