import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { LogOut, Users, Bell, Database, CalendarClock, ArrowRightLeft, Check, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format, addDays, differenceInDays } from "date-fns";
import ClientListControls, { applyFiltersAndSort } from "@/components/lists/ClientListControls";
import { clientRowColor } from "@/lib/clientRowColor";
import CompassTaskList from "@/components/compass/CompassTaskList";

const EMPTY_FILTERS = {
  service_type: "", program_status: "", employment_status: "",
  clb_level: "", assigned_worker: "", age_min: "", age_max: "",
  duration_min: "", duration_max: "",
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
      const allClients = await base44.entities.Client.list("-created_date", 1000);
      const myEmail = (me.email || "").toLowerCase();
      const myName = (me.full_name || "").toLowerCase();
      const isDawnInit = myEmail === "dawn.williston@candorasociety.com";
      const matchesMe = (c) =>
        (c.assigned_worker && c.assigned_worker.toLowerCase() === myEmail) ||
        (c.assigned_worker_name && c.assigned_worker_name.toLowerCase() === myName);
      const myClients = isDawnInit
        ? allClients.filter(c => c.barriers_addressed || matchesMe(c))
        : allClients.filter(matchesMe);
      setClients(myClients);
      await loadCompassTasks(me.email, me.full_name);
      const pendingTransfers = await base44.entities.ClientTransfer.filter({ status: "pending" });
      setTransfers(pendingTransfers.filter(t => (t.to_worker || "").toLowerCase() === myEmail));
      setLoading(false);
    };
    init();
  }, []);

  const isDawn = (user?.email || "").toLowerCase() === "dawn.williston@candorasociety.com";
  const displayed = applyFiltersAndSort(clients, search, filters, sortKey);
  const pendingCompassCount = compassTasks.filter(t => t.status === "pending").length;

  // DEA Closing Alert
  const deaClosingClients = clients.filter(c => {
    if (c.service_type !== "direct_to_employment") return false;
    if (c.file_closed) return false;
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
            {isDawn ? "Service Navigator Dashboard" : "My Clients"}
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
                        // Refresh client list
                        const allClients = await base44.entities.Client.list("-created_date", 1000);
                        const myEmail = (user?.email || "").toLowerCase();
                        const myName = (user?.full_name || "").toLowerCase();
                        const isDawnInit = myEmail === "dawn.williston@candorasociety.com";
                        const matchesMe = (c) =>
                          (c.assigned_worker && c.assigned_worker.toLowerCase() === myEmail) ||
                          (c.assigned_worker_name && c.assigned_worker_name.toLowerCase() === myName);
                        const myClients = isDawnInit
                          ? allClients.filter(c => c.barriers_addressed || matchesMe(c))
                          : allClients.filter(matchesMe);
                        setClients(myClients);
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
            <Users className="w-3.5 h-3.5" /> My Clients
          </button>
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
        </div>

        {/* Compass tab */}
        {activeTab === "compass" && (
          <CompassTaskList
            tasks={compassTasks}
            currentUser={user}
            onRefresh={(updated) => setCompassTasks(updated)}
          />
        )}

        {/* Clients tab */}
        {activeTab === "clients" && (
          clients.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No clients yet</p>
              <p className="text-sm mt-1">
                {isDawn
                  ? "Clients with identified barriers will appear here."
                  : "Clients assigned to you will appear here."}
              </p>
            </div>
          ) : (
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

              {/* Client count */}
              <div className="flex items-center gap-2 text-slate-600 mb-2">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {displayed.length} of {clients.length} client{clients.length !== 1 ? "s" : ""}
                </span>
              </div>

              <ClientListControls
                search={search} onSearch={setSearch}
                filters={filters} onFilters={setFilters}
                sortKey={sortKey} onSort={setSortKey}
              />

              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-200" style={{ background: "hsl(231,64%,20%)" }}>
                      <tr>
                        <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Name</th>
                        <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">HSID#</th>
                        <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Service</th>
                        <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Switches</th>
                        <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Program Status</th>
                        <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">CLB</th>
                        {isDawn && <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Barrier 1</th>}
                        {isDawn && <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Barrier 2</th>}
                        {isDawn && <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Barrier 3</th>}
                        <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Employment Status</th>
                        <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Employment Start Date</th>
                        <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">90-Day Status</th>
                        <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Svc Nav</th>
                        <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Intake Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayed.map(c => (
                        <tr
                          key={c.id}
                          onClick={() => navigate(`/pathways/client/${c.id}`)}
                          className={`transition-colors cursor-pointer hover:brightness-95 ${clientRowColor(c)}`}
                        >
                          <td className="px-3 py-2.5 font-medium whitespace-nowrap">
                            <span className="font-semibold" style={{ color: "hsl(231,64%,28%)" }}>
                              {c.first_name} {c.last_name}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{c.compass_hsid || "—"}</td>
                          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{SERVICE_LABELS[c.service_type] || "—"}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {c.program_stream_switches?.length > 0 ? (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                                {c.program_stream_switches.length}×
                              </span>
                            ) : "—"}
                          </td>
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
                          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                            {c.clb_level?.replace("clb_", "CLB ").replace("native_english_french", "Native") || "—"}
                          </td>
                          {isDawn && (
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              {c.barrier_1 ? (
                                <span>
                                  <span className="text-slate-700">{c.barrier_1}</span>
                                  {c.barrier_1_status && (
                                    <span className={`ml-1 text-xs ${BARRIER_STATUS_COLORS[c.barrier_1_status] || ""}`}>
                                      ({c.barrier_1_status})
                                    </span>
                                  )}
                                </span>
                              ) : "—"}
                            </td>
                          )}
                          {isDawn && (
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              {c.barrier_2 ? (
                                <span>
                                  <span className="text-slate-700">{c.barrier_2}</span>
                                  {c.barrier_2_status && (
                                    <span className={`ml-1 text-xs ${BARRIER_STATUS_COLORS[c.barrier_2_status] || ""}`}>
                                      ({c.barrier_2_status})
                                    </span>
                                  )}
                                </span>
                              ) : "—"}
                            </td>
                          )}
                          {isDawn && (
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              {c.barrier_3 ? (
                                <span>
                                  <span className="text-slate-700">{c.barrier_3}</span>
                                  {c.barrier_3_status && (
                                    <span className={`ml-1 text-xs ${BARRIER_STATUS_COLORS[c.barrier_3_status] || ""}`}>
                                      ({c.barrier_3_status})
                                    </span>
                                  )}
                                </span>
                              ) : "—"}
                            </td>
                          )}
                          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap font-mono text-xs">
                            {c.post_completion_employment_status || "—"}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{fmtDate(c.post_completion_employment_date)}</td>
                          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap font-mono text-xs">{c.followup_90day_status || "—"}</td>
                          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{c.service_navigation_supports ? "Yes" : "—"}</td>
                          <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{fmtDate(c.intake_date)}</td>
                        </tr>
                      ))}
                      {displayed.length === 0 && (
                        <tr>
                          <td colSpan={isDawn ? 15 : 12} className="text-center py-10 text-slate-400">
                            No clients match your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )
        )}
      </main>
    </div>
  );
}