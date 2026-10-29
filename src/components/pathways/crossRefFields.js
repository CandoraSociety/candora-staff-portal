import { PLACEMENT_OUTCOME_CODES, FOLLOWUP_90DAY_CODES } from '@/lib/crtCodes';

export const CRT_COLUMNS = [
  { key: 'source_sheet', label: 'CRT Source Sheet' },
  { key: 'participant_name', label: 'Participant Legal Name' },
  { key: 'hsid', label: 'COMPASS HSID #' },
  { key: 'ceis_dea', label: 'CEIS (DEA)' },
  { key: 'dea_start_date', label: 'DEA Start Date' },
  { key: 'service_element', label: 'Service Element' },
  { key: 'service_start_date', label: 'Service Start Date' },
  { key: 'service_outcome', label: 'Service Outcome' },
  { key: 'service_outcome_date', label: 'Service Outcome Date' },
  { key: 'placement_outcome', label: 'Placement Outcome' },
  { key: 'placement_outcome_date', label: 'Placement Outcome Date' },
  { key: 'day90_outcome', label: '90 Day Outcome' },
  { key: 'day90_outcome_date', label: '90 Day Outcome Date' },
  { key: 'comments', label: 'CRT Comments' },
  { key: 'eda_completion_date', label: 'EDA Completion Date' },
  { key: 'work_exposure', label: 'Work Exposure Y/N' },
  { key: 'wage_subsidy', label: 'Wage Subsidy Y/N' },
  { key: 'employed_ftpt', label: 'Employed FT/PT' },
  { key: 'service_nav_support', label: 'Service Nav Support Y/N' },
  { key: 'service_nav_billing_month', label: 'Service Nav Billing Month MM/DD/YY' },
];
export const EDITABLE_CRT_KEYS = CRT_COLUMNS.filter(c => !['source_sheet', 'participant_name', 'hsid'].includes(c.key)).map(c => c.key);
export const OUTCOME_SELECT_KEYS = ['placement_outcome', 'day90_outcome'];
const YES_NO = ['Yes', 'No'];
export const SELECT_OPTIONS = {
  ceis_dea: YES_NO,
  service_element: ['CEIS', 'WD'],
  service_outcome: ['In Progress', 'Complete', 'Cancelled', 'Incomplete'],
  placement_outcome: PLACEMENT_OUTCOME_CODES,
  day90_outcome: FOLLOWUP_90DAY_CODES,
  work_exposure: YES_NO,
  wage_subsidy: YES_NO,
  employed_ftpt: ['FT', 'PT'],
  service_nav_support: YES_NO,
};
export const DATE_COLUMNS = [
  { key: 'dea_start_date', label: 'DEA Start Date' },
  { key: 'service_start_date', label: 'Service Start Date' },
  { key: 'service_outcome_date', label: 'Service Outcome Date' },
  { key: 'placement_outcome_date', label: 'Placement Outcome Date' },
  { key: 'day90_outcome_date', label: '90 Day Outcome Date' },
  { key: 'eda_completion_date', label: 'EDA Completion Date' },
];
export const DATE_KEYS = new Set(DATE_COLUMNS.map(c => c.key));
export const MARCH_2026_END = new Date(2026, 2, 31, 23, 59, 59);
export const parseCrtDate = (s) => {
  if (!s) return null;
  const m = String(s).match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) {
    let y = +m[3]; if (y < 100) y += 2000;
    const d = new Date(y, +m[1] - 1, +m[2]);
    return isNaN(d) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d) ? null : d;
};
export const withDateBreaks = (s) => {
  if (!s) return '';
  const out = String(s).replace(/(\d{1,2}\/\d{1,2}\/\d{2,4})/g, (m, _g, offset, full) => {
    const before = offset > 0 ? full[offset - 1] : '';
    return before === '\n' ? m : '\n' + m;
  });
  return out.startsWith('\n') ? out.slice(1) : out;
};

// Use the displayed field definitions, not a second hand-maintained list.
// Every editable CRT field, including the 90-day date, travels in the push.
export function assembleCrossRefFields(row, getEdit) {
  const fields = { participant_name: row.client_name || '', hsid: row.hsid || '' };
  for (const key of EDITABLE_CRT_KEYS) fields[key] = getEdit(row, key, row.crt?.[key] ?? '');
  return fields;
}