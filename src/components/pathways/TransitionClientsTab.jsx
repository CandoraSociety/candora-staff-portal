import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, differenceInDays, addDays, addWeeks, addMonths } from "date-fns";
import { Upload, Plus, Trash2, Pencil, X, Calendar, Flag, CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronRight, User, Phone, Mail, FileSpreadsheet, Loader2, Archive, RotateCcw, FolderX, Target } from "lucide-react";
import MilestoneDialog from "@/components/pathways/MilestoneDialog";
import MilestoneListModal from "@/components/pathways/MilestoneListModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const PRIORITY_COLORS = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};

const STATUS_COLORS = {
  not_started: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-700",
  introduced: "bg-purple-100 text-purple-700",
  completed: "bg-emerald-100 text-emerald-700",
};

const COUNSELLOR_BADGE = {
  Lola: "bg-rose-100 text-rose-700",
  Priscilla: "bg-indigo-100 text-indigo-700",
  Olena: "bg-emerald-100 text-emerald-700",
  Other: "bg-slate-100 text-slate-600",
};

const MILESTONE_STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  missed: "bg-red-100 text-red-700 border-red-200",
};

const fmtDate = (d) => {
  if (!d) return "—";
  try { return format(new Date(d), "MMM d, yyyy"); } catch { return "—"; }
};

function checkinUrgency(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const diff = differenceInDays(d, today);
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, class: "bg-red-500 text-white", dot: "bg-red-500" };
  if (diff === 0) return { label: "Today", class: "bg-orange-500 text-white", dot: "bg-orange-500" };
  if (diff <= 3) return { label: `${diff}d`, class: "bg-amber-100 text-amber-700", dot: "bg-amber-500" };
  if (diff <= 7) return { label: `${diff}d`, class: "bg-blue-100 text-blue-700", dot: "bg-blue-500" };
  return { label: `${diff}d`, class: "bg-slate-100 text-slate-500", dot: "bg-slate-300" };
}

function nextCheckinDate(frequency, fromDate) {
  const base = fromDate ? new Date(fromDate) : new Date();
  switch (frequency) {
    case "weekly": return addWeeks(base, 1);
    case "biweekly": return addWeeks(base, 2);
    case "monthly": return addMonths(base, 1);
    default: return null;
  }
}

const EMPTY_FORM = {
first_name: "", last_name: "", phone: "", email: "",
program: "WD", previous_counsellor: "Lola", previous_counsellor_other: "",
  new_counsellor: "Olena", transition_status: "not_started", priority: "medium",
  next_checkin_date: "", last_checkin_date: "", checkin_frequency: "weekly",
  checkin_notes: "", program_stage: "", notes: "",
  milestones: [],
};

