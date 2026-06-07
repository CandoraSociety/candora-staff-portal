import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CareerPlanForm({ employees, initial = {}, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    employee_id: initial.employee_id || '', employee_name: initial.employee_name || '',
    current_position: initial.current_position || '', target_position: initial.target_position || '',
    readiness: initial.readiness || 'developing', development_goals: initial.development_goals || '',
    required_training: initial.required_training || '', mentor: initial.mentor || '',
    timeline: initial.timeline || '', status: initial.status || 'active', notes: initial.notes || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleEmployeeChange = (id) => {
    const emp = employees.find(e => e.id === id);
    if (emp) { set('employee_id', id); set('employee_name', `${emp.first_name} ${emp.last_name}`); set('current_position', emp.position || ''); }
  };

  const handleSubmit = (e) => { e.preventDefault(); onSubmit(form); };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label>Employee</Label>
        <Select value={form.employee_id} onValueChange={handleEmployeeChange}>
          <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
          <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Current Position</Label>
          <Input value={form.current_position} onChange={e => set('current_position', e.target.value)} placeholder="Current role" />
        </div>
        <div className="space-y-1">
          <Label>Target Position</Label>
          <Input value={form.target_position} onChange={e => set('target_position', e.target.value)} placeholder="Goal role" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Readiness</Label>
          <Select value={form.readiness} onValueChange={v => set('readiness', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ready_now">Ready Now</SelectItem>
              <SelectItem value="ready_1_year">Ready in 1 Year</SelectItem>
              <SelectItem value="ready_2_years">Ready in 2 Years</SelectItem>
              <SelectItem value="developing">Developing</SelectItem>
              <SelectItem value="not_applicable">Not Applicable</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={v => set('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label>Development Goals</Label>
        <Textarea value={form.development_goals} onChange={e => set('development_goals', e.target.value)} rows={3} />
      </div>

      <div className="space-y-1">
        <Label>Required Training</Label>
        <Textarea value={form.required_training} onChange={e => set('required_training', e.target.value)} rows={2} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Mentor</Label>
          <Input value={form.mentor} onChange={e => set('mentor', e.target.value)} placeholder="Mentor name" />
        </div>
        <div className="space-y-1">
          <Label>Timeline</Label>
          <Input value={form.timeline} onChange={e => set('timeline', e.target.value)} placeholder="e.g. 18 months" />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">Save Plan</Button>
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}