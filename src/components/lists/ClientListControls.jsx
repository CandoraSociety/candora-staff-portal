import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, SlidersHorizontal, X, ChevronUp, ChevronDown } from 'lucide-react';
import { differenceInMonths, differenceInYears, parseISO } from 'date-fns';
import MultiSelectFilter from './MultiSelectFilter';

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

function MonthRangeInput({ label, fromValue, toValue, onFrom, onTo }) {
  return (
    <div>
      <Label className="text-xs font-medium text-slate-600 mb-1 block">{label}</Label>
      <div className="flex items-center gap-1">
        <input
          type="month"
          className="h-8 text-xs rounded-md border border-slate-300 px-2 flex-1 min-w-0"
          value={fromValue || ''}
          onChange={e => onFrom(e.target.value)}
        />
        <span className="text-slate-400 text-xs">–</span>
        <input
          type="month"
          className="h-8 text-xs rounded-md border border-slate-300 px-2 flex-1 min-w-0"
          value={toValue || ''}
          onChange={e => onTo(e.target.value)}
        />
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <MultiSelectFilter label={label} value={value || []} onChange={onChange} options={options} />
  );
}

export default function ClientListControls({ search, onSearch, filters, onFilters, sortKey, onSort, workers = [], variant = 'default' }) {
  const isWorker = variant === 'worker';
  const [open, setOpen] = useState(false);

  const activeFilterCount = Object.values(filters).filter(v =>
    Array.isArray(v) ? v.length > 0 : (v !== '' && v !== null && v !== undefined)
  ).length;

  const clearAll = () => {
    onFilters({
      service_type: [], program_status: [], employment_status: [],
      clb_level: [], assigned_worker: [], age_min: '', age_max: '',
      duration_min: '', duration_max: '', referral_source: [], residency_status: [], followup_90day_status: [],
      intake_month_from: '', intake_month_to: '', start_month_from: '', start_month_to: '', completion_month_from: '', completion_month_to: '',
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
            options={(isWorker
              ? [
                  { value: 'direct_to_employment', label: 'DEA' },
                  { value: 'pathways', label: 'WD' },
                ]
              : [
                  { value: 'direct_to_employment', label: 'DEA' },
                  { value: 'pathways', label: 'WD' },
                  { value: 'casual', label: 'Casual' },
                  { value: 'external_referral', label: 'Ext. Referral' },
                  { value: 'internal_referral', label: 'Int. Referral' },
                  { value: 'not_eligible', label: 'Not Eligible' },
                ]
            )}
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
          {!isWorker && (
            <FilterSelect
              label="Career Counsellor"
              value={filters.assigned_worker}
              onChange={v => onFilters({ ...filters, assigned_worker: v })}
              options={workers.map(w => ({ value: w, label: w }))}
            />
          )}
          {!isWorker && (
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
          )}
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
          {!isWorker && (
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1 block">Min Months in Program</Label>
              <Input className="h-8 text-xs" type="number" placeholder="e.g. 1" value={filters.duration_min}
                onChange={e => onFilters({ ...filters, duration_min: e.target.value })} />
            </div>
          )}
          {!isWorker && (
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1 block">Max Months in Program</Label>
              <Input className="h-8 text-xs" type="number" placeholder="e.g. 12" value={filters.duration_max}
                onChange={e => onFilters({ ...filters, duration_max: e.target.value })} />
            </div>
          )}
        <div className="border-t border-slate-200 pt-3 mt-1 col-span-full">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Date Ranges (by month)</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MonthRangeInput
              label="Intake Month"
              fromValue={filters.intake_month_from} toValue={filters.intake_month_to}
              onFrom={v => onFilters({ ...filters, intake_month_from: v })}
              onTo={v => onFilters({ ...filters, intake_month_to: v })}
            />
            <MonthRangeInput
              label="Program Start Month"
              fromValue={filters.start_month_from} toValue={filters.start_month_to}
              onFrom={v => onFilters({ ...filters, start_month_from: v })}
              onTo={v => onFilters({ ...filters, start_month_to: v })}
            />
            <MonthRangeInput
              label="Completion Month"
              fromValue={filters.completion_month_from} toValue={filters.completion_month_to}
              onFrom={v => onFilters({ ...filters, completion_month_from: v })}
              onTo={v => onFilters({ ...filters, completion_month_to: v })}
            />
          </div>
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

  // Exact filters (multi-select: match if client's value is in selected array)
  const exactFields = ['service_type', 'program_status', 'employment_status', 'clb_level', 'followup_90day_status', 'referral_source', 'residency_status'];
  for (const f of exactFields) {
    if (filters[f] && filters[f].length) result = result.filter(c => filters[f].includes(c[f]));
  }

  // Partial match for assigned_worker (multi-select: match any selected worker name substring)
  if (filters.assigned_worker && filters.assigned_worker.length) {
    const lowered = filters.assigned_worker.map(w => w.toLowerCase());
    result = result.filter(c => {
      const wn = (c.assigned_worker_name || '').toLowerCase();
      return lowered.some(w => wn.includes(w));
    });
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

  // Month-range filters (by YYYY-MM)
  const inMonthRange = (dateStr, fromMonth, toMonth) => {
    if (!fromMonth && !toMonth) return true;
    if (!dateStr) return false;
    const d = parseISO(dateStr);
    if (fromMonth) {
      const [fy, fm] = fromMonth.split('-').map(Number);
      if (d < new Date(fy, fm - 1, 1)) return false;
    }
    if (toMonth) {
      const [ty, tm] = toMonth.split('-').map(Number);
      if (d > new Date(ty, tm, 0, 23, 59, 59, 999)) return false;
    }
    return true;
  };
  if (filters.intake_month_from || filters.intake_month_to) {
    result = result.filter(c => inMonthRange(c.intake_date, filters.intake_month_from, filters.intake_month_to));
  }
  if (filters.start_month_from || filters.start_month_to) {
    result = result.filter(c => inMonthRange(c.service_start_date, filters.start_month_from, filters.start_month_to));
  }
  if (filters.completion_month_from || filters.completion_month_to) {
    result = result.filter(c => inMonthRange(c.completion_date, filters.completion_month_from, filters.completion_month_to));
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