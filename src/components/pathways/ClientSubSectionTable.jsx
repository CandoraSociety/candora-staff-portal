import { format, addDays } from 'date-fns';
import { UserCheck } from 'lucide-react';
import SwitchDogEar from './SwitchDogEar';
import { clientRowColor } from '@/lib/clientRowColor';

const CLOSED_REASON_LABELS = {
  completed: "Completed",
  cancelled: "Cancelled",
  incomplete: "Incomplete",
  withdrew: "Withdrew",
  relocated: "Relocated",
  no_longer_eligible: "No Longer Eligible",
  no_contact: "No Contact",
  duplicate: "Duplicate",
  other: "Other",
};

const fmtDate = (d) => {
  if (!d) return "—";
  try { return format(new Date(d), "MMM d, yy"); } catch { return "—"; }
};

// Column configuration per sub-section.
// Base columns (all sub-sections): name, hsid, intake_date, program_start
function getSubSectionColumns(program, subSection) {
  const base = ['name', 'hsid', 'intake_date', 'program_start'];
  if (program === 'dea' && subSection === 'program_started') {
    return [...base, 'completion_date'];
  }
  if (program === 'wd' && subSection === 'program_started') {
    return [...base, 'completion_date'];
  }
  if (program === 'wd' && subSection === 'work_search') {
    return [...base, 'completion_date', 'employment_date'];
  }
  if (program === 'wd' && subSection === 'followup_period') {
    return [...base, 'completion_date', 'employment_date', 'employment_followup_90day'];
  }
  if (program === 'wd' && subSection === 'completed') {
    return [...base, 'completion_date', 'employment_date'];
  }
  if (program === 'dea' && subSection === 'followup_period') {
    return [...base, 'completion_date', 'followup_90day_date', 'employment_status'];
  }
  if (program === 'dea' && subSection === 'completed') {
    return [...base, 'completion_date', 'followup_90day_date', 'employment_outcome'];
  }
  return base;
}

const EMPLOYMENT_STATUS_LABELS = {
  'E-RF': 'Employed (RF)',
  'E-UF': 'Employed (UF)',
  'E-PT': 'Employed (PT)',
  'UE': 'Unemployed',
  'UE-LFW': 'Unemployed (LFW)',
  'UE-S': 'Unemployed (S)',
  'NA': 'N/A',
};

const COLUMN_LABELS = {
  name: 'Name',
  hsid: 'HSID#',
  intake_date: 'Intake Date',
  program_start: 'Program Start',
  completion_date: 'Program Completion Date',
  followup_90day_date: '90-Day Follow-up Date',
  employment_status: 'Current Employment Status',
  employment_outcome: 'Employment Outcome',
  employment_date: 'Employment Date',
  employment_followup_90day: '90 Day Follow-up',
};

function getColLabel(col, subSection) {
  if (col === 'completion_date' && subSection !== 'completed') return 'EDA Completion Date';
  return COLUMN_LABELS[col];
}

