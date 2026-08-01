// CRT (Common Reporting Tool) accepted outcome codes.
//
// These are the only values the portal dropdowns should offer for the two
// program-outcome fields, so the sync to the CRT workbook needs no
// translation/mapping (see base44/shared/crtWorkbook.ts).
//
//   - Placement Outcome (post_completion_employment_status, CRT col I):
//       UTC is NOT valid here.
//   - 90-Day Follow-up Outcome (followup_90day_status, CRT col O):
//       UTC IS valid here.

const DESC = {
  'E-RF':   'Employed, Related Field',
  'E-UF':   'Employed, Unrelated Field',
  'SE':     'Self-Employed',
  'UE-LFW': 'Unemployed, Looking for Work',
  'UE-NLF': 'Unemployed, Not in Labour Force',
  'FTT':    'Further Training',
  'AoP':    'Attending other Program',
  'UTC':    'Unable to Contact',
  'P':      'Pending',
  'C':      'Cancelled',
};

const toOptions = (codes) => codes.map((value) => ({ value, desc: DESC[value] }));

// Placement Outcome options (no UTC)
export const PLACEMENT_OUTCOME_CODES = ['E-RF', 'E-UF', 'SE', 'UE-LFW', 'UE-NLF', 'FTT', 'AoP', 'P', 'C'];
export const PLACEMENT_OUTCOME_OPTIONS = toOptions(PLACEMENT_OUTCOME_CODES);

// 90-Day Follow-up options (with UTC)
export const FOLLOWUP_90DAY_CODES = ['E-RF', 'E-UF', 'SE', 'UE-LFW', 'UE-NLF', 'FTT', 'AoP', 'UTC', 'P', 'C'];
export const FOLLOWUP_90DAY_OPTIONS = toOptions(FOLLOWUP_90DAY_CODES);

// "{code} — {desc}" label for Select dropdowns / read-only displays.
export const outcomeLabel = (value) => {
  if (!value) return '';
  return DESC[value] ? `${value} — ${DESC[value]}` : value;
};

// Bare description lookup.
export const outcomeDesc = (value) => (value ? (DESC[value] || value) : '');