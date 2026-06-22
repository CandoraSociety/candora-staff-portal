import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, UserCheck, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import ClientListControls, { applyFiltersAndSort } from "@/components/lists/ClientListControls";
import { clientRowColor } from "@/lib/clientRowColor";
import TransitionClientsTab from "@/components/pathways/TransitionClientsTab";

const EMPTY_FILTERS = {
  service_type: "", program_status: "", employment_status: "",
  clb_level: "", assigned_worker: "", age_min: "", age_max: "",
  duration_min: "", duration_max: "", referral_source: "", residency_status: "",
  followup_90day_status: "",
};

const SERVICE_LABELS = {
  direct_to_employment: "DEA",
  pathways: "Pathways",
  casual: "Casual",
  external_referral: "Ext. Referral",
  internal_referral: "Int. Referral",
  not_eligible: "Not Eligible",
};

const PROGRAM_STATUS_COLORS = {
  in_progress: "bg-blue-100 text-blue-700",
  complete: "bg-green-100 text-green-700",
  incomplete: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-700",
};

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

function programStatusLabel(c) {
  if (c.program_status === "complete" && !c.followup_90day_status) return "Complete (Follow-Up Period)";
  if (c.program_status === "in_progress") return "In Progress";
  if (c.program_status === "complete") return "Complete";
  if (c.program_status === "incomplete") return "Incomplete";
  if (c.program_status === "cancelled") return "Cancelled";
  return c.program_status?.replace("_", " ") || null;
}

const fmtDate = (d) => {
  if (!d) return "—";
  try { return format(new Date(d), "MMM d, yy"); } catch { return "—"; }
};

