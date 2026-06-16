import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { format, isToday, isTomorrow, parseISO, isPast } from "date-fns";
import ReactMarkdown from "react-markdown";
import { Send, Sparkles, ChevronDown, ChevronUp, Lightbulb, RefreshCw, BookOpen, Check, X, RotateCcw } from "lucide-react";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDueLabel(dateStr) {
  if (!dateStr) return "";
  try {
    const d = parseISO(dateStr);
    if (isPast(d) && !isToday(d)) return " (overdue)";
    if (isToday(d)) return " (today)";
    if (isTomorrow(d)) return " (tomorrow)";
    return ` (${format(d, "MMM d")})`;
  } catch { return ""; }
}

function buildContext({ user, tasks, projects, objectives, notes, organizer, kpis, budgets,
  grantProjects, grantReports, employees, volunteers, clients, announcements,
  edProjects, compassTasks, events, programs, marketingCampaigns, invoices }) {
  const firstName = user?.full_name?.split(" ")[0] || "Director";
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  const openTasks = tasks.filter(t => t.status !== "completed" && t.status !== "cancelled");
  const urgentTasks = openTasks.filter(t => t.priority === "critical" || t.priority === "high");
  const activeProjects = edProjects.filter(p => p.status === "active" || p.status === "planning");
  const atRiskProjects = edProjects.filter(p => p.risk_level === "high" || p.risk_level === "critical");
  const activeObjectives = objectives.filter(o => o.status === "active" || o.status === "at_risk");
  const recentNotes = [...notes].sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date)).slice(0, 6);
  const personalTasks = (organizer?.tasks || []).filter(t => !t.done);
  const priorities = organizer?.priorities || [];
  const focusToday = organizer?.focus_today || null;

  const activeEmployees = employees.filter(e => e.status === "active");
  const activeVolunteers = volunteers.filter(v => v.status === "active");
  const activeClients = clients.filter(c => c.status === "active" || c.status === "employed");

  const openGrantProjects = grantProjects.filter(p => p.status === "in_progress" || p.status === "planning");
  const upcomingReports = grantReports.filter(r => r.status !== "submitted" && r.status !== "accepted" && r.due_date);

  const activeBudgets = budgets.slice(0, 3);
  const overdueCompass = compassTasks.filter(t => t.status !== "completed" && t.due_date && isPast(parseISO(t.due_date)));
  const upcomingEvents = events.filter(e => e.start_date && !isPast(parseISO(e.start_date))).slice(0, 5);
  const activePrograms = programs.filter(p => p.status === "active").slice(0, 5);

  const pendingInvoices = invoices.filter(i => i.status === "pending" || i.status === "draft").slice(0, 5);

  return `You are the Executive Assistant to ${firstName} (Executive Director of Candora, a non-profit organization). You have FULL visibility into everything happening across the organization. You know them personally and proactively help them stay on top of everything.

Today is ${today}.

=== ED TASKS (${openTasks.length} open, ${urgentTasks.length} urgent) ===
${urgentTasks.slice(0, 8).map(t => `- [${t.priority.toUpperCase()}] ${t.title}${t.due_date ? formatDueLabel(t.due_date) : ""}${t.category ? ` [${t.category}]` : ""}`).join("\n") || "None urgent."}
${openTasks.filter(t => t.priority !== "critical" && t.priority !== "high").slice(0, 6).map(t => `- ${t.title}${t.due_date ? formatDueLabel(t.due_date) : ""}`).join("\n")}

=== ED PROJECTS (${activeProjects.length} active, ${atRiskProjects.length} at risk) ===
${activeProjects.slice(0, 8).map(p => `- ${p.name} (${p.progress_percent || 0}% — risk: ${p.risk_level || "low"})${p.end_date ? ` — due ${format(parseISO(p.end_date), "MMM d")}` : ""}${p.description ? ` | ${p.description.slice(0, 60)}` : ""}`).join("\n") || "No active projects."}

=== STRATEGIC OBJECTIVES / OPSP (${activeObjectives.length}) ===
${activeObjectives.slice(0, 6).map(o => `- ${o.title} (${o.progress_percent || 0}% — ${o.quarter || "ongoing"}) [${o.status}]`).join("\n") || "No active objectives."}

=== KPIs (${kpis.length} tracked) ===
${kpis.slice(0, 8).map(k => `- ${k.name}: ${k.current_value ?? "?"} / ${k.target_value ?? "?"} ${k.unit || ""} [${k.trend || "flat"}] (${k.category})`).join("\n") || "No KPIs tracked."}

=== BUDGETS (${budgets.length} total) ===
${activeBudgets.map(b => `- ${b.name} FY${b.fiscal_year || "?"}: $${(b.total_amount || 0).toLocaleString()} total${b.categories?.length ? `, ${b.categories.length} categories` : ""}`).join("\n") || "No budgets on record."}

=== GRANTS & FUNDING PROJECTS (${openGrantProjects.length} open) ===
${openGrantProjects.slice(0, 6).map(p => `- ${p.name} [${p.status}]${p.budget ? ` — $${p.budget.toLocaleString()}` : ""}`).join("\n") || "No open grant projects."}
${upcomingReports.length > 0 ? `\nUPCOMING GRANT REPORTS DUE:\n${upcomingReports.slice(0, 4).map(r => `- ${r.title}${r.due_date ? formatDueLabel(r.due_date) : ""} [${r.status}]`).join("\n")}` : ""}

=== STAFF (${activeEmployees.length} active employees) ===
${activeEmployees.slice(0, 6).map(e => `- ${e.first_name} ${e.last_name} — ${e.position} (${e.department})`).join("\n") || "No employee records."}

=== VOLUNTEERS (${activeVolunteers.length} active) ===
${activeVolunteers.slice(0, 5).map(v => `- ${v.first_name} ${v.last_name}${v.position ? ` — ${v.position}` : ""}`).join("\n") || "No volunteer records."}

=== PATHWAYS CLIENTS (${activeClients.length} active) ===
${activeClients.length > 0 ? `${activeClients.length} active clients in the Pathways employment program.` : "No active clients."}
${overdueCompass.length > 0 ? `\n⚠️ ${overdueCompass.length} overdue Compass tasks need attention.` : ""}

=== EVENTS & PROGRAMS ===
Upcoming Events: ${upcomingEvents.length > 0 ? upcomingEvents.map(e => `${e.name || e.title}${e.start_date ? ` (${format(parseISO(e.start_date), "MMM d")})` : ""}`).join(", ") : "None scheduled."}
Active Programs: ${activePrograms.length > 0 ? activePrograms.map(p => p.name || p.title).join(", ") : "None."}

=== MARKETING & CAMPAIGNS ===
${marketingCampaigns.filter(c => c.status === "active").slice(0, 4).map(c => `- ${c.name} [${c.status}]${c.budget ? ` — $${c.budget.toLocaleString()}` : ""}`).join("\n") || "No active campaigns."}

=== INVOICES / BILLING (${pendingInvoices.length} pending) ===
${pendingInvoices.map(i => `- ${i.title || i.invoice_number || "Invoice"} — $${(i.total_amount || 0).toLocaleString()} [${i.status}]`).join("\n") || "No pending invoices."}

=== ANNOUNCEMENTS (${announcements.filter(a => a.is_active).length} active) ===
${announcements.filter(a => a.is_active).slice(0, 3).map(a => `- "${a.title}" — ${a.message?.slice(0, 80) || ""}`).join("\n") || "No active announcements."}

=== TODAY'S FOCUS ===
${focusToday || "Not set yet today."}

=== PERSONAL PRIORITIES ===
${priorities.slice(0, 6).map(p => `- ${p.title}${p.due_date ? formatDueLabel(p.due_date) : ""}${p.tasks?.filter(t=>!t.done).length ? ` (${p.tasks.filter(t=>!t.done).length} open sub-tasks)` : ""}`).join("\n") || "None set."}

=== PERSONAL TO-DOs ===
${personalTasks.slice(0, 8).map(t => `- ${t.text}`).join("\n") || "None."}

=== RECENT NOTES ===
${recentNotes.slice(0, 5).map(n => `- "${n.title}"${n.note_type ? ` [${n.note_type}]` : ""}${n.content ? `: ${n.content.slice(0, 80)}` : ""}`).join("\n") || "None."}

=== PORTAL NAVIGATION (what you can access) ===
- /ed — Executive Assistant Dashboard (here)
- /ed/tasks — Your ED Tasks
- /ed/projects — ED Projects
- /ed/opsp — Objectives / Strategic Plan
- /ed/kpis — KPI Tracker
- /ed/budgets — Budget Management
- /ed/org — Org Chart
- /ed/notes — Notes
- /nexushr — Staff HR Portal (employees, reviews, onboarding, etc.)
- /volunteermgr — Volunteer Manager
- /pathways — Pathways Client Portal
- /grants — Grants & Proposals
- /marketing — Marketing & Fundraising
- /eventsmgr — Events, Projects & Programs
- /filemanager — File Manager

=== YOUR ROLE & RESPONSIBILITIES ===
Executive Director of Candora — a non-profit organization. Responsibilities: strategic leadership, board governance, program oversight, fundraising & grants management, financial stewardship, staff & volunteer leadership, stakeholder engagement, community partnerships, organizational development.

=== HOW YOU SHOULD BEHAVE ===
- Be warm, professional, and proactive — like a real EA who truly knows their boss
- Reference specific data you see above when offering help ("I see you have 3 overdue grant reports...")
- Proactively offer to draft emails, prepare briefings, build agendas, summarize status, flag risks
- Keep responses conversational and concise unless asked to draft something (then be complete)
- Use their first name (${firstName}) naturally
- When they mention a topic, connect it to the relevant data you see
- If asked about any part of the organization, give them a real, data-grounded answer`;
}