export default function TransitionClientsTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);
  const [search, setSearch] = useState("");
  const [filterCounsellor, setFilterCounsellor] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterFileStatus, setFilterFileStatus] = useState("open");
  const [activeProgram, setActiveProgram] = useState("WD");
  const [closeDialog, setCloseDialog] = useState({ open: false, client: null });
  const [closeForm, setCloseForm] = useState({ reason: "completed", reason_other: "", notes: "" });
  const [milestoneDialog, setMilestoneDialog] = useState({ open: false, client: null });
  const [listModal, setListModal] = useState({ open: false, title: "", items: [] });

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["transition-clients"],
    queryFn: () => base44.entities.TransitionClient.list("-next_checkin_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TransitionClient.create(data),
    onSuccess: () => { qc.invalidateQueries(["transition-clients"]); toast({ title: "Client added" }); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TransitionClient.update(id, data),
    onSuccess: () => { qc.invalidateQueries(["transition-clients"]); toast({ title: "Client updated" }); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TransitionClient.delete(id),
    onSuccess: () => { qc.invalidateQueries(["transition-clients"]); toast({ title: "Client deleted" }); },
  });

  const bulkCreate = useMutation({
    mutationFn: (records) => base44.entities.TransitionClient.bulkCreate(records),
    onSuccess: (data) => {
      qc.invalidateQueries(["transition-clients"]);
      toast({ title: "Import complete", description: `${Array.isArray(data) ? data.length : "??"} clients imported.` });
    },
    onError: (err) => toast({ title: "Import failed", description: err?.message, variant: "destructive" }),
  });

  async function handleCloseFile() {
    if (!closeDialog.client) return;
    const isClosing = closeDialog.client.file_status !== "closed";
    const data = isClosing
      ? {
          file_status: "closed",
          close_reason: closeForm.reason,
          close_reason_other: closeForm.reason === "other" ? closeForm.reason_other : "",
          close_notes: closeForm.notes,
          close_date: format(new Date(), "yyyy-MM-dd"),
        }
      : {
          file_status: "open",
          close_reason: null,
          close_reason_other: "",
          close_notes: "",
          close_date: null,
        };
    await updateMutation.mutateAsync({ id: closeDialog.client.id, data });
    setCloseDialog({ open: false, client: null });
    setCloseForm({ reason: "completed", reason_other: "", notes: "" });
    toast({ title: isClosing ? "File closed" : "File reopened" });
  }

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function handleEdit(client) {
    const effectiveProgram = client.program || (String(client.service_element || "").toUpperCase().includes("CEIS") ? "CEIS" : "WD");
    setEditingId(client.id);
    setForm({
      ...EMPTY_FORM,
      ...client,
      program: effectiveProgram,
      previous_counsellor_other: client.previous_counsellor_other || "",
      milestones: client.milestones || [],
    });
    setShowForm(true);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const { _showCrt, ...formData } = form;
    const payload = {
      ...formData,
      previous_counsellor: form.previous_counsellor || "Lola",
      new_counsellor: form.new_counsellor || "Olena",
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function addMilestone() {
    setForm({ ...form, milestones: [...form.milestones, { title: "", date: "", status: "pending", notes: "" }] });
  }

  function updateMilestone(idx, field, value) {
    const ms = [...form.milestones];
    ms[idx] = { ...ms[idx], [field]: value };
    setForm({ ...form, milestones: ms });
  }

  function removeMilestone(idx) {
    setForm({ ...form, milestones: form.milestones.filter((_, i) => i !== idx) });
  }

  async function handleQuickCheckin(client) {
    const nextDate = nextCheckinDate(client.checkin_frequency, new Date());
    await updateMutation.mutateAsync({
      id: client.id,
      data: {
        last_checkin_date: format(new Date(), "yyyy-MM-dd"),
        next_checkin_date: nextDate ? format(nextDate, "yyyy-MM-dd") : null,
      },
    });
  }

  async function handleToggleMilestone(client, msIdx) {
    const milestones = [...(client.milestones || [])];
    milestones[msIdx] = {
      ...milestones[msIdx],
      status: milestones[msIdx].status === "completed" ? "pending" : "completed",
    };
    await updateMutation.mutateAsync({ id: client.id, data: { milestones } });
  }

  async function handleSaveMilestones(data) {
    if (!milestoneDialog.client) return;
    await updateMutation.mutateAsync({
      id: milestoneDialog.client.id,
      data: { milestones: data.milestones },
    });
    setMilestoneDialog({ open: false, client: null });
  }

  function openMilestoneList(category) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const items = [];
    programClients.forEach(c => {
      (c.milestones || []).forEach(m => {
        if (m.status !== "pending" || !m.date) return;
        const d = new Date(m.date);
        d.setHours(0, 0, 0, 0);
        const diff = differenceInDays(d, today);
        const include =
          category === "overdue" ? diff < 0 :
          category === "upcoming" ? diff >= 0 && diff <= 7 :
          true;
        if (include) {
          const u = checkinUrgency(m.date);
          items.push({
            clientName: `${c.first_name} ${c.last_name}`,
            title: m.title || "Untitled milestone",
            dateStr: fmtDate(m.date),
            rawDate: m.date,
            urgencyLabel: u?.label || "—",
            urgencyClass: u?.class || "bg-slate-100 text-slate-500",
          });
        }
      });
    });
    items.sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));
    const titles = {
      overdue: "Overdue Milestones",
      upcoming: "Upcoming Milestones",
      all: "All Pending Milestones",
    };
    setListModal({ open: true, title: titles[category] || category, items });
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const response = await base44.functions.invoke('parseTransitionImport', { file_url });
      const records = response.data?.records;

      if (!records || records.length === 0) {
        toast({ title: "No data found", description: response.data?.error || "Could not extract client records from the file.", variant: "destructive" });
        setImporting(false);
        e.target.value = "";
        return;
      }

      await bulkCreate.mutateAsync(records);
    } catch (err) {
      toast({ title: "Import failed", description: err?.message || "Unknown error", variant: "destructive" });
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  // Filter and sort
  const filtered = clients.filter(c => {
    const program = c.program || (String(c.service_element || "").toUpperCase().includes("CEIS") ? "CEIS" : "WD");
    if (program !== activeProgram) return false;
    if (filterFileStatus === "open" && c.file_status === "closed") return false;
    if (filterFileStatus === "closed" && c.file_status !== "closed") return false;
    if (search) {
      const q = search.toLowerCase();
      const name = `${c.first_name} ${c.last_name}`.toLowerCase();
      if (!name.includes(q) && !(c.email || "").toLowerCase().includes(q) && !(c.phone || "").includes(q)) return false;
    }
    if (filterCounsellor && c.previous_counsellor !== filterCounsellor) return false;
    if (filterPriority && c.priority !== filterPriority) return false;
    return true;
  }).sort((a, b) => {
    const da = a.next_checkin_date ? new Date(a.next_checkin_date) : new Date(9999, 0, 1);
    const db = b.next_checkin_date ? new Date(b.next_checkin_date) : new Date(9999, 0, 1);
    return da - db;
  });

  // Scope stats to active program
  const programClients = clients.filter(c => {
    const p = c.program || (String(c.service_element || "").toUpperCase().includes("CEIS") ? "CEIS" : "WD");
    return p === activeProgram;
  });

  // Milestone-based stats — overdue, upcoming (within 7 days), and all pending
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueCount = programClients.reduce((s, c) => s + (c.milestones || []).filter(m => {
    if (m.status !== "pending" || !m.date) return false;
    const d = new Date(m.date); d.setHours(0, 0, 0, 0);
    return d < today;
  }).length, 0);
  const upcomingCount = programClients.reduce((s, c) => s + (c.milestones || []).filter(m => {
    if (m.status !== "pending" || !m.date) return false;
    const d = new Date(m.date); d.setHours(0, 0, 0, 0);
    const diff = differenceInDays(d, today);
    return diff >= 0 && diff <= 7;
  }).length, 0);
  const pendingMilestones = programClients.reduce((s, c) => s + (c.milestones?.filter(m => m.status === "pending" && m.date).length || 0), 0);

  return (
    <div>
      {/* Program toggle */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setActiveProgram("WD")}
          className={cn(
            "px-4 py-1.5 rounded-lg text-sm font-semibold transition border",
            activeProgram === "WD"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
          )}
        >
          Pathways (WD)
        </button>
        <button
          onClick={() => setActiveProgram("CEIS")}
          className={cn(
            "px-4 py-1.5 rounded-lg text-sm font-semibold transition border",
            activeProgram === "CEIS"
              ? "bg-purple-600 text-white border-purple-600"
              : "bg-white text-slate-600 border-slate-200 hover:border-purple-300"
          )}
        >
          DEA (CEIS)
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Input
          placeholder="Search by name, phone, email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-9 max-w-xs text-sm"
        />
        <select
          value={filterCounsellor}
          onChange={e => setFilterCounsellor(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">All counsellors</option>
          <option value="Lola">From Lola</option>
          <option value="Priscilla">From Priscilla</option>
          <option value="Other">From Other</option>
        </select>
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={filterFileStatus}
          onChange={e => setFilterFileStatus(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="open">Open files</option>
          <option value="closed">Closed files</option>
          <option value="all">All files</option>
        </select>
        <div className="flex-1" />
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.json"
          onChange={handleImport}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="gap-1.5"
        >
          {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {importing ? "Importing..." : "Import File"}
        </Button>
        <Button
          size="sm"
          onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(!showForm); }}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Client
        </Button>
      </div>

      {/* Summary banners — click Overdue/Upcoming/Milestones to see all items */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-wide">Total</div>
          <div className="text-2xl font-bold" style={{ color: "hsl(231,64%,20%)" }}>{programClients.length}</div>
          <div className="text-xs text-slate-400">clients to transition</div>
        </div>
        <button onClick={() => openMilestoneList("overdue")} className="bg-red-50 border border-red-200 rounded-lg p-3 text-left hover:ring-2 hover:ring-red-300 transition cursor-pointer">
          <div className="flex items-center gap-2 text-red-600 text-xs font-medium uppercase tracking-wide"><AlertCircle className="w-3.5 h-3.5" />Overdue</div>
          <div className="text-2xl font-bold text-red-700">{overdueCount}</div>
          <div className="text-xs text-red-400">milestones past due</div>
        </button>
        <button onClick={() => openMilestoneList("upcoming")} className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-left hover:ring-2 hover:ring-blue-300 transition cursor-pointer">
          <div className="flex items-center gap-2 text-blue-600 text-xs font-medium uppercase tracking-wide"><Clock className="w-3.5 h-3.5" />Upcoming</div>
          <div className="text-2xl font-bold text-blue-700">{upcomingCount}</div>
          <div className="text-xs text-blue-400">milestones within 7 days</div>
        </button>
        <button onClick={() => openMilestoneList("all")} className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-left hover:ring-2 hover:ring-amber-300 transition cursor-pointer">
          <div className="flex items-center gap-2 text-amber-600 text-xs font-medium uppercase tracking-wide"><Flag className="w-3.5 h-3.5" />Milestones</div>
          <div className="text-2xl font-bold text-amber-700">{pendingMilestones}</div>
          <div className="text-xs text-amber-400">pending milestones</div>
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-5 mb-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm" style={{ color: "hsl(231,64%,20%)" }}>{editingId ? "Edit Client" : "New Transition Client"}</h3>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">First Name *</label>
              <Input required value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Last Name *</label>
              <Input required value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Phone</label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">COMPASS HSID</label>
              <Input value={form.compass_hsid || ""} onChange={e => setForm({ ...form, compass_hsid: e.target.value })} className="h-8 text-sm font-mono" placeholder="HSID number" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Email</label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Program</label>
              <select value={form.program} onChange={e => setForm({ ...form, program: e.target.value })} className="w-full h-8 border border-input rounded-md px-2 text-sm bg-background">
                <option value="WD">Pathways (WD)</option>
                <option value="CEIS">DEA (CEIS)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Previous Counsellor</label>
              <select value={form.previous_counsellor} onChange={e => setForm({ ...form, previous_counsellor: e.target.value })} className="w-full h-8 border border-input rounded-md px-2 text-sm bg-background">
                <option value="Lola">Lola</option>
                <option value="Priscilla">Priscilla</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {form.previous_counsellor === "Other" && (
              <div>
                <label className="text-xs font-medium mb-1 block">Counsellor Name</label>
                <Input value={form.previous_counsellor_other} onChange={e => setForm({ ...form, previous_counsellor_other: e.target.value })} className="h-8 text-sm" placeholder="Name" />
              </div>
            )}
            <div>
              <label className="text-xs font-medium mb-1 block">New Counsellor</label>
              <Input value={form.new_counsellor} onChange={e => setForm({ ...form, new_counsellor: e.target.value })} className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Transition Status <span className="text-slate-400 normal-case font-normal">(counsellor handoff)</span></label>
              <select value={form.transition_status} onChange={e => setForm({ ...form, transition_status: e.target.value })} className="w-full h-8 border border-input rounded-md px-2 text-sm bg-background">
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="introduced">Introduced</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Priority</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full h-8 border border-input rounded-md px-2 text-sm bg-background">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Next Check-in</label>
              <Input type="date" value={form.next_checkin_date} onChange={e => setForm({ ...form, next_checkin_date: e.target.value })} className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Last Check-in</label>
              <Input type="date" value={form.last_checkin_date} onChange={e => setForm({ ...form, last_checkin_date: e.target.value })} className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Check-in Frequency</label>
              <select value={form.checkin_frequency} onChange={e => setForm({ ...form, checkin_frequency: e.target.value })} className="w-full h-8 border border-input rounded-md px-2 text-sm bg-background">
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="as_needed">As Needed</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="text-xs font-medium mb-1 block">Program Stage</label>
              <Input value={form.program_stage} onChange={e => setForm({ ...form, program_stage: e.target.value })} className="h-8 text-sm" placeholder="e.g. Assessments, Action Plan, Placement, Follow-up" />
            </div>
            <div className="sm:col-span-3">
              <label className="text-xs font-medium mb-1 block">Check-in Notes</label>
              <textarea value={form.checkin_notes} onChange={e => setForm({ ...form, checkin_notes: e.target.value })} rows={2} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background resize-none" />
            </div>
            <div className="sm:col-span-3">
              <label className="text-xs font-medium mb-1 block">General Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background resize-none" />
            </div>
          </div>

          {/* CRT Program Data */}
          <div>
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, _showCrt: !prev._showCrt }))}
              className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
            >
              {form._showCrt ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              CRT Program Data
            </button>
            {form._showCrt && (
              <div className="grid sm:grid-cols-3 gap-3 mt-2 bg-slate-50 rounded-lg p-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Service Element</label>
                  <Input value={form.service_element || ""} onChange={e => setForm({ ...form, service_element: e.target.value })} className="h-8 text-sm" placeholder="e.g. WD, CEIS" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">DEA Start Date</label>
                  <Input type="date" value={form.dea_start_date || ""} onChange={e => setForm({ ...form, dea_start_date: e.target.value })} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Service Start Date</label>
                  <Input type="date" value={form.service_start_date || ""} onChange={e => setForm({ ...form, service_start_date: e.target.value })} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Service Outcome</label>
                  <Input value={form.service_outcome || ""} onChange={e => setForm({ ...form, service_outcome: e.target.value })} className="h-8 text-sm" placeholder="e.g. Complete, Cancelled" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Service Outcome Date</label>
                  <Input type="date" value={form.service_outcome_date || ""} onChange={e => setForm({ ...form, service_outcome_date: e.target.value })} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Placement Outcome</label>
                  <Input value={form.placement_outcome || ""} onChange={e => setForm({ ...form, placement_outcome: e.target.value })} className="h-8 text-sm" placeholder="e.g. E-RF, UE-LFW, AoP" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Placement Outcome Date</label>
                  <Input type="date" value={form.placement_outcome_date || ""} onChange={e => setForm({ ...form, placement_outcome_date: e.target.value })} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">30-Day Outcome</label>
                  <Input value={form.outcome_30day || ""} onChange={e => setForm({ ...form, outcome_30day: e.target.value })} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">30-Day Outcome Date</label>
                  <Input type="date" value={form.outcome_30day_date || ""} onChange={e => setForm({ ...form, outcome_30day_date: e.target.value })} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">60-Day Outcome</label>
                  <Input value={form.outcome_60day || ""} onChange={e => setForm({ ...form, outcome_60day: e.target.value })} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">60-Day Outcome Date</label>
                  <Input type="date" value={form.outcome_60day_date || ""} onChange={e => setForm({ ...form, outcome_60day_date: e.target.value })} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">90-Day Outcome</label>
                  <Input value={form.outcome_90day || ""} onChange={e => setForm({ ...form, outcome_90day: e.target.value })} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">90-Day Outcome Date</label>
                  <Input type="date" value={form.outcome_90day_date || ""} onChange={e => setForm({ ...form, outcome_90day_date: e.target.value })} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">180-Day Outcome</label>
                  <Input value={form.outcome_180day || ""} onChange={e => setForm({ ...form, outcome_180day: e.target.value })} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">180-Day Outcome Date</label>
                  <Input type="date" value={form.outcome_180day_date || ""} onChange={e => setForm({ ...form, outcome_180day_date: e.target.value })} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">EDA Completion Date</label>
                  <Input type="date" value={form.eda_completion_date || ""} onChange={e => setForm({ ...form, eda_completion_date: e.target.value })} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Employed FT/PT</label>
                  <Input value={form.employed_ftpt || ""} onChange={e => setForm({ ...form, employed_ftpt: e.target.value })} className="h-8 text-sm" placeholder="e.g. FT, PT" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium">CRT Flags</label>
                  <div className="flex flex-col gap-1">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input type="checkbox" checked={!!form.service_navigation_support} onChange={e => setForm({ ...form, service_navigation_support: e.target.checked })} className="rounded" />
                      Service Navigation Support
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input type="checkbox" checked={!!form.work_exposure} onChange={e => setForm({ ...form, work_exposure: e.target.checked })} className="rounded" />
                      Work Exposure
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input type="checkbox" checked={!!form.wage_subsidy} onChange={e => setForm({ ...form, wage_subsidy: e.target.checked })} className="rounded" />
                      Wage Subsidy
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input type="checkbox" checked={!!form.ceis_dea} onChange={e => setForm({ ...form, ceis_dea: e.target.checked })} className="rounded" />
                      CEIS (DEA)
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Milestones editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Milestones</label>
              <button type="button" onClick={addMilestone} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
            </div>
            <div className="space-y-2">
              {form.milestones.map((ms, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-slate-50 rounded-lg p-2">
                  <Input placeholder="Milestone title" value={ms.title} onChange={e => updateMilestone(idx, "title", e.target.value)} className="h-8 text-sm flex-1" />
                  <Input type="date" value={ms.date} onChange={e => updateMilestone(idx, "date", e.target.value)} className="h-8 text-sm w-36" />
                  <select value={ms.status} onChange={e => updateMilestone(idx, "status", e.target.value)} className="h-8 border border-input rounded-md px-2 text-sm bg-background">
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="missed">Missed</option>
                  </select>
                  <button type="button" onClick={() => removeMilestone(idx)} className="text-slate-400 hover:text-red-500 mt-1"><X className="w-4 h-4" /></button>
                </div>
              ))}
              {form.milestones.length === 0 && <p className="text-xs text-slate-400">No milestones added yet.</p>}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={resetForm}>Cancel</Button>
            <Button type="submit" size="sm" disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : editingId ? "Save Changes" : "Add Client"}
            </Button>
          </div>
        </form>
      )}

      {/* Import hint */}
      {clients.length === 0 && !isLoading && !showForm && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <FileSpreadsheet className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <h3 className="font-semibold text-amber-900 mb-1">No transition clients yet</h3>
          <p className="text-sm text-amber-700 mb-3">Import a CSV or Excel file with your client list, or add clients manually.</p>
          <p className="text-xs text-amber-600">Expected columns: First Name, Last Name, Phone, Email, Previous Counsellor, Priority, Next Check-in, Program Stage, Notes</p>
        </div>
      )}

      {/* Client cards */}
      <div className="space-y-2">
        {isLoading && <div className="text-center py-10 text-slate-400">Loading...</div>}
        {filtered.map(c => {
          const urgency = checkinUrgency(c.next_checkin_date);
          const isExpanded = expandedId === c.id;
          const prevName = c.previous_counsellor === "Other" ? (c.previous_counsellor_other || "Other") : c.previous_counsellor;
          const pendingMs = (c.milestones || []).filter(m => m.status === "pending");
          const upcomingMs = pendingMs.filter(m => {
            const u = checkinUrgency(m.date);
            return u && (u.label.includes("overdue") || u.label === "Today" || (!u.label.includes("d") && u.label !== "—"));
          });
          return (
            <div key={c.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              {/* Main row */}
              <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
              >
                <button className="text-slate-400 shrink-0">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {/* Urgency dot */}
                <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", urgency?.dot || "bg-slate-200")} />

                {/* Name + contact */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("font-semibold text-sm", c.file_status === "closed" && "text-slate-400 line-through")} style={{ color: c.file_status === "closed" ? undefined : "hsl(231,64%,20%)" }}>{c.first_name} {c.last_name}</span>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium border", PRIORITY_COLORS[c.priority] || PRIORITY_COLORS.medium)}>
                      {c.priority}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Transition:</span>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", STATUS_COLORS[c.transition_status] || STATUS_COLORS.not_started)}>
                      {c.transition_status?.replace(/_/g, " ")}
                    </span>
                    {c.file_status === "closed" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-slate-700 text-white flex items-center gap-0.5">
                        <Archive className="w-2.5 h-2.5" /> Closed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                    {c.compass_hsid && <span className="font-mono">HSID: {c.compass_hsid}</span>}
                    {c.phone && <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" />{c.phone}</span>}
                    {c.email && <span className="flex items-center gap-0.5"><Mail className="w-3 h-3" />{c.email}</span>}
                    {c.program_stage && <span className="flex items-center gap-0.5"><User className="w-3 h-3" />{c.program_stage}</span>}
                    {c.employed_ftpt && <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium">{c.employed_ftpt}</span>}
                  </div>
                </div>

                {/* Counsellor transition */}
                <div className="hidden md:flex items-center gap-1.5 shrink-0">
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", COUNSELLOR_BADGE[c.previous_counsellor] || COUNSELLOR_BADGE.Other)}>{prevName}</span>
                  <span className="text-slate-300 text-xs">→</span>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", COUNSELLOR_BADGE[c.new_counsellor] || COUNSELLOR_BADGE.Other)}>{c.new_counsellor || "Olena"}</span>
                </div>

                {/* Next check-in */}
                <div className="shrink-0 text-right">
                  <div className="text-xs text-slate-400">Next Check-in</div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">{fmtDate(c.next_checkin_date)}</span>
                  </div>
                </div>

                {/* Urgency badge */}
                {urgency && (
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0", urgency.class)}>
                    {urgency.label}
                  </span>
                )}

                {/* Pending milestones indicator */}
                {pendingMs.length > 0 && (
                  <div className="shrink-0 flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                    <Flag className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] font-medium text-amber-700">{pendingMs.length}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); handleQuickCheckin(c); }} className="p-1.5 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition" title="Mark check-in done & set next date">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setMilestoneDialog({ open: true, client: c }); }} className="p-1.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition" title="Set milestones">
                    <Target className="w-4 h-4" />
                  </button>
                  {c.file_status === "closed" ? (
                    <button onClick={(e) => { e.stopPropagation(); setCloseDialog({ open: true, client: c }); }} className="p-1.5 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition" title="Reopen file">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); setCloseDialog({ open: true, client: c }); setCloseForm({ reason: "completed", reason_other: "", notes: c.service_outcome ? `Program outcome: ${c.service_outcome}` : "" }); }} className="p-1.5 rounded text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition" title="Close file">
                      <FolderX className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(c); }} className="p-1.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); if (confirm(`Delete ${c.first_name} ${c.last_name}?`)) deleteMutation.mutate(c.id); }} className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50 space-y-3">
                  {/* File closure banner */}
                  {c.file_status === "closed" && (
                    <div className="bg-slate-100 border border-slate-300 rounded-md p-3 flex items-start gap-2">
                      <Archive className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                      <div className="text-xs">
                        <span className="font-semibold text-slate-600">File Closed</span>
                        <span className="text-slate-500"> — {c.close_reason === "completed" ? "Program Completed" : c.close_reason === "cancelled" ? "Cancelled" : c.close_reason === "transferred" ? "Transferred Out" : c.close_reason === "not_eligible" ? "Not Eligible" : c.close_reason_other || c.close_reason}</span>
                        {c.close_date && <span className="text-slate-400"> · {fmtDate(c.close_date)}</span>}
                        {c.close_notes && <p className="text-slate-500 mt-1 whitespace-pre-wrap">{c.close_notes}</p>}
                      </div>
                    </div>
                  )}

                  {/* CRT Program Progress */}
                  {(c.service_outcome || c.placement_outcome || c.service_start_date || c.service_element) && (
                    <div className="bg-white border border-slate-200 rounded-md p-3">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">CRT Program Progress</span>
                      <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                        {c.service_element && <div><span className="text-slate-400 block">Service Element</span><span className="text-slate-700 font-medium">{c.service_element}</span></div>}
                        {c.service_start_date && <div><span className="text-slate-400 block">Service Start</span><span className="text-slate-700">{fmtDate(c.service_start_date)}</span></div>}
                        {c.service_outcome && <div><span className="text-slate-400 block">Service Outcome</span><span className="text-slate-700 font-medium">{c.service_outcome}</span></div>}
                        {c.service_outcome_date && <div><span className="text-slate-400 block">Outcome Date</span><span className="text-slate-700">{fmtDate(c.service_outcome_date)}</span></div>}
                        {c.placement_outcome && <div><span className="text-slate-400 block">Placement Outcome</span><span className="text-slate-700 font-medium">{c.placement_outcome}</span></div>}
                        {c.placement_outcome_date && <div><span className="text-slate-400 block">Placement Date</span><span className="text-slate-700">{fmtDate(c.placement_outcome_date)}</span></div>}
                        {c.outcome_30day && <div><span className="text-slate-400 block">30-Day</span><span className="text-slate-700">{c.outcome_30day}{c.outcome_30day_date ? ` · ${fmtDate(c.outcome_30day_date)}` : ""}</span></div>}
                        {c.outcome_60day && <div><span className="text-slate-400 block">60-Day</span><span className="text-slate-700">{c.outcome_60day}{c.outcome_60day_date ? ` · ${fmtDate(c.outcome_60day_date)}` : ""}</span></div>}
                        {c.outcome_90day && <div><span className="text-slate-400 block">90-Day</span><span className="text-slate-700">{c.outcome_90day}{c.outcome_90day_date ? ` · ${fmtDate(c.outcome_90day_date)}` : ""}</span></div>}
                        {c.outcome_180day && <div><span className="text-slate-400 block">180-Day</span><span className="text-slate-700">{c.outcome_180day}{c.outcome_180day_date ? ` · ${fmtDate(c.outcome_180day_date)}` : ""}</span></div>}
                        {c.employed_ftpt && <div><span className="text-slate-400 block">Employed</span><span className="text-slate-700 font-medium">{c.employed_ftpt}</span></div>}
                        {c.service_navigation_support && <div><span className="text-slate-400 block">Svc Navigation</span><span className="text-emerald-600 font-medium">Yes</span></div>}
                        {c.work_exposure && <div><span className="text-slate-400 block">Work Exposure</span><span className="text-emerald-600 font-medium">Yes</span></div>}
                        {c.wage_subsidy && <div><span className="text-slate-400 block">Wage Subsidy</span><span className="text-emerald-600 font-medium">Yes</span></div>}
                        {c.ceis_dea && <div><span className="text-slate-400 block">CEIS (DEA)</span><span className="text-emerald-600 font-medium">Yes</span></div>}
                        {c.dea_start_date && <div><span className="text-slate-400 block">DEA Start</span><span className="text-slate-700">{fmtDate(c.dea_start_date)}</span></div>}
                        {c.eda_completion_date && <div><span className="text-slate-400 block">EDA Completed</span><span className="text-slate-700">{fmtDate(c.eda_completion_date)}</span></div>}
                      </div>
                    </div>
                  )}

                  {/* Check-in info */}
                  <div className="grid sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-slate-400 block">Last Check-in</span>
                      <span className="text-slate-700">{fmtDate(c.last_checkin_date)}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Frequency</span>
                      <span className="text-slate-700 capitalize">{c.checkin_frequency?.replace(/_/g, " ") || "—"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Counsellor Transition</span>
                      <span className="text-slate-700">{prevName} → {c.new_counsellor || "Olena"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Contact</span>
                      <span className="text-slate-700">{c.phone || c.email || "—"}</span>
                    </div>
                  </div>

                  {/* Check-in notes */}
                  {c.checkin_notes && (
                    <div className="bg-white border border-slate-200 rounded-md p-2">
                      <span className="text-xs font-medium text-slate-500">Check-in Notes:</span>
                      <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{c.checkin_notes}</p>
                    </div>
                  )}

                  {/* General notes */}
                  {c.notes && (
                    <div className="bg-white border border-slate-200 rounded-md p-2">
                      <span className="text-xs font-medium text-slate-500">Notes:</span>
                      <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{c.notes}</p>
                    </div>
                  )}

                  {/* Milestones */}
                  {(c.milestones || []).length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-slate-500 mb-2 block">Milestones</span>
                      <div className="space-y-1.5">
                        {c.milestones.map((ms, idx) => {
                          const msUrgency = checkinUrgency(ms.date);
                          return (
                            <div key={idx} className="flex items-center gap-2 bg-white border border-slate-200 rounded-md p-2">
                              <button
                                onClick={() => handleToggleMilestone(c, idx)}
                                className={cn(
                                  "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition",
                                  ms.status === "completed" ? "bg-emerald-500 border-emerald-500" : "border-slate-300 hover:border-emerald-400"
                                )}
                              >
                                {ms.status === "completed" && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </button>
                              <span className={cn("text-sm flex-1", ms.status === "completed" ? "text-slate-400 line-through" : "text-slate-700")}>
                                {ms.title || "Untitled milestone"}
                              </span>
                              {ms.date && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-slate-400">{fmtDate(ms.date)}</span>
                                  {ms.status === "pending" && msUrgency && (
                                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", msUrgency.class)}>
                                      {msUrgency.label}
                                    </span>
                                  )}
                                </div>
                              )}
                              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium border", MILESTONE_STATUS_COLORS[ms.status] || MILESTONE_STATUS_COLORS.pending)}>
                                {ms.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {(!c.milestones || c.milestones.length === 0) && !c.notes && !c.checkin_notes && (
                    <p className="text-xs text-slate-400">No additional details. Click the pencil to add milestones, notes, or check-in details.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && !isLoading && clients.length > 0 && (
          <div className="text-center py-10 text-slate-400">No clients match your filters.</div>
        )}
        </div>

        {/* Close File Dialog */}
        {closeDialog.open && closeDialog.client && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setCloseDialog({ open: false, client: null })}>
         <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 space-y-4" onClick={e => e.stopPropagation()}>
           <div className="flex items-center gap-2">
             {closeDialog.client.file_status === "closed" ? <RotateCcw className="w-5 h-5 text-emerald-600" /> : <FolderX className="w-5 h-5 text-orange-600" />}
             <h3 className="font-semibold text-sm" style={{ color: "hsl(231,64%,20%)" }}>
               {closeDialog.client.file_status === "closed" ? "Reopen File" : "Close File"}
             </h3>
           </div>
           <p className="text-sm text-slate-600">
             {closeDialog.client.file_status === "closed"
               ? `Reopen the file for ${closeDialog.client.first_name} ${closeDialog.client.last_name}?`
               : `Close the file for ${closeDialog.client.first_name} ${closeDialog.client.last_name}?`}
           </p>
           {closeDialog.client.file_status !== "closed" && (
             <>
               <div>
                 <label className="text-xs font-medium mb-1 block">Reason for closure</label>
                 <select
                   value={closeForm.reason}
                   onChange={e => setCloseForm({ ...closeForm, reason: e.target.value })}
                   className="w-full h-9 border border-input rounded-md px-3 text-sm bg-background"
                 >
                   <option value="completed">Program Completed</option>
                   <option value="cancelled">Cancelled</option>
                   <option value="transferred">Transferred Out</option>
                   <option value="not_eligible">Not Eligible</option>
                   <option value="other">Other</option>
                 </select>
               </div>
               {closeForm.reason === "other" && (
                 <div>
                   <label className="text-xs font-medium mb-1 block">Specify reason</label>
                   <Input value={closeForm.reason_other} onChange={e => setCloseForm({ ...closeForm, reason_other: e.target.value })} className="h-9 text-sm" />
                 </div>
               )}
               <div>
                 <label className="text-xs font-medium mb-1 block">Closure notes</label>
                 <textarea value={closeForm.notes} onChange={e => setCloseForm({ ...closeForm, notes: e.target.value })} rows={3} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background resize-none" placeholder="Add any notes about this closure..." />
               </div>
             </>
           )}
           <div className="flex gap-2 pt-2">
             <Button variant="outline" size="sm" onClick={() => setCloseDialog({ open: false, client: null })}>Cancel</Button>
             <Button size="sm" onClick={handleCloseFile} disabled={updateMutation.isPending} className="gap-1.5">
               {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : closeDialog.client.file_status === "closed" ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
               {closeDialog.client.file_status === "closed" ? "Reopen File" : "Close File"}
             </Button>
             </div>
             </div>
             </div>
             )}

             {/* Milestone Dialog */}
             {milestoneDialog.open && milestoneDialog.client && (
             <MilestoneDialog
             client={milestoneDialog.client}
             onClose={() => setMilestoneDialog({ open: false, client: null })}
             onSave={handleSaveMilestones}
             saving={updateMutation.isPending}
             />
             )}

             {/* Milestone List Modal */}
             {listModal.open && (
             <MilestoneListModal
             title={listModal.title}
             items={listModal.items}
             onClose={() => setListModal({ open: false, title: "", items: [] })}
             />
             )}
             </div>
             );
             }