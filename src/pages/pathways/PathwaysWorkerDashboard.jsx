import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { LogOut, Users, Bell, Database, CalendarClock, ArrowRightLeft, Check, X, Building2, ShoppingCart, ExternalLink } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format, addDays, differenceInDays } from "date-fns";
import ClientListControls, { applyFiltersAndSort } from "@/components/lists/ClientListControls";
import { clientRowColor } from "@/lib/clientRowColor";
import CompassTaskList from "@/components/compass/CompassTaskList";
import CollapsibleClientSections from "@/components/pathways/CollapsibleClientSections";
import CollapsibleSection from "@/components/pathways/CollapsibleSection";
import PlacementSections from "@/components/pathways/PlacementSections";
import InternalTrainingClientsSection from "@/components/pathways/InternalTrainingClientsSection";
import EmployersListTab from "@/components/pathways/EmployersListTab";
import SwitchDogEar from "@/components/pathways/SwitchDogEar";
import SwitchToWDDialog from "@/components/pathways/SwitchToWDDialog";
import ClientSubSectionTable from "@/components/pathways/ClientSubSectionTable";
import RecentlyViewedClients, { recordRecentClient } from "@/components/pathways/RecentlyViewedClients";
import PurchaseRequestsTab from "@/components/pathways/PurchaseRequestsTab";
import MyPendingPurchaseRequests from "@/components/pathways/MyPendingPurchaseRequests";

const COMPASS_URL = 'https://csscm.alberta.ca/home';

