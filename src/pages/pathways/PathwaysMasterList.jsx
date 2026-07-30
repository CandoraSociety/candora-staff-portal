import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, UserCheck, AlertTriangle, Users } from "lucide-react";
import { format } from "date-fns";
import ClientListControls, { applyFiltersAndSort } from "@/components/lists/ClientListControls";
import { clientRowColor } from "@/lib/clientRowColor";
import TransitionClientsTab from "@/components/pathways/TransitionClientsTab";
import TransitionClientDetailsModal from "@/components/pathways/TransitionClientDetailsModal";
import PathwaysStaffManager from "@/components/pathways/PathwaysStaffManager";
import CollapsibleClientSections from "@/components/pathways/CollapsibleClientSections";
import PlacementSections from "@/components/pathways/PlacementSections";
import MasterListFlatTable from "@/components/pathways/MasterListFlatTable";
import { Switch } from "@/components/ui/switch";
import SwitchDogEar from "@/components/pathways/SwitchDogEar";
import SwitchToWDDialog from "@/components/pathways/SwitchToWDDialog";
import ClientSubSectionTable from "@/components/pathways/ClientSubSectionTable";

const EMPTY_FILTERS = {
  service_type: [], program_status: [], employment_status: [],
  clb_level: [], assigned_worker: [], age_min: "", age_max: "",
  duration_min: "", duration_max: "", referral_source: [], residency_status: [],
  followup_90day_status: [],
  intake_month_from: "", intake_month_to: "", start_month_from: "", start_month_to: "",
  completion_month_from: "", completion_month_to: "",
};

