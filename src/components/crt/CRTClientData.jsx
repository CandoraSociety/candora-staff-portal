import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// Label mappings
const RESIDENCY_LABELS = {
  canadian_citizen: 'Canadian Citizen',
  permanent_resident: 'Permanent Resident',
  protected_person: 'Protected Person',
  convention_refugee: 'Convention Refugee',
  refugee_claimant: 'Refugee Claimant',
  temporary_resident: 'Temporary Resident',
  work_permit: 'Work Permit',
  study_permit: 'Study Permit',
  visitor: 'Visitor',
  other: 'Other',
};

const SERVICE_LABELS = {
  direct_to_employment: 'DEA',
  pathways: 'Pathways',
  casual: 'Casual',
  external_referral: 'Ext. Referral',
  internal_referral: 'Int. Referral',
  not_eligible: 'Not Eligible',
};

// Helper function to format dates
const fmt = (dateStr) => {
  if (!dateStr) return '';
  try {
    return format(new Date(dateStr), 'yyyy-MM-dd');
  } catch {
    return dateStr;
  }
};

// Helper function to format CLB level
const fmtCLB = (clbLevel) => {
  if (!clbLevel) return '';
  if (clbLevel === 'native_english_french') return 'Native';
  return clbLevel.replace('clb_', 'CLB ').replace('_', ' ');
};

// Column definitions
const COLUMNS = [
  { label: 'Last Name', key: 'last_name', raw: true },
  { label: 'First Name', key: 'first_name', raw: true },
  { label: 'DOB', key: 'date_of_birth', format: fmt },
  { label: 'HSID#', key: 'compass_hsid', raw: true },
  { label: 'Residency Status', key: 'residency_status', map: RESIDENCY_LABELS },
  { label: 'CLB Level', key: 'clb_level', format: fmtCLB },
  { label: 'Service Stream', key: 'service_type', map: SERVICE_LABELS },
  { label: 'Start Date', key: 'service_start_date', format: fmt },
  { label: 'Intake Date', key: 'intake_date', format: fmt },
  { label: 'Career Counsellor', key: 'assigned_worker_name', raw: true },
  { label: 'Employment Status', key: 'employment_status', raw: true },
  { label: 'Phone', key: 'phone', raw: true },
  { label: 'Email', key: 'email', raw: true },
  { label: 'City', key: 'city', raw: true },
  { label: 'Postal Code', key: 'zip', raw: true },
  { label: 'Barriers Identified?', key: 'barriers_addressed', special: true },
];

// Clickable cell component for copy/paste
function CopyCell({ value, className = '' }) {
  const handleSelect = (e) => {
    const cell = e.currentTarget;
    const range = document.createRange();
    range.selectNodeContents(cell);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  };

  return (
    <td
      className={`px-2 py-1.5 text-xs text-slate-700 border-r border-slate-100 whitespace-nowrap cursor-pointer hover:bg-blue-50 select-all ${className}`}
      onClick={handleSelect}
      title="Click to select for copy"
    >
      {value || ''}
    </td>
  );
}

export default function CRTClientData({ clients }) {
  const navigate = useNavigate();

  if (!clients || clients.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 text-sm">
        No clients in selected period.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Info Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2">
        <p className="text-xs text-slate-500">
          Click any cell to select its text for copy/paste. Use Ctrl+C / Cmd+C after selecting.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="text-left py-2 px-3 font-semibold whitespace-nowrap sticky left-0 bg-slate-800">#</th>
              {COLUMNS.map((col, idx) => (
                <th
                  key={idx}
                  className="text-left py-2 px-3 font-semibold whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map((client, rowIdx) => (
              <tr
                key={client.id}
                className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
              >
                {/* Row Number */}
                <td className="px-2 py-1.5 text-xs text-slate-400 border-r border-slate-100 whitespace-nowrap sticky left-0 bg-inherit">
                  {rowIdx + 1}
                </td>

                {/* Data Columns */}
                {COLUMNS.map((col, colIdx) => {
                  const value = client[col.key];

                  // Special handling for Barriers Identified column
                  if (col.special) {
                    if (value === true) {
                      return (
                        <td
                          key={colIdx}
                          className="px-2 py-1.5 text-xs border-r border-slate-100 whitespace-nowrap"
                        >
                          <button
                            onClick={() =>
                              navigate(
                                `/pathways/client/${client.id}?tab=program_flow&step=barrier_action_plan`
                              )
                            }
                            className="text-blue-600 underline hover:text-blue-900 cursor-pointer"
                          >
                            Yes →
                          </button>
                        </td>
                      );
                    } else {
                      return (
                        <td
                          key={colIdx}
                          className="px-2 py-1.5 text-xs text-slate-400 border-r border-slate-100 whitespace-nowrap"
                        >
                          No
                        </td>
                      );
                    }
                  }

                  // Apply mapping if defined
                  let displayValue = value;
                  if (col.map && value) {
                    displayValue = col.map[value] || value;
                  } else if (col.format && value) {
                    displayValue = col.format(value);
                  }

                  return (
                    <CopyCell
                      key={colIdx}
                      value={displayValue}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}