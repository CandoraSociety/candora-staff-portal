import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, AlertTriangle, Users, Building2 } from "lucide-react";
import { format } from "date-fns";
import ClientListControls, { applyFiltersAndSort } from "@/components/lists/ClientListControls";
import { clientRowColor } from "@/lib/clientRowColor";
import PathwaysStaffManager from "@/components/pathways/PathwaysStaffManager";
import CollapsibleClientSections from "@/components/pathways/CollapsibleClientSections";
import ServiceNavigationSections from "@/components/pathways/ServiceNavigationSections";
import PlacementSections from "@/components/pathways/PlacementSections";
import EmployersListTab from "@/components/pathways/EmployersListTab";
import CrossRefTab from "@/components/pathways/CrossRefTab";
import MasterListFlatTable from "@/components/pathways/MasterListFlatTable";
import { Switch } from "@/components/ui/switch";
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
  const [placementSubTab, setPlacementSubTab] = useState("all");
  const [exposureView, setExposureView] = useState("placements");
  const [reassignClient, setReassignClient] = useState(null);
  const [staff, setStaff] = useState([]);
  const [reassigning, setReassigning] = useState(false);
  const [canManageStaff, setCanManageStaff] = useState(false);
  const [showStaffManager, setShowStaffManager] = useState(false);
  const [switchClient, setSwitchClient] = useState(null);
  const [viewAll, setViewAll] = useState(false);
  const [crossRefCounts, setCrossRefCounts] = useState({ all: 0, matched: 0, unmatched: 0 });

  useEffect(() => {
    Promise.all([
      base44.entities.Client.list("-intake_date", 1000),
      base44.entities.PathwaysStaff.filter({ is_active: true }),
    ]).then(async ([data, staffList]) => {
      setClients(data);
      const names = [...new Set(data.map(c => c.assigned_worker_name).filter(Boolean))].sort();
      setWorkers(names);
      setStaff(staffList);
      try {
        const me = await base44.auth.me();
        const myEmp = await base44.entities.Employee.filter({ email: me.email }).catch(() => []);
        setCanManageStaff(me.role === "admin" || ["manager", "director", "executive_director"].includes(myEmp[0]?.org_tier));
      } catch {}
      setLoading(false);
    });
  }, []);

  const assignedClients = clients.filter(c => c.assigned_worker);
  const activeClients = assignedClients.filter(c => !c.file_closed);
  const activeDeaWdCount = activeClients.filter(c => c.service_type === 'direct_to_employment' || c.service_type === 'pathways').length;
  const extraActiveClients = clients.filter(c =>
    !c.assigned_worker && !c.file_closed &&
    (c.service_type === 'casual' || c.service_type === 'not_eligible')
  );
  const sourceList = [...activeClients, ...extraActiveClients];
  const displayed = applyFiltersAndSort(sourceList, search, filters, sortKey);

  const internalTrainingClients = activeClients.filter(c => c.internal_placement && c.internal_placement !== "none");
  const workExposureClients = activeClients.filter(c => c.exposure_course || c.paid_external_placement);
  // Service Navigation WD clients — a cross-cutting view of clients that have an assigned
  // Service Navigator. These are already included in the DEA/WD counts above (they also have
  // an assigned Career Counsellor), so they do NOT add to the totals.
  const snClients = displayed.filter(c => (c.assigned_service_navigator || c.assigned_service_navigator_name) && c.service_type === 'pathways');

  const renderClientTable = (rows, program, subSection) => (
    <ClientSubSectionTable
      rows={rows}
      program={program}
      subSection={subSection}
      onRowClick={(c) => navigate(`/pathways/client/${c.id}`)}
      onSwitchClient={setSwitchClient}
      showCounsellor={program !== 'casual' && program !== 'rejected'}
      onReassign={setReassignClient}
    />
  );

  // Dedicated renderer for the Service Navigation section — adds a Service Navigator
  // column (before Career Counsellor) showing each client's assigned Service Navigator.
  const renderSnTable = (rows, program, subSection) => (
    <ClientSubSectionTable
      rows={rows}
      program={program}
      subSection={subSection}
      onRowClick={(c) => navigate(`/pathways/client/${c.id}`)}
      onSwitchClient={setSwitchClient}
      showCounsellor={program !== 'casual' && program !== 'rejected'}
      showServiceNavigator
      onReassign={setReassignClient}
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
            {displayed.length} shown · {activeClients.length} active · {clients.filter(c => !c.assigned_worker).length} unassigned in intake
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

      {/* Content */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-2 mb-4 border-b border-slate-200">
          {!viewAll ? (
            <div className="flex gap-1">
              {[
                { id: "all", label: "All Active", count: activeDeaWdCount },
                { id: "internal_training", label: "Internal Training", count: internalTrainingClients.length },
                { id: "work_exposure", label: "Work Exposure", count: workExposureClients.length },
                { id: "cross_ref", label: "Cross-Ref", count: crossRefCounts.all },
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
                  {sub.count != null && (
                    <span
                      className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                      style={{ background: "rgba(43,45,232,0.12)", color: "#2b2de8" }}
                    >
                      {sub.count}
                    </span>
                  )}
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
        {viewAll ? (
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
        ) : placementSubTab === "work_exposure" ? (
          <>
            <div className="flex gap-1 mb-4">
              <button
                onClick={() => setExposureView("placements")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${exposureView === "placements" ? "bg-slate-200 text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
              >Placements</button>
              <button
                onClick={() => setExposureView("employers")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1 ${exposureView === "employers" ? "bg-slate-200 text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
              ><Building2 className="w-3.5 h-3.5" /> Employers</button>
            </div>
            {exposureView === "placements"
              ? <PlacementSections clients={displayed} type="work_exposure" />
              : <EmployersListTab />}
          </>
        ) : placementSubTab === "internal_training" ? (
          <PlacementSections clients={displayed} type="internal" />
        ) : placementSubTab === "cross_ref" ? (
          <CrossRefTab activeClients={sourceList} onCountsChange={setCrossRefCounts} />
        ) : (
          <>
            <ClientListControls
              search={search} onSearch={setSearch}
              filters={filters} onFilters={setFilters}
              sortKey={sortKey} onSort={setSortKey}
              workers={workers}
            />
            <CollapsibleClientSections clients={displayed} renderTable={renderClientTable} alwaysShowExtras />
            {snClients.length > 0 && (
              <>
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-slate-300" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Service Navigation</span>
                  <div className="flex-1 h-px bg-slate-300" />
                </div>
                <ServiceNavigationSections clients={snClients} renderTable={renderSnTable} />
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
                {staff.filter(s => s.email !== reassignClient.assigned_worker && (s.role === 'career_counsellor' || s.secondary_role === 'career_counsellor' || s.tertiary_role === 'career_counsellor')).sort((a, b) => (a.name || "").localeCompare(b.name || "")).map(s => (
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