export default function ClientSubSectionTable({
  rows,
  program,
  subSection,
  onRowClick,
  onSwitchClient,
  showCounsellor = false,
  onReassign,
  showClosedColumns = false,
  showTransitionBadge = false,
}) {
  const columns = getSubSectionColumns(program, subSection);
  const totalCols = columns.length + (showCounsellor ? 1 : 0) + (showClosedColumns ? 2 : 0);

  const renderCell = (c, colKey) => {
    switch (colKey) {
      case 'name':
        return (
          <td key="name" className="px-3 py-2.5 whitespace-nowrap font-semibold relative" style={{ color: "hsl(231,64%,28%)" }}>
            <SwitchDogEar switches={c.program_stream_switches} />
            {c.first_name} {c.last_name}
            {showTransitionBadge && c._isTransition && (
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(43,45,232,0.15)", color: "#2b2de8" }}>
                Transition
              </span>
            )}
            {c.service_type === "direct_to_employment" && !c.file_closed && !(showTransitionBadge && c._isTransition) && (
              <button
                onClick={(e) => { e.stopPropagation(); onSwitchClient(c); }}
                className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 font-medium transition-colors"
                title="Switch to WD"
              >
                ⇄ WD
              </button>
            )}
          </td>
        );
      case 'hsid':
        return <td key="hsid" className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{c.compass_hsid || "—"}</td>;
      case 'intake_date':
        return <td key="intake_date" className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{fmtDate(c.intake_date)}</td>;
      case 'program_start':
        return <td key="program_start" className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{fmtDate(c.service_start_date)}</td>;
      case 'completion_date':
        if (c.completion_date) {
          return <td key="completion_date" className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{fmtDate(c.completion_date)}</td>;
        }
        // WD work_search/followup_period/completed + DEA followup_period: show actual EDA completion date only (no projection)
        if (
          (program === 'wd' && ['work_search', 'followup_period', 'completed'].includes(subSection)) ||
          (program === 'dea' && subSection === 'followup_period')
        ) {
          return <td key="completion_date" className="px-3 py-2.5 text-slate-400 whitespace-nowrap">—</td>;
        }
        const anticipatedWeeks = program === 'wd' ? 16 : 2;
        const anticipatedDate = c.service_start_date ? addDays(new Date(c.service_start_date), anticipatedWeeks * 7) : null;
        return (
          <td key="completion_date" className="px-3 py-2.5 whitespace-nowrap text-slate-400">
            {anticipatedDate ? format(anticipatedDate, "MMM d, yy") : "—"}
            <span className="block text-[10px] italic">(anticipated completion date)</span>
          </td>
        );
      case 'followup_90day_date': {
        // DEA follow-up period: exactly 90 days after the actual EDA completion date
        if (program === 'dea' && subSection === 'followup_period') {
          const followup = c.completion_date ? addDays(new Date(c.completion_date), 90) : null;
          return (
            <td key="followup_90day_date" className="px-3 py-2.5 whitespace-nowrap text-slate-600">
              {followup ? format(followup, "MMM d, yy") : "—"}
            </td>
          );
        }
        if (c.followup_90day_date) {
          return <td key="followup_90day_date" className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{fmtDate(c.followup_90day_date)}</td>;
        }
        const anticipatedFollowup = c.completion_date ? addDays(new Date(c.completion_date), 90) : null;
        return (
          <td key="followup_90day_date" className="px-3 py-2.5 whitespace-nowrap text-slate-400">
            {anticipatedFollowup ? format(anticipatedFollowup, "MMM d, yy") : "—"}
            <span className="block text-[10px] italic">(anticipated follow-up)</span>
          </td>
        );
      }
      case 'employment_date': {
        if (c.employment_start_date) {
          return <td key="employment_date" className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{fmtDate(c.employment_start_date)}</td>;
        }
        // In follow-up period and completed, show actual employment date only (no projected deadline)
        if (subSection === 'followup_period' || subSection === 'completed') {
          return <td key="employment_date" className="px-3 py-2.5 text-slate-400 whitespace-nowrap">—</td>;
        }
        // 52 weeks from program start, minus 90 days = deadline by which client must be employed
        const employmentDeadline = c.service_start_date ? addDays(new Date(c.service_start_date), 52 * 7 - 90) : null;
        return (
          <td key="employment_date" className="px-3 py-2.5 whitespace-nowrap text-slate-400">
            {employmentDeadline ? format(employmentDeadline, "MMM d, yy") : "—"}
            <span className="block text-[10px] italic">(must be employed by)</span>
          </td>
        );
      }
      case 'employment_followup_90day': {
        // Exactly 90 days from the client's actual employment start date
        const followup = c.employment_start_date ? addDays(new Date(c.employment_start_date), 90) : null;
        return (
          <td key="employment_followup_90day" className="px-3 py-2.5 whitespace-nowrap text-slate-600">
            {followup ? format(followup, "MMM d, yy") : "—"}
          </td>
        );
      }
      case 'employment_status':
        return <td key="employment_status" className="px-3 py-2.5 whitespace-nowrap">{c.employment_status ? (EMPLOYMENT_STATUS_LABELS[c.employment_status] || c.employment_status) : "—"}</td>;
      case 'employment_outcome':
        return <td key="employment_outcome" className="px-3 py-2.5 whitespace-nowrap">{c.followup_90day_status ? (EMPLOYMENT_STATUS_LABELS[c.followup_90day_status] || c.followup_90day_status) : "—"}</td>;
      default:
        return <td key={colKey}>—</td>;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200" style={{ background: "hsl(231,64%,20%)" }}>
            <tr>
              {columns.map(col => (
                <th key={col} className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">{getColLabel(col, subSection)}</th>
              ))}
              {showCounsellor && <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Career Counsellor</th>}
              {showClosedColumns && <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Close Reason</th>}
              {showClosedColumns && <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Closed Date</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(c => (
              <tr
                key={c.id}
                onClick={() => onRowClick(c)}
                className={`group transition-colors cursor-pointer hover:brightness-95 ${clientRowColor(c)}`}
              >
                {columns.map(col => renderCell(c, col))}
                {showCounsellor && (
                  <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>{c.assigned_worker_name || "—"}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onReassign(c); }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-blue-100 transition-all"
                        title="Edit assigned career counsellor"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      </button>
                    </div>
                  </td>
                )}
                {showClosedColumns && (
                  <>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {c.closed_reason ? (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                          {CLOSED_REASON_LABELS[c.closed_reason] || c.closed_reason}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{fmtDate(c.closed_date)}</td>
                  </>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={totalCols} className="text-center py-6 text-slate-400 text-sm">
                  No clients in this section.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}