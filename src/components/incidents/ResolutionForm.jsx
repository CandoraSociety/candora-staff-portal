import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

const resolutionTypes = ['no_action', 'corrective_action', 'performance_improvement_plan', 'mediation', 'termination', 'suspension', 'training_required', 'other'];
const noActionReasons = ['employees_resolved_themselves', 'no_fault_found', 'insufficient_evidence', 'not_substantiated', 'other'];

export default function ResolutionForm({ incident, user, onSubmit, isLoading }) {
  const [data, setData] = useState({
    incident_id: incident?.id || '',
    resolution_type: '', no_action_reason: '',
    details: '',
    resolved_by_email: user?.email || '', resolved_by_name: user?.full_name || '',
    resolution_date: new Date().toISOString().split('T')[0],
    status: 'pending',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-sm bg-muted/40 rounded p-3">
        <p className="font-medium">{incident?.employee_names?.join(', ')}</p>
        <p className="text-muted-foreground">{incident?.incident_type?.replace(/_/g, ' ')} • {incident?.incident_date}</p>
      </div>

      <div className="space-y-1">
        <Label>Resolution Type *</Label>
        <Select value={data.resolution_type} onValueChange={val => setData({ ...data, resolution_type: val })}>
          <SelectTrigger><SelectValue placeholder="Select resolution" /></SelectTrigger>
          <SelectContent>{resolutionTypes.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {data.resolution_type === 'no_action' && (
        <div className="space-y-1">
          <Label>Reason for No Action *</Label>
          <Select value={data.no_action_reason} onValueChange={val => setData({ ...data, no_action_reason: val })}>
            <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
            <SelectContent>{noActionReasons.map(r => <SelectItem key={r} value={r}>{r.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1">
        <Label>Resolution Details *</Label>
        <Textarea value={data.details} onChange={e => setData({ ...data, details: e.target.value })} placeholder="Describe the resolution..." rows={4} required />
      </div>

      <div className="space-y-1">
        <Label>Resolution Date *</Label>
        <Input type="date" value={data.resolution_date} onChange={e => setData({ ...data, resolution_date: e.target.value })} required />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Saving...' : 'Document Resolution'}
      </Button>
    </form>
  );
}