import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Target, X } from "lucide-react";
import { format, isToday, isTomorrow, parseISO, isPast } from "date-fns";

const uid = () => Math.random().toString(36).slice(2, 10);
const nowISO = () => new Date().toISOString();

function dueLabel(dateStr) {
  if (!dateStr) return "";
  try {
    const d = parseISO(dateStr);
    if (isPast(d) && !isToday(d)) return "overdue";
    if (isToday(d)) return "today";
    if (isTomorrow(d)) return "tomorrow";
    return format(d, "MMM d");
  } catch { return ""; }
}

const PRIORITY_COLORS = {
  critical: "#ef4444",
  high: "#f59e0b",
  medium: "#60a5fa",
  low: "#6b7280",
};

const Section = ({ icon: Icon, title, count, action }) => (
  <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: "hsl(45,70%,75%)" }}>
      <Icon className="w-3.5 h-3.5" />
      {title}
      {count > 0 && <span style={{ color: "hsl(230,30%,55%)" }}>({count})</span>}
    </span>
    {action}
  </div>
);

export default function EAAssistantTodos({ user, onClose }) {
  const queryClient = useQueryClient();
  const { data: organizer } = useQuery({
    queryKey: ["organizer", user?.email],
    queryFn: () => base44.entities.PersonalOrganizer.filter({ user_email: user?.email }).then(d => d[0]),
    enabled: !!user?.email,
  });

  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState("");
  const [newPriorityDue, setNewPriorityDue] = useState("");
  const [editingFocus, setEditingFocus] = useState(false);
  const [focusDraft, setFocusDraft] = useState("");

  const tasks = organizer?.tasks || [];
  const priorities = organizer?.priorities || [];
  const openTasks = tasks.filter(t => !t.done);
  const doneTasks = tasks.filter(t => t.done);
  const focusToday = organizer?.focus_today;
  const focusIsToday = organizer?.focus_date === format(new Date(), "yyyy-MM-dd");

  const save = async (patch) => {
    if (organizer) await base44.entities.PersonalOrganizer.update(organizer.id, patch);
    else await base44.entities.PersonalOrganizer.create({ user_email: user.email, ...patch });
    queryClient.invalidateQueries({ queryKey: ["organizer", user?.email] });
  };

  const addTask = () => {
    const text = newTask.trim();
    if (!text) return;
    setNewTask("");
    save({ tasks: [...tasks, { id: uid(), text, done: false, created_at: nowISO(), priority_level: "medium" }] });
  };

  const toggleTask = (id) =>
    save({ tasks: tasks.map(t => (t.id === id ? { ...t, done: !t.done } : t)) });

  const addPriority = () => {
    const title = newPriority.trim();
    if (!title) return;
    setNewPriority("");
    setNewPriorityDue("");
    save({ priorities: [...priorities, { id: uid(), title, due_date: newPriorityDue || null, priority_level: "high", tasks: [], created_at: nowISO() }] });
  };

  const removePriority = (id) => save({ priorities: priorities.filter(p => p.id !== id) });

  const togglePriorityTask = (pid, tid) =>
    save({ priorities: priorities.map(p => (p.id === pid ? { ...p, tasks: (p.tasks || []).map(st => (st.id === tid ? { ...st, done: !st.done } : st)) } : p)) });

  const startEditFocus = () => { setFocusDraft(focusIsToday ? focusToday || "" : ""); setEditingFocus(true); };

  const saveFocus = () => {
    const f = focusDraft.trim();
    setEditingFocus(false);
    save({ focus_today: f, focus_date: f ? format(new Date(), "yyyy-MM-dd") : "" });
  };

  return (
    <div className="flex flex-col shrink-0 overflow-y-auto" style={{ width: 260, maxHeight: 620, background: "hsl(230,65%,11%)", borderRight: "1px solid hsl(230,50%,18%)" }}>
      {/* Sidebar header */}
      <div className="flex items-center justify-between px-3 py-2.5 sticky top-0 z-10" style={{ background: "hsl(230,70%,12%)", borderBottom: "1px solid hsl(230,50%,18%)" }}>
        <p className="text-xs font-bold" style={{ color: "hsl(45,92%,53%)" }}>My To-Dos & Priorities</p>
        <button onClick={onClose} className="hover:opacity-70" style={{ color: "hsl(230,30%,60%)" }} title="Hide sidebar">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Today's focus */}
      <Section icon={Target} title="Today's Focus" />
      <div className="px-3">
        {editingFocus ? (
          <div className="space-y-1.5">
            <textarea
              value={focusDraft}
              onChange={e => setFocusDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveFocus(); } }}
              rows={2}
              autoFocus
              className="w-full rounded-lg px-2 py-1.5 text-xs outline-none resize-none"
              style={{ background: "hsl(230,55%,14%)", border: "1px solid hsl(230,45%,22%)", color: "hsl(45,50%,90%)" }}
              placeholder="What's the main thing today?"
            />
            <div className="flex gap-1.5 justify-end">
              <button onClick={() => setEditingFocus(false)} className="text-[10px] hover:opacity-70" style={{ color: "hsl(230,30%,60%)" }}>Cancel</button>
              <button onClick={saveFocus} className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: "hsl(45,92%,53%)", color: "hsl(230,70%,10%)" }}>Save</button>
            </div>
          </div>
        ) : (
          <button onClick={startEditFocus} className="w-full text-left rounded-lg px-2 py-1.5 text-xs hover:opacity-80" style={{ background: "hsl(230,55%,14%)", border: "1px solid hsl(230,45%,22%)", color: focusIsToday && focusToday ? "hsl(45,50%,90%)" : "hsl(230,30%,55%)" }}>
            {focusIsToday && focusToday ? focusToday : "Tap to set today's focus…"}
          </button>
        )}
      </div>

      {/* Priorities */}
      <Section icon={Target} title="Priorities" count={priorities.length} />
      <div className="px-3 space-y-1.5">
        {priorities.length === 0 && (
          <p className="text-[11px] px-1 py-0.5" style={{ color: "hsl(230,30%,55%)" }}>No priorities set yet.</p>
        )}
        {priorities.map(p => {
          const label = dueLabel(p.due_date);
          const openSubs = (p.tasks || []).filter(st => !st.done).length;
          return (
            <div key={p.id} className="rounded-lg px-2 py-1.5" style={{ background: "hsl(230,55%,14%)", border: "1px solid hsl(230,45%,22%)" }}>
              <div className="flex items-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ background: PRIORITY_COLORS[p.priority_level] || PRIORITY_COLORS.high }} />
                <p className="flex-1 text-[11px] font-medium leading-snug" style={{ color: "hsl(45,50%,90%)" }}>{p.title}</p>
                <button onClick={() => removePriority(p.id)} className="shrink-0 hover:opacity-70" style={{ color: "hsl(230,30%,50%)" }} title="Remove priority">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 pl-3">
                {label && (
                  <span className="text-[10px] px-1 rounded" style={{
                    color: label === "overdue" ? "#fca5a5" : "hsl(45,60%,70%)",
                  }}>{label}</span>
                )}
                {openSubs > 0 && <span className="text-[10px]" style={{ color: "hsl(230,30%,55%)" }}>{openSubs} open</span>}
              </div>
              {(p.tasks || []).map(st => (
                <label key={st.id} className="flex items-center gap-1.5 mt-1 pl-3 cursor-pointer">
                  <input type="checkbox" checked={!!st.done} onChange={() => togglePriorityTask(p.id, st.id)} className="accent-amber-400" />
                  <span className={`text-[10px] ${st.done ? "line-through opacity-50" : ""}`} style={{ color: "hsl(230,25%,70%)" }}>{st.text}</span>
                </label>
              ))}
            </div>
          );
        })}
        <div className="space-y-1">
          <input
            value={newPriority}
            onChange={e => setNewPriority(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") addPriority(); }}
            placeholder="Add a priority…"
            className="w-full rounded-lg px-2 py-1.5 text-xs outline-none"
            style={{ background: "hsl(230,55%,14%)", border: "1px solid hsl(230,45%,22%)", color: "hsl(45,50%,90%)" }}
          />
          <div className="flex gap-1.5">
            <input
              type="date"
              value={newPriorityDue}
              onChange={e => setNewPriorityDue(e.target.value)}
              className="flex-1 rounded-lg px-2 py-1 text-[11px] outline-none"
              style={{ background: "hsl(230,55%,14%)", border: "1px solid hsl(230,45%,22%)", color: "hsl(230,25%,70%)" }}
            />
            <button onClick={addPriority} disabled={!newPriority.trim()} className="px-2 rounded-lg disabled:opacity-30 hover:opacity-80" style={{ background: "hsl(45,92%,53%)" }}>
              <Plus className="w-3.5 h-3.5" style={{ color: "hsl(230,70%,10%)" }} />
            </button>
          </div>
        </div>
      </div>

      {/* To-dos */}
      <Section icon={Target} title="To-Dos" count={openTasks.length} />
      <div className="px-3 pb-3 space-y-1">
        {openTasks.length === 0 && (
          <p className="text-[11px] px-1 py-0.5" style={{ color: "hsl(230,30%,55%)" }}>Nothing open — nice work.</p>
        )}
        {openTasks.map(t => (
          <label key={t.id} className="flex items-start gap-1.5 rounded-lg px-1.5 py-1 cursor-pointer hover:opacity-90">
            <input type="checkbox" checked={false} onChange={() => toggleTask(t.id)} className="mt-0.5 accent-amber-400" />
            <span className="flex-1 text-[11px] leading-snug" style={{ color: "hsl(45,50%,88%)" }}>
              {t.text}
              {t.priority_level === "critical" || t.priority_level === "high" ? (
                <span className="ml-1 text-[9px] uppercase font-bold" style={{ color: PRIORITY_COLORS[t.priority_level] }}>· {t.priority_level}</span>
              ) : null}
            </span>
          </label>
        ))}
        {doneTasks.length > 0 && (
          <details>
            <summary className="text-[10px] cursor-pointer select-none" style={{ color: "hsl(230,30%,55%)" }}>{doneTasks.length} done</summary>
            {doneTasks.map(t => (
              <label key={t.id} className="flex items-center gap-1.5 px-1.5 py-0.5 cursor-pointer">
                <input type="checkbox" checked onChange={() => toggleTask(t.id)} className="accent-amber-400" />
                <span className="text-[10px] line-through opacity-50" style={{ color: "hsl(230,25%,60%)" }}>{t.text}</span>
              </label>
            ))}
          </details>
        )}
        <div className="flex gap-1.5">
          <input
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") addTask(); }}
            placeholder="Add a to-do…"
            className="flex-1 rounded-lg px-2 py-1.5 text-xs outline-none"
            style={{ background: "hsl(230,55%,14%)", border: "1px solid hsl(230,45%,22%)", color: "hsl(45,50%,90%)" }}
          />
          <button onClick={addTask} disabled={!newTask.trim()} className="px-2 rounded-lg disabled:opacity-30 hover:opacity-80" style={{ background: "hsl(45,92%,53%)" }}>
            <Plus className="w-3.5 h-3.5" style={{ color: "hsl(230,70%,10%)" }} />
          </button>
        </div>
      </div>
    </div>
  );
}