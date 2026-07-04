import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEFAULT_TIER_CONFIGS } from '@/lib/tierPermissionPresets';

const departments = ['Administration', 'Operations', 'Finance', 'Human Resources', 'Marketing', 'IT', 'Sales', 'Customer Service', 'Legal', 'Other'];
const statuses = ['active', 'on_leave', 'terminated', 'suspended', 'probation', 'occasional'];

export default function EmployeeForm({ employee, onSubmit, isLoading, submitLabel }) {
  const [data, setData] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    position: '', department: '', org_tier: '', status: 'active', hire_date: '',
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
      });
    }
  }, [employee]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(data);
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
        <Label>Status</Label>
        <Select value={data.status} onValueChange={val => setData({ ...data, status: val })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{statuses.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Saving...' : (submitLabel || (employee ? 'Save Changes' : 'Save Employee'))}
      </Button>
    </form>
  );
}