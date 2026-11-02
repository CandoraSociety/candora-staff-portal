import { useState } from "react";
import { Sparkles, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { MODULE_OPTIONS, MODULE_MINUTES } from "@/lib/training/planTimeline";

const inputCls = "w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30";

const MODULE_LIST = MODULE_OPTIONS
  .map(m => `- ${m.key} — ${m.label} (typically ${MODULE_MINUTES[m.key] || 30} min)`)
  .join("\n");

// Drafts a whole training day with the assistant: audience, date, hours and the
// facilitator's priorities in; a saved plan out. The generated plan is a normal
// editable plan afterwards — nothing about it is locked.
export default function TrainingDayAIBuilder({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    audience_type: "group",
    audience: "",
    plan_date: "",
    start_time: "09:00",
    hours: 6.5,
    focus: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const set = (patch) => setForm(f => ({ ...f, ...patch }));

  const generate = async () => {
    setBusy(true);
    setError("");
    const totalMinutes = Math.round(Number(form.hours) * 60);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are helping a facilitator at Candora, a community services non-profit, plan a live in-room training day for the Candora Staff Portal app.

Audience: ${form.audience_type === "individual" ? "one individual" : "a team"}${form.audience ? ` — ${form.audience}` : ""}
Start time: ${form.start_time}
Total time available: ${totalMinutes} minutes (blocks must add up to no more than this)
Facilitator's priorities: ${form.focus || "general onboarding to the app"}

Available training modules (key — title — typical length):
${MODULE_LIST}

Rules:
- Build the day in order: arrival/admin, then foundation modules, then the audience's own program modules, then shared tools, then a short wrap-up admin block.
- For a day of 4 hours or more, include a 45-minute lunch and two 15-minute breaks; shorter sessions get one break only.
- Every block has a whole-number "minutes". Session blocks name exactly one "module_key" from the list above and set their minutes close to that module's typical length.
- Admin and break blocks use type "admin" or "break" and leave module_key empty.
- "activities" (2-4 per non-break block) are concrete instructions of what each attendee does in the app's Test Mode sandbox — name the real screens, buttons and records (e.g. "Press Assess on a client in Awaiting Assessment and record two barriers with action steps"). Never write generic things like "explore the module".
- "cue" is the single correction or emphasis the facilitator says out loud in that block (one sentence).
- "why" is one sentence on why this block sits here in the sequence.
- "summary" is one short paragraph describing the shape of the day.
- "outcomes": 4-6 things attendees can do by the end. "setup": 2-3 room/projector/Test Mode preparation items.
- "follow_up": modules that did not fit in the room, each with who needs it and why.
Return JSON only.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            summary: { type: "string" },
            outcomes: { type: "array", items: { type: "string" } },
            setup: { type: "array", items: { type: "string" } },
            blocks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["session", "admin", "break"] },
                  title: { type: "string" },
                  minutes: { type: "number" },
                  module_key: { type: "string" },
                  why: { type: "string" },
                  cue: { type: "string" },
                  activities: { type: "array", items: { type: "string" } },
                },
                required: ["type", "title", "minutes"],
              },
            },
            follow_up: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  module_key: { type: "string" },
                  who: { type: "string" },
                  why: { type: "string" },
                },
                required: ["module_key"],
              },
            },
          },
          required: ["title", "blocks"],
        },
      });

      const created = await base44.entities.TrainingDayPlan.create({
        title: result.title || "Training day",
        audience_type: form.audience_type,
        audience: form.audience,
        plan_date: form.plan_date,
        start_time: form.start_time,
        summary: result.summary || "",
        outcomes: result.outcomes || [],
        setup: result.setup || [],
        blocks: (result.blocks || []).map(b => ({ ...b, minutes: Number(b.minutes) || 0 })),
        follow_up: result.follow_up || [],
      });
      onCreated(created);
    } catch (e) {
      setError("The assistant couldn't finish that plan. Try again with a shorter day or fewer priorities.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 overflow-y-auto p-4 sm:p-8">
      <div className="mx-auto max-w-xl bg-card rounded-2xl border shadow-2xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: "hsl(38, 80%, 42%)" }}>
              <Sparkles className="w-3.5 h-3.5" /> Assistant
            </p>
            <h2 className="text-lg font-bold mt-1">Build a training day</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Give it the audience and the time you have; it drafts the agenda, timings, activities and follow-up list. Everything stays editable.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-accent"><X className="w-4 h-4" /></button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold">Plan for</label>
            <select value={form.audience_type} onChange={(e) => set({ audience_type: e.target.value })} className={inputCls}>
              <option value="group">A group / team</option>
              <option value="individual">One person</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold">Who</label>
            <input value={form.audience} onChange={(e) => set({ audience: e.target.value })} placeholder="Pathways crew" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold">Date</label>
            <input type="date" value={form.plan_date} onChange={(e) => set({ plan_date: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold">Start time</label>
            <input type="time" value={form.start_time} onChange={(e) => set({ start_time: e.target.value })} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold">Time available (hours)</label>
            <input type="number" min="1" max="9" step="0.5" value={form.hours} onChange={(e) => set({ hours: e.target.value })} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold">What matters most</label>
            <textarea
              value={form.focus}
              onChange={(e) => set({ focus: e.target.value })}
              rows={3}
              placeholder="Introduce the app, all Pathways case management, the central database; new staff in the room."
              className={inputCls}
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent">Cancel</button>
          <button
            onClick={generate}
            disabled={busy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
            style={{ background: "hsl(45, 92%, 53%)", color: "hsl(230, 70%, 10%)" }}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {busy ? "Drafting the day…" : "Draft the day"}
          </button>
        </div>
      </div>
    </div>
  );
}