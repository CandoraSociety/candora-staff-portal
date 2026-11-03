import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';

// Facilitator picker for FRN sessions. Lists staff assigned to Family Programs
// (FRN and PHAC), plus anyone added by hand as an eligible facilitator.
export default function FacilitatorSelect({ value, onChange, className }) {
  const { data: employees = [] } = useQuery({
    queryKey: ['frn-employees'],
    queryFn: () => base44.entities.Employee.list('last_name', 500),
  });
  const { data: staffRoles = [] } = useQuery({
    queryKey: ['frn-staff-roles'],
    queryFn: () => base44.entities.StaffProgramRole.list('staff_name', 500),
  });
  const { data: facilitators = [] } = useQuery({
    queryKey: ['frn-facilitators'],
    queryFn: () => base44.entities.FRNFacilitator.list('name', 500),
  });

  const { frnStaff, phacStaff, others } = useMemo(() => {
    const seen = new Set();
    const add = (list, person) => {
      const key = (person.name || '').trim().toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      list.push(person);
    };

    const frn = [];
    const phac = [];

    employees
      .filter(e => e.division === 'FRN' || e.division === 'PHAC' || e.department === 'Family Programs')
      .forEach(e => {
        const name = [e.first_name, e.last_name].filter(Boolean).join(' ').trim();
        add(e.division === 'PHAC' ? phac : frn, { name, email: e.email });
      });

    staffRoles
      .filter(r => r.is_active !== false && ['frn', 'phac'].includes(r.program_portal))
      .forEach(r => add(r.program_portal === 'phac' ? phac : frn, { name: r.staff_name, email: r.staff_email }));

    const manual = [];
    facilitators
      .filter(f => f.is_active !== false)
      .forEach(f => add(manual, { name: f.name, email: f.email }));

    return { frnStaff: frn, phacStaff: phac, others: manual };
  }, [employees, staffRoles, facilitators]);

  const all = [...frnStaff, ...phacStaff, ...others];
  const current = all.find(p => p.name === value);
  const currentInList = all.some(p => p.name === value);

  const handleChange = (name) => {
    const person = all.find(p => p.name === name);
    onChange?.(name, person?.email || '');
  };

  return (
    <Select value={value || ''} onValueChange={handleChange}>
      <SelectTrigger className={className}><SelectValue placeholder="Select facilitator..." /></SelectTrigger>
      <SelectContent>
        {value && !currentInList && <SelectItem value={value}>{value}</SelectItem>}
        {frnStaff.length > 0 && (
          <SelectGroup>
            <SelectLabel>FRN staff</SelectLabel>
            {frnStaff.map(p => <SelectItem key={`frn-${p.name}`} value={p.name}>{p.name}</SelectItem>)}
          </SelectGroup>
        )}
        {phacStaff.length > 0 && (
          <SelectGroup>
            <SelectLabel>PHAC staff</SelectLabel>
            {phacStaff.map(p => <SelectItem key={`phac-${p.name}`} value={p.name}>{p.name}</SelectItem>)}
          </SelectGroup>
        )}
        {others.length > 0 && (
          <SelectGroup>
            <SelectLabel>Other eligible facilitators</SelectLabel>
            {others.map(p => <SelectItem key={`other-${p.name}`} value={p.name}>{p.name}</SelectItem>)}
          </SelectGroup>
        )}
        {all.length === 0 && !value && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">No facilitators on file yet</div>
        )}
        {current && current.email && (
          <div className="px-2 pt-1 pb-1.5 text-[11px] text-muted-foreground">{current.email}</div>
        )}
      </SelectContent>
    </Select>
  );
}