export default function PathwaysMasterList() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState("intake_date_desc");
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState([]);
  const [activeTab, setActiveTab] = useState("active");
  const [reassignClient, setReassignClient] = useState(null);
  const [users, setUsers] = useState([]);
  const [reassigning, setReassigning] = useState(false);
  const [transitionCount, setTransitionCount] = useState(0);
  const [closedTransitionClients, setClosedTransitionClients] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.Client.list("-intake_date", 1000),
      base44.entities.User.list(),
      base44.entities.TransitionClient.list().catch(() => []),
    ]).then(([data, userList, transitionClients]) => {
      setClients(data);
      const names = [...new Set(data.map(c => c.assigned_worker_name).filter(Boolean))].sort();
      setWorkers(names);
      setUsers(userList);
      setTransitionCount(transitionClients.length);
      // Normalize closed transition clients to be compatible with the closed files table
      const closedTrans = transitionClients
        .filter(tc => tc.file_status === "closed")
        .map(tc => ({
          ...tc,
          _isTransition: true,
          intake_date: null,
          service_type: tc.service_element || (tc.program === "CEIS" ? "direct_to_employment" : "pathways"),
          service_start_date: tc.service_start_date,
          program_stream_switches: [],
          program_status: tc.service_outcome === "Complete" ? "complete" : tc.service_outcome === "Cancelled" ? "cancelled" : null,
          completion_date: tc.eda_completion_date,
          post_completion_employment_status: tc.employed_ftpt,
          post_completion_employment_date: null,
          followup_90day_date: tc.outcome_90day_date,
          followup_90day_status: tc.outcome_90day,
          service_navigation_supports: tc.service_navigation_support,
          assigned_worker_name: tc.new_counsellor,
          assigned_worker: null,
          file_closed: true,
          closed_reason: tc.close_reason,
          closed_date: tc.close_date,
        }));
      setClosedTransitionClients(closedTrans);
      setLoading(false);
    });
  }, []);

  const assignedClients = clients.filter(c => c.assigned_worker);
  const activeClients = assignedClients.filter(c => !c.file_closed);
  const closedClients = [...assignedClients.filter(c => c.file_closed), ...closedTransitionClients];
  const sourceList = activeTab === "active" ? activeClients : closedClients;
  const displayed = applyFiltersAndSort(sourceList, search, filters, sortKey);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 rounded-full animate-spin candora-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navy header */}
      <div
        className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        style={{ background: "hsl(231,64%,20%)" }}
      >
        <div>
          <h1 className="text-xl font-bold text-white">Master Client List</h1>
          <p className="text-sm text-white/60">
            {displayed.length} shown · {activeClients.length} active · {closedClients.length} closed · {clients.filter(c => !c.assigned_worker).length} unassigned in intake
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate("/pathways/reports")}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
          >
            Reports
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => base44.auth.logout()}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-slate-200 px-6 flex gap-1 pt-1">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "active"
              ? "font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
          style={activeTab === "active" ? { color: "hsl(231,64%,20%)", borderColor: "hsl(42,100%,54%)" } : {}}
        >
          Active Files
          <span
            className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
            style={{ background: "hsl(44,100%,88%)", color: "hsl(231,64%,20%)" }}
          >
            {activeClients.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("closed")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "closed"
              ? "border-red-500 text-red-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Closed Files
          <span className="ml-2 bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">
            {closedClients.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("transition")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "transition"
              ? "font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
          style={activeTab === "transition" ? { color: "hsl(231,64%,20%)", borderColor: "#2b2de8" } : {}}
        >
          Transition Clients
          <span
            className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
            style={{ background: "rgba(43,45,232,0.15)", color: "#2b2de8" }}
          >
            {transitionCount}
          </span>
        </button>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {activeTab === "transition" ? (
          <TransitionClientsTab />
        ) : (
          <>
            <ClientListControls
              search={search} onSearch={setSearch}
              filters={filters} onFilters={setFilters}
              sortKey={sortKey} onSort={setSortKey}
              workers={workers}
            />

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200" style={{ background: "hsl(231,64%,20%)" }}>
                    <tr>
                      <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Name</th>
                      <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">HSID#</th>
                      <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Intake Date</th>
                      <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Service Element</th>
                      <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Program Start</th>
                      <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Switches</th>
                      <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Program Status</th>
                      <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Completion</th>
                      <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Employment Status</th>
                      <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Employment Start Date</th>
                      <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">90-Day Date</th>
                      <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">90-Day Status</th>
                      <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Svc Nav</th>
                      <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Career Counsellor</th>
                      {activeTab === "closed" && (
                        <>
                          <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Close Reason</th>
                          <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Closed Date</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayed.map(c => (
                      <tr
                        key={c.id}
                        onClick={() => navigate(`/pathways/client/${c.id}`)}
                        className={`group transition-colors cursor-pointer hover:brightness-95 ${clientRowColor(c)}`}
                      >
                        <td className="px-3 py-2.5 whitespace-nowrap font-semibold" style={{ color: "hsl(231,64%,28%)" }}>
                          {c.first_name} {c.last_name}
                          {c._isTransition && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(43,45,232,0.15)", color: "#2b2de8" }}>
                              Transition
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{c.compass_hsid || "—"}</td>
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{fmtDate(c.intake_date)}</td>
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{SERVICE_LABELS[c.service_type] || "—"}</td>
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{fmtDate(c.service_start_date)}</td>

                        {/* Switches */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {c.program_stream_switches?.length > 0 ? (
                            <div className="flex flex-col gap-0.5">
                              {c.program_stream_switches.map((sw, i) => (
                                <div key={i} className="flex items-center gap-1">
                                  <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
                                    {SERVICE_LABELS[sw.from_stream] || sw.from_stream || "?"}
                                  </span>
                                  <span className="text-slate-400 text-xs">→</span>
                                  <span className="text-xs bg-purple-100 text-purple-800 border border-purple-300 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
                                    {SERVICE_LABELS[sw.to_stream] || sw.to_stream || "?"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : "—"}
                        </td>

                        {/* Program Status */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {c.program_status ? (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PROGRAM_STATUS_COLORS[c.program_status] || "bg-slate-100 text-slate-600"}`}>
                              {programStatusLabel(c)}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                              Assessments / Action Plan Incomplete
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{fmtDate(c.completion_date)}</td>
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap font-mono text-xs">{c.post_completion_employment_status || "—"}</td>
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{fmtDate(c.post_completion_employment_date)}</td>
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{fmtDate(c.followup_90day_date)}</td>
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap font-mono text-xs">{c.followup_90day_status || "—"}</td>
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{c.service_navigation_supports ? "Yes" : "—"}</td>
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>{c.assigned_worker_name || "—"}</span>
                            {c.assigned_worker && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setReassignClient(c); }}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-blue-100 transition-all"
                                title="Reassign to a different career counsellor"
                              >
                                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                              </button>
                            )}
                          </div>
                        </td>

                        {activeTab === "closed" && (
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
                    {displayed.length === 0 && (
                      <tr>
                        <td colSpan={16} className="text-center py-10 text-slate-400">
                          No clients match your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Reassign Confirmation Dialog */}
      {reassignClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setReassignClient(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: "hsl(231,64%,20%)" }}>Reassign Client?</h3>
                <p className="text-sm text-slate-600 mt-1">
                  You are about to reassign <span className="font-semibold text-slate-800">{reassignClient.first_name} {reassignClient.last_name}</span>
                  {" "}from <span className="font-semibold text-slate-800">{reassignClient.assigned_worker_name || "Unassigned"}</span> to a different career counsellor.
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  The new counsellor will be notified and must <strong>accept</strong> the transfer before the client appears in their list.
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">New Career Counsellor</label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={reassignClient._newWorker || ""}
                onChange={e => setReassignClient({ ...reassignClient, _newWorker: e.target.value })}
              >
                <option value="">Select a counsellor...</option>
                {users.filter(u => u.email !== reassignClient.assigned_worker).sort((a, b) => (a.full_name || "").localeCompare(b.full_name || "")).map(u => (
                  <option key={u.id} value={u.email + "|" + (u.full_name || u.email)}>
                    {u.full_name || u.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                onClick={() => setReassignClient(null)}
                disabled={reassigning}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
                style={{ background: "hsl(231,64%,20%)" }}
                onClick={async () => {
                  if (!reassignClient._newWorker || reassigning) return;
                  setReassigning(true);
                  const [toEmail, toName] = reassignClient._newWorker.split("|");
                  try {
                    await base44.entities.ClientTransfer.create({
                      client_id: reassignClient.id,
                      client_name: `${reassignClient.first_name} ${reassignClient.last_name}`,
                      from_worker: reassignClient.assigned_worker || "",
                      from_worker_name: reassignClient.assigned_worker_name || "",
                      to_worker: toEmail,
                      to_worker_name: toName,
                      status: "pending",
                    });
                  } catch {}
                  setReassigning(false);
                  setReassignClient(null);
                }}
                disabled={!reassignClient._newWorker || reassigning}
              >
                {reassigning ? "Sending..." : "Confirm Reassign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}