import { X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fmtDate = (d) => {
  if (!d) return "—";
  try { return format(new Date(d), "MMM d, yyyy"); } catch { return "—"; }
};

const SERVICE_STATUS_LABELS = {
  service_not_started: "Service Has Not Started Yet",
  action_plan_in_progress: "Action Plan in Progress",
  in_internal_training: "In Internal Training",
  in_paid_work_exposure: "In Paid Work Exposure",
  "90day_followup_in_progress": "90 Day Follow-up — In Progress",
  "90day_followup_compass": "90 Day Follow-up — Completed (Compass Entry Required)",
  "90day_followup_close": "90 Day Follow-up — Completed (Close File)",
  utc_cancel_from_program: "UTC — Cancel from Program",
  not_progressing_cancel_from_program: "Not Progressing — Cancel from Program",
  unknown: "Unknown",
  consider_removal: "Consider Removal",
};

const SERVICE_STATUS_BADGES = {
  service_not_started: "bg-slate-200 text-slate-700 border-slate-300",
  action_plan_in_progress: "bg-blue-100 text-blue-700 border-blue-300",
  in_internal_training: "bg-purple-100 text-purple-700 border-purple-300",
  in_paid_work_exposure: "bg-amber-100 text-amber-700 border-amber-300",
  "90day_followup_in_progress": "bg-orange-100 text-orange-700 border-orange-300",
  "90day_followup_compass": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "90day_followup_close": "bg-emerald-100 text-emerald-700 border-emerald-300",
  utc_cancel_from_program: "bg-red-100 text-red-700 border-red-300",
  not_progressing_cancel_from_program: "bg-rose-100 text-rose-700 border-rose-300",
  unknown: "bg-gray-100 text-gray-500 border-gray-300",
  consider_removal: "bg-orange-100 text-orange-700 border-orange-300",
};

const FIELD_GROUPS = [
  {
    label: "Contact",
    fields: [
      { key: "first_name", label: "First Name" },
      { key: "last_name", label: "Last Name" },
      { key: "phone", label: "Phone" },
      { key: "email", label: "Email" },
      { key: "compass_hsid", label: "COMPASS HSID" },
    ],
  },
  {
    label: "Program",
    fields: [
      { key: "program", label: "Program", format: (v) => v === "CEIS" ? "DEA (CEIS)" : "Pathways (WD)" },
      { key: "program_stage", label: "Program Stage" },
      { key: "service_element", label: "Service Element" },
      { key: "service_start_date", label: "Service Start", format: fmtDate },
      { key: "service_outcome", label: "Service Outcome" },
      { key: "service_outcome_date", label: "Service Outcome Date", format: fmtDate },
      { key: "placement_outcome", label: "Placement Outcome" },
      { key: "placement_outcome_date", label: "Placement Outcome Date", format: fmtDate },
    ],
  },
  {
    label: "Counsellor Transition",
    fields: [
      { key: "previous_counsellor", label: "Previous Counsellor", format: (v, c) => v === "Other" ? c.previous_counsellor_other || "Other" : v },
      { key: "new_counsellor", label: "New Counsellor" },
      { key: "transition_status", label: "Transition Status", format: (v) => v?.replace(/_/g, " ") },
      { key: "priority", label: "Priority" },
      {
        key: "service_status",
        label: "Service Status",
        format: (v) => SERVICE_STATUS_LABELS[v] || v?.replace(/_/g, " ") || "—",
        badge: (v) => SERVICE_STATUS_BADGES[v],
      },
      { key: "service_status_note", label: "Status Note" },
    ],
  },
  {
    label: "Check-ins",
    fields: [
      { key: "checkin_frequency", label: "Frequency", format: (v) => v?.replace(/_/g, " ") },
      { key: "last_checkin_date", label: "Last Check-in", format: fmtDate },
      { key: "next_checkin_date", label: "Next Check-in", format: fmtDate },
      { key: "checkin_notes", label: "Check-in Notes" },
    ],
  },
  {
    label: "Outcomes",
    fields: [
      { key: "outcome_30day", label: "30-Day Outcome" },
      { key: "outcome_30day_date", label: "30-Day Date", format: fmtDate },
      { key: "outcome_60day", label: "60-Day Outcome" },
      { key: "outcome_60day_date", label: "60-Day Date", format: fmtDate },
      { key: "outcome_90day", label: "90-Day Outcome" },
      { key: "outcome_90day_date", label: "90-Day Date", format: fmtDate },
      { key: "outcome_180day", label: "180-Day Outcome" },
      { key: "outcome_180day_date", label: "180-Day Date", format: fmtDate },
      { key: "employed_ftpt", label: "Employed FT/PT" },
      { key: "dea_start_date", label: "DEA Start Date", format: fmtDate },
      { key: "eda_completion_date", label: "EDA Completion Date", format: fmtDate },
    ],
  },
  {
    label: "CRT Flags",
    fields: [
      { key: "service_navigation_support", label: "Service Navigation Support", format: (v) => v ? "Yes" : "No" },
      { key: "work_exposure", label: "Work Exposure", format: (v) => v ? "Yes" : "No" },
      { key: "wage_subsidy", label: "Wage Subsidy", format: (v) => v ? "Yes" : "No" },
      { key: "ceis_dea", label: "CEIS (DEA)", format: (v) => v ? "Yes" : "No" },
    ],
  },
  {
    label: "File Closure",
    fields: [
      { key: "file_status", label: "File Status", format: (v) => v === "closed" ? "Closed" : "Open" },
      { key: "close_reason", label: "Close Reason", format: (v, c) => v === "other" ? c.close_reason_other || "Other" : v?.replace(/_/g, " ") },
      { key: "close_date", label: "Closed Date", format: fmtDate },
      { key: "close_notes", label: "Closure Notes" },
    ],
  },
  {
    label: "Notes",
    fields: [
      { key: "notes", label: "General Notes" },
    ],
  },
];

export default function TransitionClientDetailsModal({ client, onClose }) {
  if (!client) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between z-10">
          <div>
            <h3 className="font-semibold text-base" style={{ color: "hsl(231,64%,20%)" }}>
              {client.first_name} {client.last_name}
            </h3>
            <p className="text-xs text-slate-500">Transition Client Details</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {FIELD_GROUPS.map((group) => {
            const hasData = group.fields.some(f => {
              const val = client[f.key];
              return val !== null && val !== undefined && val !== "" && val !== false;
            });
            if (!hasData) return null;
            return (
              <div key={group.label}>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">{group.label}</h4>
                <div className="grid sm:grid-cols-2 gap-x-4 gap-y-2 bg-slate-50 rounded-lg p-3">
                  {group.fields.map(f => {
                    const val = client[f.key];
                    const display = f.format ? f.format(val, client) : (val ?? "—");
                    if (display === "—" || display === "" || display === null) return null;
                    return (
                      <div key={f.key}>
                        <span className="text-xs text-slate-400 block">{f.label}</span>
                        {f.badge && val ? (
                          <span className={cn("inline-block text-xs px-2 py-0.5 rounded font-medium border", f.badge(val))}>{String(display)}</span>
                        ) : (
                          <span className="text-sm text-slate-700 whitespace-pre-wrap">{String(display)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Milestones */}
          {client.milestones?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Milestones</h4>
              <div className="space-y-1.5">
                {client.milestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md p-2">
                    <span className={`w-2 h-2 rounded-full ${m.status === "completed" ? "bg-emerald-500" : m.status === "missed" ? "bg-red-500" : "bg-amber-400"}`} />
                    <span className="text-sm text-slate-700 flex-1">{m.title || "Untitled"}</span>
                    {m.notes && <span className="text-xs text-slate-400">{m.notes}</span>}
                    <span className="text-xs text-slate-400">{fmtDate(m.date)}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-slate-200 text-slate-600">{m.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-3 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}