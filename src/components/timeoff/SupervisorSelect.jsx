import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Staff directory as selectable supervisors (shared by timesheets, vacation requests)
export function useSupervisors() {
  const { data: employees = [] } = useQuery({
    queryKey: ['timesheet-supervisors'],
    queryFn: () => base44.entities.Employee.list(),
  });
  return employees
    .filter(e => !e.access_disabled && e.status !== 'terminated')
    .map(e => ({ email: e.email, name: `${e.first_name || ''} ${e.last_name || ''}`.trim() }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default function SupervisorSelect({ value, onChange, label = 'Supervisor (for approval)' }) {
  const supervisors = useSupervisors();
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full mt-1.5">
          <SelectValue placeholder="Select your supervisor" />
        </SelectTrigger>
        <SelectContent>
          {supervisors.map(s => (
            <SelectItem key={s.email} value={s.email}>{s.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}