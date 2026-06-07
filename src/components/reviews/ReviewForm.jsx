import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const periods = ['Q1', 'Q2', 'Q3', 'Q4', 'Annual', 'Probationary', 'Mid-Year'];
const ratings = ['exceeds_expectations', 'meets_expectations', 'needs_improvement', 'unsatisfactory'];

export default function ReviewForm({ employees, user, onSubmit, isLoading }) {
  const [data, setData] = useState({
    employee_id: '', employee_name: '',
    reviewer_email: user?.email || '', reviewer_name: user?.full_name || '',
    review_period: '', review_date: new Date().toISOString().split('T')[0],
    overall_rating: '', strengths: '', areas_for_improvement: '', comments: '',
  });

  const handleEmployeeChange = (id) => {
    const emp = employees.find(e => e.id === id);
    setData({ ...data, employee_id: id, employee_name: emp ? `${emp.first_name} ${emp.last_name}` : '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label>Employee *</Label>
        <Select value={data.employee_id} onValueChange={handleEmployeeChange}>
          <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
          <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Period *</Label>
          <Select value={data.review_period} onValueChange={val => setData({ ...data, review_period: val })}>
            <SelectTrigger><SelectValue placeholder="Select period" /></SelectTrigger>
            <SelectContent>{periods.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Review Date *</Label>
          <Input type="date" value={data.review_date} onChange={e => setData({ ...data, review_date: e.target.value })} required />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Overall Rating *</Label>
        <Select value={data.overall_rating} onValueChange={val => setData({ ...data, overall_rating: val })}>
          <SelectTrigger><SelectValue placeholder="Select rating" /></SelectTrigger>
          <SelectContent>{ratings.map(r => <SelectItem key={r} value={r}>{r.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>Strengths</Label>
        <Textarea value={data.strengths} onChange={e => setData({ ...data, strengths: e.target.value })} placeholder="Key strengths..." rows={3} />
      </div>

      <div className="space-y-1">
        <Label>Areas for Improvement</Label>
        <Textarea value={data.areas_for_improvement} onChange={e => setData({ ...data, areas_for_improvement: e.target.value })} placeholder="Areas to develop..." rows={3} />
      </div>

      <div className="space-y-1">
        <Label>Comments</Label>
        <Textarea value={data.comments} onChange={e => setData({ ...data, comments: e.target.value })} placeholder="Additional comments..." rows={2} />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Saving...' : 'Save Review'}
      </Button>
    </form>
  );
}