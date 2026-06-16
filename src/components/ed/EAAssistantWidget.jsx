import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { format, isToday, isTomorrow, parseISO, isPast } from "date-fns";
import ReactMarkdown from "react-markdown";
import { Send, Sparkles, ChevronDown, ChevronUp, Lightbulb, RefreshCw } from "lucide-react";

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

function buildContext({ user, tasks, projects, objectives, notes, organizer }) {
  const firstName = user?.full_name?.split(" ")[0] || "Director";
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  const openTasks = tasks.filter(t => t.status !== "completed" && t.status !== "cancelled");
  const urgentTasks = openTasks.filter(t => t.priority === "critical" || t.priority === "high");
  const activeProjects = projects.filter(p => p.status === "active" || p.status === "planning");
  const activeObjectives = objectives.filter(o => o.status === "active" || o.status === "at_risk");
  const recentNotes = [...notes].sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date)).slice(0, 6);
  const personalTasks = (organizer?.tasks || []).filter(t => !t.done);
  const priorities = organizer?.priorities || [];
  const focusToday = organizer?.focus_today || null;

  return `You are the Executive Assistant to ${firstName} (Executive Director of Candora, a non-profit organization). You know them personally, understand their role and responsibilities deeply, and proactively help them stay on top of their work.

Today is ${today}.

=== THEIR OPEN TASKS (${openTasks.length} total, ${urgentTasks.length} urgent) ===
${urgentTasks.slice(0, 8).map(t => `- [${t.priority.toUpperCase()}] ${t.title}${t.due_date ? formatDueLabel(t.due_date) : ""}${t.category ? ` [${t.category}]` : ""}`).join("\n") || "None urgent right now."}
${openTasks.filter(t => t.priority !== "critical" && t.priority !== "high").slice(0, 5).map(t => `- ${t.title}${t.due_date ? formatDueLabel(t.due_date) : ""}`).join("\n")}

=== ACTIVE PROJECTS (${activeProjects.length}) ===
${activeProjects.slice(0, 6).map(p => `- ${p.name} (${p.progress_percent || 0}% complete, risk: ${p.risk_level || "low"})${p.end_date ? ` — due ${format(parseISO(p.end_date), "MMM d")}` : ""}`).join("\n") || "No active projects."}

=== STRATEGIC OBJECTIVES (${activeObjectives.length}) ===
${activeObjectives.slice(0, 5).map(o => `- ${o.title} (${o.progress_percent || 0}% — ${o.quarter || "ongoing"})`).join("\n") || "No active objectives on record."}

=== TODAY'S FOCUS ===
${focusToday || "Not set yet today."}

=== PERSONAL PRIORITIES ===
${priorities.slice(0, 5).map(p => `- ${p.title}${p.due_date ? formatDueLabel(p.due_date) : ""}${p.tasks?.filter(t=>!t.done).length ? ` (${p.tasks.filter(t=>!t.done).length} open sub-tasks)` : ""}`).join("\n") || "None set."}

=== PERSONAL TO-DOs ===
${personalTasks.slice(0, 8).map(t => `- ${t.text}`).join("\n") || "None."}

=== RECENT NOTES ===
${recentNotes.slice(0, 4).map(n => `- "${n.title}"${n.note_type ? ` [${n.note_type}]` : ""}`).join("\n") || "None."}

=== YOUR ROLE & RESPONSIBILITIES ===
You are the Executive Director of Candora, a non-profit organization. Your responsibilities include: strategic leadership, board relations, program oversight, fundraising & grants, financial stewardship, staff management, stakeholder engagement, and community partnerships.

=== HOW YOU SHOULD BEHAVE ===
- Be warm, professional, and proactive — like a real EA who truly knows them
- Offer specific, actionable help based on what you see in their data
- When they first open this widget each session, give a brief contextual briefing (urgent items, what needs attention today)
- Proactively ask if you can help draft emails, prepare for meetings, summarize projects, create agenda items, etc.
- Keep responses concise but rich — this is a conversation, not a report
- Use their first name (${firstName}) naturally
- If they ask you to draft something, draft it fully and completely`;
}

const PROACTIVE_PROMPTS = [
  "What should I focus on today?",
  "Anything urgent I should know about?",
  "Help me draft a quick status update",
  "Prepare me for my week ahead",
  "What tasks are overdue or at risk?",
];

export default function EAAssistantWidget() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load all context data
  const { data: tasks = [] } = useQuery({ queryKey: ["ed-tasks"], queryFn: () => base44.entities.EDTask.list() });
  const { data: projects = [] } = useQuery({ queryKey: ["ed-projects"], queryFn: () => base44.entities.EDProject.list() });
  const { data: objectives = [] } = useQuery({ queryKey: ["ed-objectives"], queryFn: () => base44.entities.EDObjective.list() });
  const { data: notes = [] } = useQuery({ queryKey: ["ed-notes"], queryFn: () => base44.entities.EDNote.list() });
  const { data: organizer } = useQuery({
    queryKey: ["organizer", user?.email],
    queryFn: () => base44.entities.PersonalOrganizer.filter({ user_email: user?.email }).then(d => d[0]),
    enabled: !!user?.email,
  });

  const firstName = user?.full_name?.split(" ")[0] || "Director";

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initial greeting once data is loaded
  useEffect(() => {
    if (initialized || !user || tasks === undefined) return;
    setInitialized(true);

    const openTasks = tasks.filter(t => t.status !== "completed" && t.status !== "cancelled");
    const urgentCount = openTasks.filter(t => t.priority === "critical" || t.priority === "high").length;
    const activeProjects = projects.filter(p => p.status === "active" || p.status === "planning");

    const g = greeting();
    const h = new Date().getHours();
    const timeNote = h < 10 ? "Early start today!" : h > 17 ? "Working late?" : "";

    let brief = `${g}, ${firstName}! ${timeNote ? timeNote + " " : ""}I've reviewed your workload and here's where things stand:\n\n`;

    if (urgentCount > 0) brief += `🔴 **${urgentCount} urgent/high-priority task${urgentCount > 1 ? "s" : ""}** need your attention\n`;
    if (activeProjects.length > 0) brief += `📁 **${activeProjects.length} active project${activeProjects.length > 1 ? "s" : ""}** in flight\n`;

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
  }, [user, tasks, projects, objectives, organizer, initialized]);

  const systemContext = buildContext({ user, tasks, projects, objectives, notes, organizer });

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

    const prompt = `${systemContext}

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
    setInitialized(false);
    setMessages([]);
  };

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
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: 300, maxHeight: 480 }}>
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