const EMPTY_FILTERS = {
  service_type: [], program_status: [], employment_status: [],
  clb_level: [], age_min: "", age_max: "",
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

const BARRIER_STATUS_COLORS = {
  unresolved: "text-red-600",
  in_progress: "text-amber-600",
  resolved: "text-green-600",
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

export default function PathwaysWorkerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [compassTasks, setCompassTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState("intake_date_desc");
  const [activeTab, setActiveTab] = useState("clients");
  const [transfers, setTransfers] = useState([]);
  const [placementSubTab, setPlacementSubTab] = useState("all");
  const [exposureView, setExposureView] = useState("placements");
  const [exposurePlacements, setExposurePlacements] = useState([]);
  const [switchClient, setSwitchClient] = useState(null);
  const [isCareerCounsellor, setIsCareerCounsellor] = useState(false);
  const [isServiceNavigator, setIsServiceNavigator] = useState(false);
  const [isManagerOrAdmin, setIsManagerOrAdmin] = useState(false);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [ccClients, setCcClients] = useState([]);
  const [snClients, setSnClients] = useState([]);
  const [isInternalPlacementCoordinator, setIsInternalPlacementCoordinator] = useState(false);
  const [isPureIPC, setIsPureIPC] = useState(false);
  const [itcClients, setItcClients] = useState([]);

  const loadCompassTasks = async (workerEmail, workerName) => {
    const allTasks = await base44.entities.CompassTask.list("-created_date", 500);
    const email = (workerEmail || "").toLowerCase();
    const name = (workerName || "").toLowerCase();
    setCompassTasks(allTasks.filter(t =>
      (t.assigned_worker && t.assigned_worker.toLowerCase() === email) ||
      (t.assigned_worker_name && t.assigned_worker_name.toLowerCase() === name)
    ));
  };

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const myEmail = (me.email || "").toLowerCase();
      const myName = (me.full_name || "").toLowerCase();
      const isDawnInit = myEmail === "dawn.williston@candorasociety.com";

      // Determine the user's Pathways roles (primary, secondary, tertiary)
      const staffRecords = await base44.entities.PathwaysStaff.filter({ is_active: true }, "name", 200);
      const myStaff = staffRecords.find(s => (s.email || "").toLowerCase() === myEmail);
      const roles = myStaff ? [myStaff.role, myStaff.secondary_role, myStaff.tertiary_role].filter(Boolean) : [];
      const userIsCC = roles.includes("career_counsellor");
      const userIsSN = roles.includes("service_navigator") || isDawnInit;
      const userIsManagerOrAdmin = myStaff ? (myStaff.role === "manager" || myStaff.role === "admin") : false;
      const userIsIPC = roles.includes("internal_placement_coordinator");
      const userIsPureIPC = userIsIPC && !userIsCC && !userIsSN && !userIsManagerOrAdmin;
      setIsCareerCounsellor(userIsCC);
      setIsServiceNavigator(userIsSN);
      setIsManagerOrAdmin(userIsManagerOrAdmin);
      setIsInternalPlacementCoordinator(userIsIPC);
      setIsPureIPC(userIsPureIPC);

      const allClients = await base44.entities.Client.list("-created_date", 1000);
      const matchesCc = (c) =>
        (c.assigned_worker && c.assigned_worker.toLowerCase() === myEmail) ||
        (c.assigned_worker_name && c.assigned_worker_name.toLowerCase() === myName);
      const matchesSn = (c) =>
        (c.assigned_service_navigator && c.assigned_service_navigator.toLowerCase() === myEmail) ||
        (c.assigned_service_navigator_name && c.assigned_service_navigator_name.toLowerCase() === myName);
      const cc = allClients.filter(matchesCc);
      const sn = isDawnInit
        ? allClients.filter(c => (c.barriers_addressed || matchesSn(c)))
        : allClients.filter(matchesSn);
      setCcClients(cc);
      setSnClients(sn);
      // Union for alerts / placements / compass (clients in both lists appear once)
      setClients([...new Map([...cc, ...sn].map(c => [c.id, c])).values()]);

      const myClientIds = new Set([...cc, ...sn].map(c => c.id));
      const allPlacements = await base44.entities.WorkExposurePlacement.list("-created_date", 500);
      setExposurePlacements(allPlacements.filter(p => myClientIds.has(p.client_id)));

      // Internal Training clients — Internal Placement Coordinators see their own;
      // Managers see all (program oversight).
      if (userIsIPC || userIsManagerOrAdmin) {
        try {
          const allTraining = await base44.entities.InternalTraining.list("-created_date", 1000);
          const myTraining = userIsManagerOrAdmin
            ? allTraining
            : allTraining.filter(t =>
                (t.assigned_worker && t.assigned_worker.toLowerCase() === myEmail) ||
                (t.assigned_worker_name && t.assigned_worker_name.toLowerCase() === myName)
              );
          const trainingClientIds = new Set(myTraining.map(t => t.client_id).filter(Boolean));
          setItcClients(allClients.filter(c => trainingClientIds.has(c.id)));
        } catch { setItcClients([]); }
      }
      try {
        const allRequests = await base44.entities.PurchaseRequest.list("-requested_date", 500);
        setPurchaseRequests(allRequests || []);
      } catch { setPurchaseRequests([]); }
      await loadCompassTasks(me.email, me.full_name);
      const pendingTransfers = await base44.entities.ClientTransfer.filter({ status: "pending" });
      setTransfers(pendingTransfers.filter(t => (t.to_worker || "").toLowerCase() === myEmail));
      setLoading(false);
    };
    init();
  }, []);

  // Realtime sync of purchase requests across users
  useEffect(() => {
    const unsubscribe = base44.entities.PurchaseRequest.subscribe((event) => {
      setPurchaseRequests(prev => {
        const list = prev || [];
        if (event.type === 'create') return [event.data, ...list];
        if (event.type === 'update') return list.map(r => (r.id === event.data.id ? event.data : r));
        if (event.type === 'delete') return list.filter(r => r.id !== event.data.id);
        return list;
      });
    });
    return unsubscribe;
  }, []);

  const isDawn = (user?.email || "").toLowerCase() === "dawn.williston@candorasociety.com";
  const deaWdTotal = ccClients.filter(c => c.service_type === "direct_to_employment" || c.service_type === "pathways").length;
  const displayed = applyFiltersAndSort(ccClients, search, filters, sortKey).filter(c => c.service_type === "direct_to_employment" || c.service_type === "pathways");
  const snWdTotal = snClients.filter(c => c.service_type === "pathways").length;
  const snDisplayed = applyFiltersAndSort(snClients, search, filters, sortKey).filter(c => c.service_type === "pathways");
  const pendingCompassCount = compassTasks.filter(t => t.status === "pending").length;
  const pendingPurchaseCount = purchaseRequests.filter(r => r.status === "pending" && !r.received_by).length;

  // DEA Closing Alert
  const deaClosingClients = clients.filter(c => {
    if (c.service_type !== "direct_to_employment") return false;
    if (c.file_closed) return false;
    // Only warn for active DEA programs — completed/cancelled/incomplete clients are already done
    if (c.program_status === "complete" || c.program_status === "cancelled" || c.program_status === "incomplete") return false;
    const endDate = c.completion_date
      ? new Date(c.completion_date)
      : c.service_start_date
      ? addDays(new Date(c.service_start_date), 14)
      : null;
    if (!endDate) return false;
    return differenceInDays(endDate, new Date()) <= 3;
  });

  // 90-Day Follow-Up Alert
  const upcomingFollowups = clients.filter(c => {
    if (c.followup_90day_status) return false;
    // 90-day follow-up only applies to completed clients — cancelled/incomplete didn't finish the program
    if (c.program_status === "cancelled" || c.program_status === "incomplete") return false;
    const followupDate = c.followup_90day_date
      ? new Date(c.followup_90day_date)
      : c.completion_date
        ? addDays(new Date(c.completion_date), 90)
        : null;
    if (!followupDate) return false;
    return differenceInDays(followupDate, new Date()) <= 14;
  }).sort((a, b) => {
    const dateA = a.followup_90day_date || (a.completion_date ? format(addDays(new Date(a.completion_date), 90), "yyyy-MM-dd") : "");
    const dateB = b.followup_90day_date || (b.completion_date ? format(addDays(new Date(b.completion_date), 90), "yyyy-MM-dd") : "");
    return dateA.localeCompare(dateB);
  });

  const renderClientTable = (rows, program, subSection) => (
    <ClientSubSectionTable
      rows={rows}
      program={program}
      subSection={subSection}
      onRowClick={(c) => { recordRecentClient(c); navigate(`/pathways/client/${c.id}`); }}
      onSwitchClient={setSwitchClient}
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
      {/* Header */}
      <header
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: "hsl(231,64%,20%)" }}
      >
        <div>
          <h1 className="text-xl font-bold text-white">
            {isPureIPC
              ? "Internal Training Dashboard"
              : isServiceNavigator && !isCareerCounsellor
                ? "Service Navigation Dashboard"
                : isDawn
                  ? "Service Navigator Dashboard"
                  : "My Clients"}
          </h1>
          <p className="text-sm text-white/60">Welcome, {user?.full_name}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => base44.auth.logout()}
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Recently viewed clients */}
        <RecentlyViewedClients />

        {/* My pending purchase requests (career counsellors) */}
        {isCareerCounsellor && (
          <MyPendingPurchaseRequests requests={purchaseRequests} currentUser={user} />
        )}

        {/* Pending Client Transfers */}
        {transfers.length > 0 && (
          <div className="mb-5 border border-blue-300 bg-blue-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <ArrowRightLeft className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-blue-800">Pending Client Transfers</span>
              <span className="ml-auto text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
                {transfers.length}
              </span>
            </div>
            <div className="space-y-2">
              {transfers.map(t => (
                <div key={t.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-blue-200 bg-white text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <ArrowRightLeft className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                    <span className="font-semibold truncate" style={{ color: "hsl(231,64%,28%)" }}>
                      {t.client_name}
                    </span>
                    <span className="text-xs text-slate-500 truncate">
                      from {t.from_worker_name || t.from_worker}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={async () => {
                        try {
                          await base44.entities.ClientTransfer.update(t.id, { status: "accepted" });
                          await base44.entities.Client.update(t.client_id, {
                            assigned_worker: t.to_worker,
                            assigned_worker_name: t.to_worker_name,
                          });
                        } catch {}
                        setTransfers(prev => prev.filter(x => x.id !== t.id));
                        // Refresh client lists (CC + SN split)
                        const allClients = await base44.entities.Client.list("-created_date", 1000);
                        const myEmail = (user?.email || "").toLowerCase();
                        const myName = (user?.full_name || "").toLowerCase();
                        const isDawnInit = myEmail === "dawn.williston@candorasociety.com";
                        const matchesCc = (c) =>
                          (c.assigned_worker && c.assigned_worker.toLowerCase() === myEmail) ||
                          (c.assigned_worker_name && c.assigned_worker_name.toLowerCase() === myName);
                        const matchesSn = (c) =>
                          (c.assigned_service_navigator && c.assigned_service_navigator.toLowerCase() === myEmail) ||
                          (c.assigned_service_navigator_name && c.assigned_service_navigator_name.toLowerCase() === myName);
                        const cc = allClients.filter(matchesCc);
                        const sn = isDawnInit
                          ? allClients.filter(c => (c.barriers_addressed || matchesSn(c)))
                          : allClients.filter(matchesSn);
                        setCcClients(cc);
                        setSnClients(sn);
                        setClients([...new Map([...cc, ...sn].map(c => [c.id, c])).values()]);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-white transition-colors hover:opacity-90"
                      style={{ background: "hsl(142,55%,35%)" }}
                    >
                      <Check className="w-3 h-3" /> Accept
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await base44.entities.ClientTransfer.update(t.id, { status: "rejected" });
                        } catch {}
                        setTransfers(prev => prev.filter(x => x.id !== t.id));
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
                    >
                      <X className="w-3 h-3" /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex gap-1 mb-5 bg-slate-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab("clients")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === "clients" ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> {isPureIPC ? "Internal Training" : "My Clients"}
          </button>
          {!isPureIPC && (
          <button
            onClick={() => setActiveTab("compass")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === "compass" ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Database className="w-3.5 h-3.5" /> Compass Queue
            {pendingCompassCount > 0 && (
              <span className="bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {pendingCompassCount}
              </span>
            )}
          </button>
          )}
          {isManagerOrAdmin && (
            <button
              onClick={() => setActiveTab("purchases")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "purchases" ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" /> Purchase Requests
              {pendingPurchaseCount > 0 && (
                <span className="bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingPurchaseCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Compass tab */}
        {activeTab === "compass" && (
          <>
            <div className="flex justify-end mb-3">
              <Button asChild size="sm" className="gap-2">
                <a href={COMPASS_URL} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5" /> Log in to Compass
                </a>
              </Button>
            </div>
            <CompassTaskList
              tasks={compassTasks}
              currentUser={user}
              onRefresh={(updated) => setCompassTasks(updated)}
            />
          </>
        )}

        {/* Purchase Requests tab (managers/admins only) */}
        {activeTab === "purchases" && isManagerOrAdmin && (
          <PurchaseRequestsTab requests={purchaseRequests} currentUser={user} />
        )}

        {/* Clients tab */}
        {activeTab === "clients" && (
          <>
          {/* Internal Training Clients section (Internal Placement Coordinators + Managers) */}
          {(isInternalPlacementCoordinator || isManagerOrAdmin) && (
            itcClients.length > 0 ? (
              <InternalTrainingClientsSection clients={itcClients} renderTable={renderClientTable} />
            ) : isPureIPC ? (
              <div className="text-center py-20 text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg font-medium">No internal training clients</p>
                <p className="text-sm mt-1">Clients assigned to you for internal training will appear here.</p>
              </div>
            ) : null
          )}

          {/* Standard client lists — hidden for pure Internal Placement Coordinators */}
          {!isPureIPC && clients.length > 0 && (
            <>
              {/* DEA Closing Alert */}
              {deaClosingClients.length > 0 && (
                <div className="mb-4 border border-blue-300 bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Bell className="w-4 h-4 text-blue-600 animate-bounce" />
                    <span className="text-sm font-bold text-blue-800">DEA Program Period Closing Soon</span>
                    <span className="ml-auto text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
                      {deaClosingClients.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {deaClosingClients.map(c => {
                      const endDate = c.completion_date
                        ? new Date(c.completion_date)
                        : addDays(new Date(c.service_start_date), 14);
                      const days = differenceInDays(endDate, new Date());
                      const isOverdue = days < 0;
                      return (
                        <div
                          key={c.id}
                          className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm ${
                            isOverdue ? "bg-red-50 border-red-300" : "bg-white border-blue-200"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <CalendarClock className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                            <Link
                              to={`/pathways/client/${c.id}`}
                              className="font-semibold hover:underline"
                              style={{ color: "hsl(231,64%,28%)" }}
                            >
                              {c.first_name} {c.last_name}
                            </Link>
                            <span className="text-xs text-slate-500">
                              — DEA period ends {format(endDate, "MMM d, yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`font-bold px-2 py-0.5 rounded-full ${
                              isOverdue ? "bg-red-100 text-red-700"
                              : days <= 1 ? "bg-amber-200 text-amber-800"
                              : "bg-blue-100 text-blue-700"
                            }`}>
                              {isOverdue ? `${Math.abs(days)}d past end` : days === 0 ? "Ends today!" : `${days}d left`}
                            </span>
                            <Link to={`/pathways/client/${c.id}`}>
                              <Button size="sm" variant="outline" className="text-xs h-6 px-2">Open File</Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 90-Day Follow-Up Alert */}
              {upcomingFollowups.length > 0 && (
                <div className="mb-4 border border-amber-300 bg-amber-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Bell className="w-4 h-4 text-amber-600 animate-bounce" />
                    <span className="text-sm font-bold text-amber-800">Upcoming 90-Day Follow-Ups</span>
                    <span className="ml-auto text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
                      {upcomingFollowups.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {upcomingFollowups.map(c => {
                      const followupDate = c.followup_90day_date
                        ? new Date(c.followup_90day_date)
                        : addDays(new Date(c.completion_date), 90);
                      const days = differenceInDays(followupDate, new Date());
                      const isOverdue = days < 0;
                      const isUrgent = days >= 0 && days <= 5;
                      return (
                        <div
                          key={c.id}
                          className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm ${
                            isOverdue ? "bg-red-50 border-red-300"
                            : isUrgent ? "bg-amber-100 border-amber-300 animate-pulse"
                            : "bg-white border-amber-200"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Bell className={`w-3.5 h-3.5 shrink-0 ${isOverdue ? "text-red-500" : "text-amber-500"}`} />
                            <Link
                              to={`/pathways/client/${c.id}`}
                              className="font-semibold hover:underline"
                              style={{ color: "hsl(231,64%,28%)" }}
                            >
                              {c.first_name} {c.last_name}
                            </Link>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-500">Due: {format(followupDate, "MMM d, yyyy")}</span>
                            <span className={`font-bold px-2 py-0.5 rounded-full ${
                              isOverdue ? "bg-red-100 text-red-700"
                              : isUrgent ? "bg-amber-200 text-amber-800"
                              : "bg-blue-100 text-blue-700"
                            }`}>
                              {isOverdue ? `${Math.abs(days)}d overdue` : days === 0 ? "Today!" : `${days}d`}
                            </span>
                            <Link to={`/pathways/client/${c.id}`}>
                              <Button size="sm" variant="outline" className="text-xs h-6 px-2">Go to Client</Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Placement sub-tabs */}
              <div className="flex gap-1 mb-4 border-b border-slate-200">
                {[
                  { id: "all", label: "All Clients", count: clients.filter(c => c.service_type === "direct_to_employment" || c.service_type === "pathways").length },
                  { id: "internal_training", label: "Internal Training", count: clients.filter(c => c.internal_placement && c.internal_placement !== "none").length },
                  { id: "work_exposure", label: "Work Exposure", count: clients.filter(c => c.exposure_course || c.paid_external_placement).length + exposurePlacements.length },
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

              {placementSubTab === "all" ? (
              <>
              {/* Client count */}
              <div className="flex items-center gap-2 text-slate-600 mb-2">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {displayed.length} of {deaWdTotal} client{deaWdTotal !== 1 ? "s" : ""}
                </span>
              </div>

              <ClientListControls
                search={search} onSearch={setSearch}
                filters={filters} onFilters={setFilters}
                sortKey={sortKey} onSort={setSortKey}
                variant="worker"
              />

              <CollapsibleClientSections clients={displayed} renderTable={renderClientTable} />

              {/* Service Navigation section — below DEA/WD with a visible divider */}
              {isServiceNavigator && (
                <>
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-slate-300" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Service Navigation</span>
                    <div className="flex-1 h-px bg-slate-300" />
                  </div>
                  <CollapsibleSection
                    title="Service Navigation WD Clients"
                    count={snDisplayed.length}
                    accentColor="#0f766e"
                    variant="main"
                    defaultOpen
                  >
                    {snDisplayed.length > 0
                      ? renderClientTable(snDisplayed, 'wd', 'all')
                      : <p className="text-sm text-slate-400 italic px-4 py-3">No clients assigned to you as Service Navigator.</p>}
                  </CollapsibleSection>
                </>
              )}
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
              ) : (
                <PlacementSections clients={displayed} type="internal" />
              )}
            </>
          )}

          {/* Empty state — non-managers with no assigned clients (pure IPCs handled above) */}
          {!isPureIPC && clients.length === 0 && !isManagerOrAdmin && (
            <div className="text-center py-20 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No clients yet</p>
              <p className="text-sm mt-1">
                {isDawn
                  ? "Clients with identified barriers will appear here."
                  : "Clients assigned to you will appear here."}
              </p>
            </div>
          )}
          </>
        )}
      </main>

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