const PROACTIVE_PROMPTS = [
  "What should I focus on today?",
  "Anything urgent I should know about?",
  "Help me draft a quick status update",
  "Prepare me for my week ahead",
  "What tasks are overdue or at risk?",
];

const STORAGE_KEY = "ea_assistant_messages_v1";
const BACKUP_KEY = "ea_assistant_messages_backup_v1";
const MEMORY_KEY = "ea_assistant_memory_v1";

export default function EAAssistantWidget() {
  const { user } = useAuth();
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [memory, setMemory] = useState(() => {
    try { return localStorage.getItem(MEMORY_KEY) || ""; } catch { return ""; }
  });
  const [memoryDraft, setMemoryDraft] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // EA Portal data
  const { data: tasks = [] } = useQuery({ queryKey: ["ed-tasks"], queryFn: () => base44.entities.EDTask.list() });
  const { data: edProjects = [] } = useQuery({ queryKey: ["ed-projects"], queryFn: () => base44.entities.EDProject.list() });
  const { data: objectives = [] } = useQuery({ queryKey: ["ed-objectives"], queryFn: () => base44.entities.EDObjective.list() });
  const { data: notes = [] } = useQuery({ queryKey: ["ed-notes"], queryFn: () => base44.entities.EDNote.list() });
  const { data: kpis = [] } = useQuery({ queryKey: ["ed-kpis"], queryFn: () => base44.entities.EDKPI.list() });
  const { data: budgets = [] } = useQuery({ queryKey: ["ed-budgets"], queryFn: () => base44.entities.EDBudget.list() });
  const { data: organizer } = useQuery({
    queryKey: ["organizer", user?.email],
    queryFn: () => base44.entities.PersonalOrganizer.filter({ user_email: user?.email }).then(d => d[0]),
    enabled: !!user?.email,
  });
  // Org-wide data
  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: () => base44.entities.Employee.list() });
  const { data: volunteers = [] } = useQuery({ queryKey: ["volunteers"], queryFn: () => base44.entities.Volunteer.list() });
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list() });
  const { data: grantProjects = [] } = useQuery({ queryKey: ["grant-projects"], queryFn: () => base44.entities.Project.list() });
  const { data: grantReports = [] } = useQuery({ queryKey: ["grant-reports"], queryFn: () => base44.entities.Report.list() });
  const { data: compassTasks = [] } = useQuery({ queryKey: ["compass-tasks"], queryFn: () => base44.entities.CompassTask.list() });
  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: () => base44.entities.Event.list() });
  const { data: programs = [] } = useQuery({ queryKey: ["programs"], queryFn: () => base44.entities.Program.list() });
  const { data: marketingCampaigns = [] } = useQuery({ queryKey: ["marketing-campaigns"], queryFn: () => base44.entities.MarketingCampaign.list() });
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices"], queryFn: () => base44.entities.Invoice.list() });
  const { data: announcements = [] } = useQuery({ queryKey: ["announcements"], queryFn: () => base44.entities.Announcement.list() });

  const firstName = user?.full_name?.split(" ")[0] || "Director";

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initial greeting only if there are no existing messages
  useEffect(() => {
    if (initialized || !user || tasks === undefined) return;
    setInitialized(true);
    if (messages.length > 0) return; // already have a conversation — don't overwrite

    const openTasks = tasks.filter(t => t.status !== "completed" && t.status !== "cancelled");
    const urgentCount = openTasks.filter(t => t.priority === "critical" || t.priority === "high").length;
    const activeProjects = edProjects.filter(p => p.status === "active" || p.status === "planning");

    const g = greeting();
    const h = new Date().getHours();
    const timeNote = h < 10 ? "Early start today!" : h > 17 ? "Working late?" : "";

    let brief = `${g}, ${firstName}! ${timeNote ? timeNote + " " : ""}I've reviewed your workload and here's where things stand:\n\n`;

    if (urgentCount > 0) brief += `🔴 **${urgentCount} urgent/high-priority task${urgentCount > 1 ? "s" : ""}** need your attention\n`;
    if (activeProjects.length > 0) brief += `📁 **${activeProjects.length} active project${activeProjects.length > 1 ? "s" : ""}** in flight\n`;

    const atRisk = edProjects.filter(p => p.risk_level === "high" || p.risk_level === "critical");
    if (atRisk.length > 0) brief += `⚠️ **${atRisk.length} project${atRisk.length > 1 ? "s" : ""}** flagged as high/critical risk\n`;

    const overdueReports = grantReports.filter(r => r.status !== "submitted" && r.status !== "accepted" && r.due_date && isPast(parseISO(r.due_date)));
    if (overdueReports.length > 0) brief += `📋 **${overdueReports.length} overdue grant report${overdueReports.length > 1 ? "s" : ""}** need attention\n`;

    const overdueCompassCount = compassTasks.filter(t => t.status !== "completed" && t.due_date && isPast(parseISO(t.due_date))).length;
    if (overdueCompassCount > 0) brief += `🧭 **${overdueCompassCount} overdue Compass task${overdueCompassCount > 1 ? "s" : ""}** in Pathways\n`;

    const pendingInvoiceCount = invoices.filter(i => i.status === "pending" || i.status === "draft").length;
    if (pendingInvoiceCount > 0) brief += `💰 **${pendingInvoiceCount} pending invoice${pendingInvoiceCount > 1 ? "s" : ""}** to review\n`;

    const focusToday = organizer?.focus_today;
    const focusDate = organizer?.focus_date;
    const isTodayFocus = focusDate === format(new Date(), "yyyy-MM-dd");
    if (focusToday && isTodayFocus) brief += `🎯 **Today's focus:** ${focusToday}\n`;

    const priorities = (organizer?.priorities || []).filter(p => p.due_date && !isPast(parseISO(p.due_date)));
    if (priorities.length > 0) {
      const next = priorities.sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];
      brief += `⏰ **Coming up:** ${next.title}${formatDueLabel(next.due_date)}\n`;
    }

    brief += `\nWhat would you like to tackle first? I'm here to help you get through the day.`;

    setMessages([{ role: "assistant", content: brief }]);
  }, [user, tasks, edProjects, objectives, organizer, grantReports, compassTasks, invoices, initialized]);

  const systemContext = buildContext({
    user, tasks, edProjects, objectives, notes, organizer,
    kpis, budgets, grantProjects, grantReports,
    employees, volunteers, clients, compassTasks,
    events, programs, marketingCampaigns, invoices, announcements,
  });

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setLoading(true);

    const history = newMessages.slice(-12); // last 12 messages for context
    const conversationText = history
      .map(m => `${m.role === "user" ? firstName : "Assistant"}: ${m.content}`)
      .join("\n\n");

    const savedMemory = (() => { try { return localStorage.getItem(MEMORY_KEY) || ""; } catch { return ""; } })();

    const prompt = `${systemContext}
${savedMemory ? `\n=== PERMANENT MEMORY (key context Graham has provided — always keep this in mind) ===\n${savedMemory}\n` : ""}
=== CONVERSATION HISTORY ===
${conversationText}

Now respond as the Executive Assistant. Be helpful, warm, and specific. Use markdown for formatting when appropriate.`;

    const response = await base44.integrations.Core.InvokeLLM({ prompt, model: "claude_sonnet_4_6" });
    const reply = typeof response === "string" ? response : response?.text || "I'm here — what do you need?";
    setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetConversation = () => {
    try {
      const current = localStorage.getItem(STORAGE_KEY);
      if (current) { localStorage.setItem(BACKUP_KEY, current); setHasBackup(true); }
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setInitialized(false);
    setMessages([]);
  };

  const restoreConversation = () => {
    try {
      const backup = localStorage.getItem(BACKUP_KEY);
      if (!backup) return;
      const parsed = JSON.parse(backup);
      localStorage.setItem(STORAGE_KEY, backup);
      setMessages(parsed);
      setInitialized(true);
    } catch {}
  };

  const [hasBackup, setHasBackup] = useState(() => {
    try { return !!localStorage.getItem(BACKUP_KEY); } catch { return false; }
  });

  return (
    <div className="flex flex-col rounded-2xl border shadow-lg overflow-hidden" style={{ background: "hsl(230,70%,9%)", borderColor: "hsl(230,50%,18%)" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        style={{ background: "hsl(230,70%,12%)", borderBottom: "1px solid hsl(230,50%,18%)" }}
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, hsl(45,92%,53%), hsl(35,95%,60%))" }}>
            <Sparkles className="w-4 h-4" style={{ color: "hsl(230,70%,10%)" }} />
          </div>
          <div>
            <p className="text-sm font-bold leading-none" style={{ color: "hsl(45,92%,53%)" }}>Executive Assistant</p>
            <p className="text-[10px] mt-0.5" style={{ color: "hsl(230,30%,60%)" }}>Your personal AI assistant</p>
          </div>
          {loading && (
            <div className="flex items-center gap-1 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); resetConversation(); }}
            className="p-1.5 rounded-lg transition-colors hover:opacity-70"
            style={{ color: "hsl(230,30%,60%)" }}
            title="Reset conversation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {collapsed ? <ChevronDown className="w-4 h-4" style={{ color: "hsl(45,60%,75%)" }} /> : <ChevronUp className="w-4 h-4" style={{ color: "hsl(45,60%,75%)" }} />}
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Permanent Memory Panel */}
          <div style={{ borderBottom: "1px solid hsl(230,50%,18%)" }}>
            <button
              className="w-full flex items-center justify-between px-4 py-2 text-xs transition-colors hover:opacity-80"
              style={{ background: "hsl(230,65%,11%)", color: "hsl(45,70%,70%)" }}
              onClick={() => { setMemoryOpen(o => !o); if (!memoryOpen) setMemoryDraft(memory); }}
            >
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span className="font-semibold">Permanent Memory</span>
                {memory && <span className="px-1.5 py-0.5 rounded-full text-[10px]" style={{ background: "hsl(45,92%,53%)", color: "hsl(230,70%,10%)" }}>Active</span>}
              </span>
              <span style={{ color: "hsl(230,30%,55%)" }}>{memoryOpen ? "▲ close" : "▼ edit"}</span>
            </button>
            {memoryOpen && (
              <div className="px-4 py-3 space-y-2" style={{ background: "hsl(230,65%,10%)" }}>
                <p className="text-xs" style={{ color: "hsl(230,30%,60%)" }}>
                  Anything written here is <strong style={{ color: "hsl(45,70%,75%)" }}>always remembered</strong> across every conversation — even after a reset. Use this to capture key context about yourself, Candora, your priorities, relationships, history, etc.
                </p>
                <textarea
                  value={memoryDraft}
                  onChange={e => setMemoryDraft(e.target.value)}
                  placeholder="e.g. I am the Executive Director of Candora, a non-profit in Edmonton. Our fiscal year ends March 31. Key priorities this year are... My board chair is... We are currently navigating..."
                  rows={6}
                  className="w-full resize-y rounded-lg px-3 py-2 text-xs outline-none"
                  style={{ background: "hsl(230,55%,14%)", border: "1px solid hsl(230,45%,22%)", color: "hsl(45,50%,90%)" }}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setMemoryOpen(false)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors hover:opacity-70"
                    style={{ color: "hsl(230,30%,60%)" }}
                  >
                    <X className="w-3 h-3" /> Cancel
                  </button>
                  <button
                    onClick={() => {
                      try { localStorage.setItem(MEMORY_KEY, memoryDraft); } catch {}
                      setMemory(memoryDraft);
                      setMemoryOpen(false);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-80"
                    style={{ background: "hsl(45,92%,53%)", color: "hsl(230,70%,10%)" }}
                  >
                    <Check className="w-3 h-3" /> Save Memory
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: 300, maxHeight: 480 }}>
            {messages.length === 0 && hasBackup && (
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <p className="text-xs text-center" style={{ color: "hsl(230,30%,60%)" }}>Your previous conversation was cleared.</p>
                <button
                  onClick={restoreConversation}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors hover:opacity-80"
                  style={{ background: "hsl(45,92%,53%)", color: "hsl(230,70%,10%)" }}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restore Previous Conversation
                </button>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full shrink-0 mr-2 mt-0.5 flex items-center justify-center" style={{ background: "hsl(45,92%,53%)" }}>
                    <Sparkles className="w-3 h-3" style={{ color: "hsl(230,70%,10%)" }} />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                  style={m.role === "user"
                    ? { background: "hsl(45,92%,53%)", color: "hsl(230,70%,10%)" }
                    : { background: "hsl(230,55%,16%)", color: "hsl(45,50%,92%)" }
                  }
                >
                  {m.role === "assistant"
                    ? <ReactMarkdown className="prose prose-sm prose-invert max-w-none [&_p]:mb-1.5 [&_ul]:mb-1.5 [&_li]:mb-0.5 [&_strong]:text-amber-300">{m.content}</ReactMarkdown>
                    : <p>{m.content}</p>
                  }
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full shrink-0 mr-2 flex items-center justify-center" style={{ background: "hsl(45,92%,53%)" }}>
                  <Sparkles className="w-3 h-3" style={{ color: "hsl(230,70%,10%)" }} />
                </div>
                <div className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ background: "hsl(230,55%,16%)" }}>
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-amber-400/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-amber-400/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          <div className="px-4 pb-2 flex gap-1.5 flex-wrap" style={{ borderTop: "1px solid hsl(230,50%,18%)", paddingTop: "10px" }}>
            {PROACTIVE_PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                disabled={loading}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors disabled:opacity-40 hover:opacity-80"
                style={{ background: "hsl(230,55%,18%)", color: "hsl(45,70%,80%)", border: "1px solid hsl(230,45%,24%)" }}
              >
                <Lightbulb className="w-3 h-3" />
                {p}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 pb-4 pt-2">
            <div className="flex gap-2 items-end rounded-xl px-3 py-2" style={{ background: "hsl(230,55%,14%)", border: "1px solid hsl(230,45%,22%)" }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything or tell me what you need..."
                rows={1}
                className="flex-1 resize-none bg-transparent outline-none text-sm leading-relaxed"
                style={{ color: "hsl(45,50%,90%)", maxHeight: 100 }}
                disabled={loading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all disabled:opacity-30 hover:opacity-80"
                style={{ background: "hsl(45,92%,53%)" }}
              >
                <Send className="w-3.5 h-3.5" style={{ color: "hsl(230,70%,10%)" }} />
              </button>
            </div>
            <p className="text-[10px] text-center mt-1.5" style={{ color: "hsl(230,25%,45%)" }}>Press Enter to send · Shift+Enter for new line</p>
          </div>
        </>
      )}
    </div>
  );
}