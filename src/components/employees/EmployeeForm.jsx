import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DEFAULT_TIER_CONFIGS } from '@/lib/tierPermissionPresets';

const departments = ['Administration', 'Operations', 'Finance', 'Human Resources', 'Marketing', 'IT', 'Sales', 'Customer Service', 'Legal', 'Other'];
const statuses = ['active', 'on_leave', 'terminated', 'suspended', 'probation', 'occasional'];

export default function EmployeeForm({ employee, onSubmit, isLoading, submitLabel }) {
  const [data, setData] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    position: '', department: '', org_tier: '', status: 'active', hire_date: '',
    can_access_billing: false,
    employment_type: '', hourly_wage: '', vacation_percentage: '',
    vacation_hours_start: '', sick_hours_start: '', personal_hours_start: '',
  });

  const { data: orgSettingsList = [] } = useQuery({
    queryKey: ['orgSettings'],
    queryFn: () => base44.entities.OrgSettings.list(),
    staleTime: 1000 * 60 * 5,
  });

  const orgTiers = (orgSettingsList[0]?.tier_configs?.length > 0
    ? orgSettingsList[0].tier_configs
    : DEFAULT_TIER_CONFIGS
  ).map(t => ({ value: t.id, label: t.label }));

  useEffect(() => {
    if (employee) {
      setData({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        position: employee.position || '',
        department: employee.department || '',
        org_tier: employee.org_tier || '',
        status: employee.status || 'active',
        hire_date: employee.hire_date || '',
        can_access_billing: employee.can_access_billing || false,
        employment_type: employee.employment_type || '',
        hourly_wage: employee.hourly_wage ?? '',
        vacation_percentage: employee.vacation_percentage ?? '',
        vacation_hours_start: employee.vacation_hours_start ?? '',
        sick_hours_start: employee.sick_hours_start ?? '',
        personal_hours_start: employee.personal_hours_start ?? '',
      });
    }
  }, [employee]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = v => (v === '' || v === null ? null : Number(v));
    onSubmit({
      ...data,
      hourly_wage: num(data.hourly_wage),
      vacation_percentage: num(data.vacation_percentage),
      vacation_hours_start: num(data.vacation_hours_start) ?? 0,
      sick_hours_start: num(data.sick_hours_start) ?? 0,
      personal_hours_start: num(data.personal_hours_start) ?? 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>First Name *</Label>
          <Input value={data.first_name} onChange={e => setData({ ...data, first_name: e.target.value })} placeholder="First name" required />
        </div>
        <div className="space-y-1">
          <Label>Last Name *</Label>
          <Input value={data.last_name} onChange={e => setData({ ...data, last_name: e.target.value })} placeholder="Last name" required />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Email *</Label>
        <Input type="email" value={data.email} onChange={e => setData({ ...data, email: e.target.value })} placeholder="Email" required />
      </div>
      <div className="space-y-1">
        <Label>Phone</Label>
        <Input value={data.phone} onChange={e => setData({ ...data, phone: e.target.value })} placeholder="Phone" />
      </div>
      <div className="space-y-1">
        <Label>Position *</Label>
        <Input value={data.position} onChange={e => setData({ ...data, position: e.target.value })} placeholder="Job title" required />
      </div>
      <div className="space-y-1">
        <Label>Position Type *</Label>
        <Select value={data.org_tier} onValueChange={val => setData({ ...data, org_tier: val })}>
          <SelectTrigger><SelectValue placeholder="Select position type" /></SelectTrigger>
          <SelectContent>{orgTiers.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Department *</Label>
        <Select value={data.department} onValueChange={val => setData({ ...data, department: val })}>
          <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
          <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Hire Date</Label>
        <Input type="date" value={data.hire_date} onChange={e => setData({ ...data, hire_date: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>Employment Type</Label>
        <Select value={data.employment_type} onValueChange={val => setData({ ...data, employment_type: val })}>
          <SelectTrigger><SelectValue placeholder="Salary or hourly" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="salary">Salary</SelectItem>
            <SelectItem value="hourly">Hourly</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {data.employment_type === 'hourly' && (
        <div className="space-y-1">
          <Label>Hourly Wage ($)</Label>
          <Input type="number" step="0.01" min="0" value={data.hourly_wage} onChange={e => setData({ ...data, hourly_wage: e.target.value })} placeholder="e.g. 18.50" />
        </div>
      )}
      <div className="space-y-1">
        <Label>Vacation Accrual (%)</Label>
        <Input type="number" step="0.01" min="0" value={data.vacation_percentage} onChange={e => setData({ ...data, vacation_percentage: e.target.value })} placeholder="e.g. 4 — vacation hours earned per 100 hours worked" />
      </div>
      <div className="space-y-1">
        <Label>Status</Label>
        <Select value={data.status} onValueChange={val => setData({ ...data, status: val })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{statuses.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="rounded-lg border p-3 space-y-3">
        <div>
          <Label className="text-sm font-medium">Time-Off Starting Balances (hours)</Label>
          <p className="text-xs text-muted-foreground mt-0.5">Where this employee is at right now — vacation accrues automatically from here as hours are worked.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Vacation</Label>
            <Input type="number" step="0.25" min="0" value={data.vacation_hours_start} onChange={e => setData({ ...data, vacation_hours_start: e.target.value })} placeholder="0" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Sick</Label>
            <Input type="number" step="0.25" min="0" value={data.sick_hours_start} onChange={e => setData({ ...data, sick_hours_start: e.target.value })} placeholder="0" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Personal</Label>
            <Input type="number" step="0.25" min="0" value={data.personal_hours_start} onChange={e => setData({ ...data, personal_hours_start: e.target.value })} placeholder="0" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label className="text-sm font-medium">Pathways Billing Access</Label>
          <p className="text-xs text-muted-foreground mt-0.5">Grant access to the Pathways billing tab</p>
        </div>
        <Switch
          checked={data.can_access_billing}
          onCheckedChange={(checked) => setData({ ...data, can_access_billing: checked })}
        />
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Saving...' : (submitLabel || (employee ? 'Save Changes' : 'Save Employee'))}
      </Button>
    </form>
  );
}