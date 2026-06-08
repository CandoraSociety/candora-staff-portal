import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, SlidersHorizontal, X, ChevronUp, ChevronDown } from 'lucide-react';
import { differenceInMonths, differenceInYears, parseISO } from 'date-fns';

const SORT_OPTIONS = [
  { value: 'last_name_asc', label: 'Name (A → Z)' },
  { value: 'last_name_desc', label: 'Name (Z → A)' },
  { value: 'intake_date_desc', label: 'Intake Date (newest)' },
  { value: 'intake_date_asc', label: 'Intake Date (oldest)' },
  { value: 'service_start_date_desc', label: 'Program Start (newest)' },
  { value: 'service_start_date_asc', label: 'Program Start (oldest)' },
  { value: 'completion_date_desc', label: 'Completion Date (newest)' },
  { value: 'completion_date_asc', label: 'Completion Date (oldest)' },
  { value: 'assigned_worker_name_asc', label: 'Career Counsellor (A → Z)' },
  { value: 'assigned_worker_name_desc', label: 'Career Counsellor (Z → A)' },
];

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div>
      <Label className="text-xs font-medium text-slate-600 mb-1 block">{label}</Label>
      <Select value={value || '__any__'} onValueChange={v => onChange(v === '__any__' ? '' : v)}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Any" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__any__">Any</SelectItem>
          {options.map(o => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function ClientListControls({ search, onSearch, filters, onFilters, sortKey, onSort, workers = [] }) {
  const [open, setOpen] = useState(false);

  const activeFilterCount = Object.values(filters).filter(v => v !== '' && v !== null && v !== undefined).length;

  const clearAll = () => {
    onFilters({
      service_type: '', program_status: '', employment_status: '',
      clb_level: '', assigned_worker: '', age_min: '', age_max: '',
      duration_min: '', duration_max: '', referral_source: '', residency_status: '', followup_90day_status: '',
    });
  };

  return (
    <div className="space-y-2 mb-4">
      {/* Row 1 */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <Input
            className="pl-9 h-9"
            placeholder="Search name, HSID#, phone, email..."
            value={search}
            onChange={e => onSearch(e.target.value)}
          />
        </div>

        <div className="w-56">
          <Select value={sortKey} onValueChange={onSort}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant={activeFilterCount > 0 ? 'default' : 'outline'}
          size="sm"
          className="gap-2 h-9"
          onClick={() => setOpen(v => !v)}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-white text-slate-800 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
          {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </Button>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="gap-1 text-slate-500 h-9" onClick={clearAll}>
            <X className="w-3 h-3" /> Clear filters
          </Button>
        )}
      </div>

      {/* Row 2: Filter panel */}
      {open && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          <FilterSelect
            label="Service Stream"
            value={filters.service_type}
            onChange={v => onFilters({ ...filters, service_type: v })}
            options={[
              { value: 'direct_to_employment', label: 'DEA' },
              { value: 'pathways', label: 'Pathways' },
              { value: 'casual', label: 'Casual' },
              { value: 'external_referral', label: 'Ext. Referral' },
              { value: 'internal_referral', label: 'Int. Referral' },
              { value: 'not_eligible', label: 'Not Eligible' },
            ]}
          />
          <FilterSelect
            label="Program Status"
            value={filters.program_status}
            onChange={v => onFilters({ ...filters, program_status: v })}
            options={[
              { value: 'in_progress', label: 'In Progress' },
              { value: 'complete', label: 'Complete' },
              { value: 'incomplete', label: 'Incomplete' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
          <FilterSelect
            label="Employment Status"
            value={filters.employment_status}
            onChange={v => onFilters({ ...filters, employment_status: v })}
            options={[
              { value: 'E-RF', label: 'Employed (RF)' },
              { value: 'E-UF', label: 'Employed (UF)' },
              { value: 'E-PT', label: 'Employed (PT)' },
              { value: 'UE', label: 'Unemployed' },
              { value: 'UE-LA', label: 'Unemployed (LA)' },
              { value: 'UE-S', label: 'Unemployed (S)' },
              { value: 'NA', label: 'N/A' },
            ]}
          />
          <FilterSelect
            label="CLB Level"
            value={filters.clb_level}
            onChange={v => onFilters({ ...filters, clb_level: v })}
            options={Array.from({ length: 12 }, (_, i) => ({ value: `clb_${i + 1}`, label: `CLB ${i + 1}` })).concat([{ value: 'native_english_french', label: 'Native English/French' }])}
          />
          <FilterSelect
            label="Career Counsellor"
            value={filters.assigned_worker}
            onChange={v => onFilters({ ...filters, assigned_worker: v })}
            options={workers.map(w => ({ value: w, label: w }))}
          />
          <FilterSelect
            label="Referral Source"
            value={filters.referral_source}
            onChange={v => onFilters({ ...filters, referral_source: v })}
            options={[
              { value: 'self', label: 'Self' },
              { value: 'family_friend', label: 'Family/Friend' },
              { value: 'school', label: 'School' },
              { value: 'employer', label: 'Employer' },
              { value: 'external_agency', label: 'External Agency' },
              { value: 'alberta_works', label: 'Alberta Works' },
              { value: 'other', label: 'Other' },
            ]}
          />
          <FilterSelect
            label="Residency Status"
            value={filters.residency_status}
            onChange={v => onFilters({ ...filters, residency_status: v })}
            options={[
              { value: 'canadian_citizen', label: 'Canadian Citizen' },
              { value: 'permanent_resident', label: 'Permanent Resident' },
              { value: 'protected_person', label: 'Protected Person' },
              { value: 'convention_refugee', label: 'Convention Refugee' },
              { value: 'refugee_claimant', label: 'Refugee Claimant' },
              { value: 'temporary_resident', label: 'Temporary Resident' },
              { value: 'work_permit', label: 'Work Permit' },
              { value: 'study_permit', label: 'Study Permit' },
              { value: 'visitor', label: 'Visitor' },
              { value: 'other', label: 'Other' },
            ]}
          />
          <FilterSelect
            label="90-Day Status"
            value={filters.followup_90day_status}
            onChange={v => onFilters({ ...filters, followup_90day_status: v })}
            options={[
              { value: 'E-RF', label: 'Employed (RF)' },
              { value: 'E-UF', label: 'Employed (UF)' },
              { value: 'E-PT', label: 'Employed (PT)' },
              { value: 'UE', label: 'Unemployed' },
              { value: 'no_contact', label: 'No Contact' },
            ]}
          />
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1 block">Age Min</Label>
            <Input className="h-8 text-xs" type="number" placeholder="e.g. 18" value={filters.age_min}
              onChange={e => onFilters({ ...filters, age_min: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1 block">Age Max</Label>
            <Input className="h-8 text-xs" type="number" placeholder="e.g. 65" value={filters.age_max}
              onChange={e => onFilters({ ...filters, age_max: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1 block">Min Months in Program</Label>
            <Input className="h-8 text-xs" type="number" placeholder="e.g. 1" value={filters.duration_min}
              onChange={e => onFilters({ ...filters, duration_min: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1 block">Max Months in Program</Label>
            <Input className="h-8 text-xs" type="number" placeholder="e.g. 12" value={filters.duration_max}
              onChange={e => onFilters({ ...filters, duration_max: e.target.value })} />
          </div>
        </div>
      )}
    </div>
  );
}

export function applyFiltersAndSort(clients, search, filters, sortKey) {
  let result = [...clients];

  // Text search
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(c =>
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
      (c.compass_hsid || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.assigned_worker_name || '').toLowerCase().includes(q)
    );
  }

  // Exact filters
  const exactFields = ['service_type', 'program_status', 'employment_status', 'clb_level', 'followup_90day_status', 'referral_source', 'residency_status'];
  for (const f of exactFields) {
    if (filters[f]) result = result.filter(c => c[f] === filters[f]);
  }

  // Partial match for assigned_worker
  if (filters.assigned_worker) {
    result = result.filter(c => (c.assigned_worker_name || '').toLowerCase().includes(filters.assigned_worker.toLowerCase()));
  }

  // Age range
  if (filters.age_min || filters.age_max) {
    const now = new Date();
    result = result.filter(c => {
      if (!c.date_of_birth) return false;
      const age = differenceInYears(now, parseISO(c.date_of_birth));
      if (filters.age_min && age < parseInt(filters.age_min)) return false;
      if (filters.age_max && age > parseInt(filters.age_max)) return false;
      return true;
    });
  }

  // Duration range (months from service_start_date)
  if (filters.duration_min || filters.duration_max) {
    const now = new Date();
    result = result.filter(c => {
      if (!c.service_start_date) return false;
      const months = differenceInMonths(now, parseISO(c.service_start_date));
      if (filters.duration_min && months < parseInt(filters.duration_min)) return false;
      if (filters.duration_max && months > parseInt(filters.duration_max)) return false;
      return true;
    });
  }

  // Sort
  if (sortKey) {
    const lastUnderscore = sortKey.lastIndexOf('_');
    const dir = sortKey.slice(lastUnderscore + 1); // 'asc' or 'desc'
    const field = sortKey.slice(0, lastUnderscore);
    result.sort((a, b) => {
      const av = a[field] || '';
      const bv = b[field] || '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return dir === 'desc' ? -cmp : cmp;
    });
  }

  return result;
}