const SERVICE_LABELS = {
  direct_to_employment: "DEA",
  pathways: "WD",
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
  const [placementSubTab, setPlacementSubTab] = useState("all");
  const [reassignClient, setReassignClient] = useState(null);
  const [staff, setStaff] = useState([]);
  const [reassigning, setReassigning] = useState(false);
  const [canManageStaff, setCanManageStaff] = useState(false);
  const [showStaffManager, setShowStaffManager] = useState(false);
  const [transitionCount, setTransitionCount] = useState(0);
  const [closedTransitionClients, setClosedTransitionClients] = useState([]);
  const [detailsClient, setDetailsClient] = useState(null);
  const [switchClient, setSwitchClient] = useState(null);
  const [viewAll, setViewAll] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Client.list("-intake_date", 1000),
      base44.entities.PathwaysStaff.filter({ is_active: true }),
      base44.entities.TransitionClient.list().catch(() => []),
    ]).then(async ([data, staffList, transitionClients]) => {
      setClients(data);
      const names = [...new Set(data.map(c => c.assigned_worker_name).filter(Boolean))].sort();
      setWorkers(names);
      setStaff(staffList);
      setTransitionCount(transitionClients.length);
      try {
        const me = await base44.auth.me();
        const myEmp = await base44.entities.Employee.filter({ email: me.email }).catch(() => []);
        setCanManageStaff(me.role === "admin" || ["manager", "director", "executive_director"].includes(myEmp[0]?.org_tier));
      } catch {}
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
  // Count only DEA + WD active clients for the "All Active" tab badge
  const activeDeaWdCount = activeClients.filter(c => c.service_type === 'direct_to_employment' || c.service_type === 'pathways').length;
  const closedClients = [...assignedClients.filter(c => c.file_closed), ...closedTransitionClients];
  // Include unassigned casual + rejected clients so they surface in their own sections
  const extraActiveClients = clients.filter(c =>
    !c.assigned_worker && !c.file_closed &&
    (c.service_type === 'casual' || c.service_type === 'not_eligible')
  );
  const sourceList = activeTab === "active" ? [...activeClients, ...extraActiveClients] : closedClients;
  const displayed = applyFiltersAndSort(sourceList, search, filters, sortKey);

  const internalTrainingClients = activeClients.filter(c => c.internal_placement && c.internal_placement !== "none");
  const workExposureClients = activeClients.filter(c => c.exposure_course || c.paid_external_placement);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setPlacementSubTab("all");
  };

  const renderClientTable = (rows, program, subSection) => (
    <ClientSubSectionTable
      rows={rows}
      program={program}
      subSection={subSection}
      onRowClick={(c) => c._isTransition ? setDetailsClient(c) : navigate(`/pathways/client/${c.id}`)}
      onSwitchClient={setSwitchClient}
      showCounsellor={program !== 'casual' && program !== 'rejected'}
      onReassign={setReassignClient}
      showClosedColumns={activeTab === "closed"}
      showTransitionBadge
    />
  );

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
          {canManageStaff && (
            <Button
              size="sm"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              onClick={() => setShowStaffManager(true)}
            >
              <Users className="w-4 h-4 mr-1" /> Manage Staff
            </Button>
          )}
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
          onClick={() => switchTab("active")}
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
          onClick={() => switchTab("closed")}
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
          onClick={() => switchTab("transition")}
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
            {activeTab === "active" && (
              <div className="flex items-center justify-between gap-2 mb-4 border-b border-slate-200">
                {!viewAll ? (
                  <div className="flex gap-1">
                    {[
                      { id: "all", label: "All Active", count: activeDeaWdCount },
                      { id: "internal_training", label: "Internal Training", count: internalTrainingClients.length },
                      { id: "work_exposure", label: "Work Exposure", count: workExposureClients.length },
                    ].map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => setPlacementSubTab(sub.id)}
                        className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${
                          placementSubTab === sub.id
                            ? "font-semibold"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                        style={placementSubTab === sub.id ? { color: "hsl(231,64%,20%)", borderColor: "#2b2de8" } : {}}
                      >
                        {sub.label}
                        <span
                          className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                          style={{ background: "rgba(43,45,232,0.12)", color: "#2b2de8" }}
                        >
                          {sub.count}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm font-semibold py-1.5" style={{ color: "hsl(231,64%,20%)" }}>
                    View All — {displayed.length} client{displayed.length === 1 ? "" : "s"}
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer text-sm select-none text-slate-600">
                  View All
                  <Switch checked={viewAll} onCheckedChange={setViewAll} />
                </label>
              </div>
            )}
            {activeTab === "active" && viewAll ? (
              <>
                <ClientListControls
                  search={search} onSearch={setSearch}
                  filters={filters} onFilters={setFilters}
                  sortKey={sortKey} onSort={setSortKey}
                  workers={workers}
                />
                <MasterListFlatTable
                  rows={displayed}
                  onRowClick={(c) => navigate(`/pathways/client/${c.id}`)}
                  onSwitchClient={setSwitchClient}
                  onReassign={setReassignClient}
                />
              </>
            ) : activeTab === "active" && placementSubTab !== "all" ? (
              <PlacementSections
                clients={displayed}
                type={placementSubTab === "internal_training" ? "internal" : "work_exposure"}
              />
            ) : (
              <>
            <ClientListControls
              search={search} onSearch={setSearch}
              filters={filters} onFilters={setFilters}
              sortKey={sortKey} onSort={setSortKey}
              workers={workers}
            />

            <CollapsibleClientSections clients={displayed} renderTable={renderClientTable} alwaysShowExtras />
              </>
            )}
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
                <h3 className="text-lg font-bold" style={{ color: "hsl(231,64%,20%)" }}>Edit Career Counsellor</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Change the assigned counsellor for <span className="font-semibold text-slate-800">{reassignClient.first_name} {reassignClient.last_name}</span>
                  {reassignClient.assigned_worker_name
                    ? <> from <span className="font-semibold text-slate-800">{reassignClient.assigned_worker_name}</span>.</>
                    : <> (currently unassigned).</>
                  }
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Career Counsellor</label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={reassignClient._newWorker || ""}
                onChange={e => setReassignClient({ ...reassignClient, _newWorker: e.target.value })}
              >
                <option value="">Select a counsellor...</option>
                {staff.filter(s => s.email !== reassignClient.assigned_worker).sort((a, b) => (a.name || "").localeCompare(b.name || "")).map(s => (
                  <option key={s.id} value={s.email + "|" + (s.name || s.email)}>
                    {s.name || s.email}
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
                    const updated = await base44.entities.Client.update(reassignClient.id, {
                      assigned_worker: toEmail,
                      assigned_worker_name: toName,
                    });
                    setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
                  } catch {}
                  setReassigning(false);
                  setReassignClient(null);
                }}
                disabled={!reassignClient._newWorker || reassigning}
              >
                {reassigning ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailsClient && (
        <TransitionClientDetailsModal client={detailsClient} onClose={() => setDetailsClient(null)} />
      )}

      {showStaffManager && (
        <PathwaysStaffManager
          onClose={() => setShowStaffManager(false)}
          onUpdated={async () => {
            const updated = await base44.entities.PathwaysStaff.filter({ is_active: true });
            setStaff(updated);
          }}
        />
      )}

      {switchClient && (
        <SwitchToWDDialog
          client={switchClient}
          onClose={() => setSwitchClient(null)}
          onSwitched={(updated) => setClients(prev => prev.map(c => c.id === updated.id ? updated : c))}
        />
      )}
    </div>
  );
}