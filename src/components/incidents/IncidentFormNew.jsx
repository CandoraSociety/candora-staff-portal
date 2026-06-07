import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

const types = ['workplace_safety', 'policy_violation', 'harassment', 'discrimination', 'attendance', 'insubordination', 'theft', 'substance_abuse', 'property_damage', 'verbal_altercation', 'physical_altercation', 'other'];
const severities = ['low', 'medium', 'high', 'critical'];

export default function IncidentFormNew({ employees, supervisors, user, onSubmit, isLoading }) {
  const [involvedEmployees, setInvolvedEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [data, setData] = useState({
    employee_ids: [], employee_names: [],
    reporter_email: user?.email || '', reporter_name: user?.full_name || '',
    assigned_to_email: '', assigned_to_name: '',
    incident_date: new Date().toISOString().split('T')[0],
    incident_type: '', severity: 'medium', location: '',
    description: '', witnesses: '', action_taken: '',
  });

  const handleAddEmployee = () => {
    if (!selectedEmployeeId) return;
    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (emp && !involvedEmployees.find(e => e.id === emp.id)) {
      const newList = [...involvedEmployees, emp];
      setInvolvedEmployees(newList);
      setData({ ...data, employee_ids: newList.map(e => e.id), employee_names: newList.map(e => `${e.first_name} ${e.last_name}`) });
      setSelectedEmployeeId('');
    }
  };

  const handleRemoveEmployee = (id) => {
    const newList = involvedEmployees.filter(e => e.id !== id);
    setInvolvedEmployees(newList);
    setData({ ...data, employee_ids: newList.map(e => e.id), employee_names: newList.map(e => `${e.first_name} ${e.last_name}`) });
  };

  const handleAssignedChange = (email) => {
    const sup = supervisors.find(s => s.email === email);
    setData({ ...data, assigned_to_email: email, assigned_to_name: sup?.full_name || '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (involvedEmployees.length === 0) { alert('Please add at least one employee'); return; }
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Employees Involved *</Label>
        <div className="flex gap-2">
          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Select employee" /></SelectTrigger>
            <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>)}</SelectContent>
          </Select>
          <Button type="button" onClick={handleAddEmployee} variant="outline">Add</Button>
        </div>
        {involvedEmployees.map(emp => (
          <div key={emp.id} className="flex items-center justify-between p-2 bg-muted/40 rounded text-sm">
            <span>{emp.first_name} {emp.last_name}</span>
            <button type="button" onClick={() => handleRemoveEmployee(emp.id)} className="text-destructive hover:text-destructive/80"><X className="w-4 h-4" /></button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Incident Date *</Label>
          <Input type="date" value={data.incident_date} onChange={e => setData({ ...data, incident_date: e.target.value })} required />
        </div>
        <div className="space-y-1">
          <Label>Location</Label>
          <Input value={data.location} onChange={e => setData({ ...data, location: e.target.value })} placeholder="Where it occurred" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Type *</Label>
          <Select value={data.incident_type} onValueChange={val => setData({ ...data, incident_type: val })}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>{types.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Severity *</Label>
          <Select value={data.severity} onValueChange={val => setData({ ...data, severity: val })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{severities.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label>Assigned To (Investigator/Resolver)</Label>
        <Select value={data.assigned_to_email} onValueChange={handleAssignedChange}>
          <SelectTrigger><SelectValue placeholder="Select investigator" /></SelectTrigger>
          <SelectContent>{supervisors.map(s => <SelectItem key={s.id} value={s.email}>{s.full_name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>Description *</Label>
        <Textarea value={data.description} onChange={e => setData({ ...data, description: e.target.value })} placeholder="Describe the incident..." rows={4} required />
      </div>

      <div className="space-y-1">
        <Label>Witnesses</Label>
        <Textarea value={data.witnesses} onChange={e => setData({ ...data, witnesses: e.target.value })} placeholder="Any witnesses..." rows={2} />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Submitting...' : 'File Incident Report'}
      </Button>
    </form>
  );
}