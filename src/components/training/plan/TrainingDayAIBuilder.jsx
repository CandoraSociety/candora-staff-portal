import { useState } from "react";
import { Sparkles, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { MODULE_OPTIONS, MODULE_MINUTES, toMinutes } from "@/lib/training/planTimeline";

const inputCls = "w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30";

const MODULE_LIST = MODULE_OPTIONS
  .map(m => `- ${m.key} — ${m.label} (typically ${MODULE_MINUTES[m.key] || 30} min)`)
  .join("\n");

// Drafts a training day with the assistant. Works two ways: with no `plan` it
// creates a new saved day; with a `plan` it rewrites that day's agenda in place
// (the editor then shows the draft for review before saving).
export default function TrainingDayAIBuilder({ open, onClose, onCreated, plan, onGenerated }) {
  const [form, setForm] = useState({
    audience_type: plan?.audience_type || "group",
    audience: plan?.audience || "",
    plan_date: plan?.plan_date || "",
    doors: "09:30",
    hard_start: "10:00",
    finish: "16:30",
    focus: "",
    afternoon: "Practice everything covered in Test Mode, then real client work — getting new clients onto our lists and into the system — then time improving the portals themselves.",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const set = (patch) => setForm(f => ({ ...f, ...patch }));
  const isEditing = !!plan;

  const generate = async () => {
    setBusy(true);
    setError("");
    const settle = Math.max(0, toMinutes(form.hard_start) - toMinutes(form.doors));
    const window = Math.max(60, toMinutes(form.finish) - toMinutes(form.hard_start));
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are helping a facilitator at Candora, a community services non-profit, plan a live in-room training day for the Candora Staff Portal app.

Audience: ${form.audience_type === "individual" ? "one individual" : "a team"}${form.audience ? ` — ${form.audience}` : ""}
Facilitator's priorities: ${form.focus || "general onboarding to the app, then real work with clients"}
How the afternoon should run: ${form.afternoon}

Room rules you must follow:
- The day begins with a ${settle}-minute arrival block. The facilitator adds that block themselves, so DO NOT include an arrival block — start your first block at the hard start.
- Content starts at ${form.hard_start} exactly and the room has ${window} minutes from that moment to ${form.finish}, including breaks, lunch and the whole afternoon.
- All taught content except at most ONE block must finish before lunch. One carry-over block straight after lunch is allowed.
- Put the teaching blocks in the morning in this order: orientation, main page, then the audience's own program modules, longest and most important modules before lunch.
- Include a 45-minute lunch and two 15-minute breaks if the window is 4 hours or more.
- The afternoon after the carry-over block must be: a practice block in the app's Test Mode (no new content, 40-50 minutes), then a live-work block (real client work — e.g. getting new clients onto waiting lists and into the system), then an improvements block (fixing access, logging change requests for the app), then a short wrap.
- Blocks must add up to no more than ${window} minutes.

Available training modules (key — title — typical length):
${MODULE_LIST}

Rules for the fields:
- Every block has a whole-number "minutes". Session blocks that teach name exactly one "module_key" from the list, close to that module's typical length. Practice, live-work and improvement blocks use type "session" with an EMPTY module_key and a descriptive title. Admin and break blocks use type "admin" or "break" with an empty module_key.
- "activities" (2-5 per block) are concrete instructions of what each attendee does — in Test Mode for practice, with real records for live work. Name the app's real screens, buttons and records (Intake, the duplicate matcher, the Master List, Program Progress, Quick Files, Database). Never write generic things like "explore the module".
- "cue" is the single correction or emphasis the facilitator says out loud in that block (one sentence).
- "why" is one sentence on why this block sits here in the sequence.
- "summary": one or two sentences describing the shape of the day, naming the hard start and what the afternoon is for.
- "outcomes": 4-6 things attendees can do by the end, including something they finished with real client data.
- "setup": 2-4 room/projector/Test Mode preparation items, noting that live work needs Test Mode off.
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

      const arrival = settle > 0 ? [{
        type: "admin",
        title: "Arrival, settle, sign-in, Test Mode check",
        minutes: settle,
        module_key: "",
        why: `The settle time before the ${form.hard_start} hard start — coffee, screens and pairing up, no content.`,
        cue: `Say the hard start out loud five minutes before it, then begin at ${form.hard_start}.`,
        activities: [
          "Everyone signed in and looking at their own Main Page.",
          "Test Mode ribbon visible on every screen — walk the room and check.",
          "Pair each less-confident user with someone from their own team.",
        ],
      }] : [];

      const built = {
        blocks: [...arrival, ...(result.blocks || []).map(b => ({ ...b, minutes: Number(b.minutes) || 0 }))],
        start_time: form.doors,
        summary: result.summary || "",
        outcomes: result.outcomes || [],
        setup: result.setup || [],
        follow_up: result.follow_up || [],
        audience_type: form.audience_type,
        audience: form.audience,
        plan_date: form.plan_date,
      };

      if (isEditing) {
        onGenerated(built);
      } else {
        const created = await base44.entities.TrainingDayPlan.create({
          title: result.title || "Training day",
          ...built,
        });
        onCreated(created);
      }
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
            <h2 className="text-lg font-bold mt-1">{isEditing ? "Rebuild this agenda" : "Build a training day"}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isEditing
                ? "The draft replaces the blocks, summary, outcomes, setup and follow-up below — review it, then save. Your title, date and audience stay."
                : "Give it the audience, the times and what the afternoon is for; it drafts the agenda, timings, activities and follow-up list. Everything stays editable."}
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
            <label className="text-xs font-semibold">Doors open / settle</label>
            <input type="time" value={form.doors} onChange={(e) => set({ doors: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold">Hard start</label>
            <input type="time" value={form.hard_start} onChange={(e) => set({ hard_start: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold">Finish by</label>
            <input type="time" value={form.finish} onChange={(e) => set({ finish: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold">Date</label>
            <input type="date" value={form.plan_date} onChange={(e) => set({ plan_date: e.target.value })} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold">What matters most in the morning</label>
            <textarea
              value={form.focus}
              onChange={(e) => set({ focus: e.target.value })}
              rows={2}
              placeholder="Introduce the app, all Pathways case management needed before touching a live file."
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold">What the afternoon is for</label>
            <textarea
              value={form.afternoon}
              onChange={(e) => set({ afternoon: e.target.value })}
              rows={3}
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
            {busy ? "Drafting the day…" : isEditing ? "Rebuild the agenda" : "Draft the day"}
          </button>
        </div>
      </div>
    </div>
  );
}