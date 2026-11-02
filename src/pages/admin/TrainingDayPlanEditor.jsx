import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Save, Printer, Plus, Loader2, CalendarDays, Clock, Users, User, X } from "lucide-react";
import { withTimes, planStats, emptyBlock, stripComputed, MODULE_OPTIONS } from "@/lib/training/planTimeline";
import PlanBlockCard from "@/components/training/plan/PlanBlockCard";
import FacilitatorRunSheet from "@/components/training/FacilitatorRunSheet";

const inputCls = "w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30";

// The editable agenda for one training day. Blocks carry only a length in
// minutes — the timeline derives every start and end time from the plan's start
// time, so changing a duration re-times the rest of the day honestly.
export default function TrainingDayPlanEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [runSheet, setRunSheet] = useState(null);
  const [aiBlock, setAiBlock] = useState(null);

  useEffect(() => {
    base44.entities.TrainingDayPlan.get(id)
      .then(setPlan)
      .catch(() => setNotFound(true));
  }, [id]);

  useEffect(() => {
    document.body.classList.add("trainingday-printing");
    return () => document.body.classList.remove("trainingday-printing");
  }, []);

  if (notFound) {
    return (
      <div className="p-8 text-center">
        <p className="font-semibold">Plan not found</p>
        <button onClick={() => navigate("/admin/training-day")} className="mt-3 text-sm text-primary hover:underline">Back to plans</button>
      </div>
    );
  }

  if (!plan) {
    return <p className="p-8 text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading plan…</p>;
  }

  const { blocks: timedBlocks, endTime } = withTimes(plan);
  const stats = planStats(plan);
  const rawBlocks = plan.blocks || [];

  const patch = (p) => { setPlan(prev => ({ ...prev, ...p })); setDirty(true); };
  const patchBlock = (index, p) => {
    patch({ blocks: rawBlocks.map((b, i) => (i === index ? { ...b, ...p } : b)) });
  };
  const addBlock = (type) => patch({ blocks: [...rawBlocks, emptyBlock(type)] });
  const removeBlock = (index) => patch({ blocks: rawBlocks.filter((_, i) => i !== index) });
  const moveBlock = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= rawBlocks.length) return;
    const next = [...rawBlocks];
    [next[index], next[target]] = [next[target], next[index]];
    patch({ blocks: next });
  };

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.TrainingDayPlan.update(plan.id, {
        title: plan.title,
        audience_type: plan.audience_type || "group",
        audience: plan.audience || "",
        plan_date: plan.plan_date || "",
        start_time: plan.start_time || "09:00",
        summary: plan.summary || "",
        outcomes: (plan.outcomes || []).filter(t => String(t).trim()),
        setup: (plan.setup || []).filter(t => String(t).trim()),
        blocks: stripComputed(rawBlocks),
        follow_up: (plan.follow_up || []).filter(f => f.module_key),
      });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  // Asks the assistant for Test Mode activities that fit this block and plan.
  const suggestActivities = async (index) => {
    const block = timedBlocks[index];
    setAiBlock(index);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are helping a facilitator plan a live in-room session on the Candora Staff Portal app.
Training day: ${plan.title} — audience: ${plan.audience || "staff"}.
This block: "${block.title}"${block.module ? ` teaching the module "${block.module.title}"` : ""}, ${block.minutes} minutes.
Its purpose in the sequence: ${block.why || "not stated"}.

Write what each attendee does in the app's Test Mode sandbox during this block. Use the app's real screens, buttons and records (for example: Intake, the duplicate matcher, the Barrier Identification Tool, Program Progress, the Master List, Quick Files, the central client database). 2-4 activities, each an instruction the facilitator can read out. Also give one "cue": the single correction or emphasis the facilitator should say out loud in this block. No generic advice.`,
        response_json_schema: {
          type: "object",
          properties: {
            activities: { type: "array", items: { type: "string" } },
            cue: { type: "string" },
          },
          required: ["activities"],
        },
      });
      patchBlock(index, {
        activities: result.activities || timedBlocks[index].activities || [],
        cue: result.cue || timedBlocks[index].cue || "",
      });
    } finally {
      setAiBlock(null);
    }
  };

  const setFollowUp = (index, p) => patch({ follow_up: (plan.follow_up || []).map((f, i) => (i === index ? { ...f, ...p } : f)) });

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          onClick={() => navigate("/admin/training-day")}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> All plans
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{dirty ? "Unsaved changes" : "Saved"}</span>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-accent">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
            style={{ background: "hsl(45, 92%, 53%)", color: "hsl(230, 70%, 10%)" }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </button>
        </div>
      </div>

      <div className="training-day-plan space-y-5">
        {/* Details */}
        <div className="rounded-2xl border bg-card p-5 space-y-3">
          <input
            value={plan.title}
            onChange={(e) => patch({ title: e.target.value })}
            className="w-full text-2xl font-bold bg-transparent border-0 px-0 py-0 focus:outline-none focus:ring-2 focus:ring-ring/30 rounded"
            placeholder="Name this training day"
          />
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label className="text-xs font-semibold flex items-center gap-1"><Users className="w-3.5 h-3.5" /> For</label>
              <select value={plan.audience_type || "group"} onChange={(e) => patch({ audience_type: e.target.value })} className={inputCls}>
                <option value="group">A group / team</option>
                <option value="individual">One person</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold flex items-center gap-1">
                {plan.audience_type === "individual" ? <User className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                {plan.audience_type === "individual" ? "Person" : "Group"}
              </label>
              <input value={plan.audience || ""} onChange={(e) => patch({ audience: e.target.value })} placeholder="Pathways crew" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> Date</label>
              <input type="date" value={plan.plan_date || ""} onChange={(e) => patch({ plan_date: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Start</label>
              <input type="time" value={plan.start_time || "09:00"} onChange={(e) => patch({ start_time: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold">Summary</label>
            <textarea value={plan.summary || ""} onChange={(e) => patch({ summary: e.target.value })} rows={2} placeholder="The shape of the day in a sentence or two" className={inputCls} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold">By the end of the day (one per line)</label>
              <textarea
                value={(plan.outcomes || []).join("\n")}
                onChange={(e) => patch({ outcomes: e.target.value.split("\n") })}
                rows={4}
                placeholder="Open a client from the Master List…"
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs font-semibold">Room setup (one per line)</label>
              <textarea
                value={(plan.setup || []).join("\n")}
                onChange={(e) => patch({ setup: e.target.value.split("\n") })}
                rows={4}
                placeholder="Test Mode on for the room…"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Agenda */}
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">The agenda</h2>
            <p className="text-xs text-muted-foreground">
              {stats.teaching} min teaching · {stats.pauses} min breaks/admin · ends {endTime}
            </p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button onClick={() => addBlock("session")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-accent">
              <Plus className="w-3.5 h-3.5" /> Module block
            </button>
            <button onClick={() => addBlock("admin")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-accent">
              <Plus className="w-3.5 h-3.5" /> Admin
            </button>
            <button onClick={() => addBlock("break")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-accent">
              <Plus className="w-3.5 h-3.5" /> Break
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {timedBlocks.length === 0 && <p className="text-sm text-muted-foreground">No blocks yet — add a module block to start the day.</p>}
          {timedBlocks.map((b) => (
            <PlanBlockCard
              key={b.index}
              block={b}
              count={timedBlocks.length}
              onChange={(p) => patchBlock(b.index, p)}
              onRemove={() => removeBlock(b.index)}
              onMove={(delta) => moveBlock(b.index, delta)}
              onAISuggest={() => suggestActivities(b.index)}
              aiBusy={aiBlock === b.index}
              onRunSheet={(m) => setRunSheet(m)}
            />
          ))}
        </div>

        {/* Follow-up */}
        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <h2 className="font-bold">Finish this week, on their own</h2>
              <p className="text-xs text-muted-foreground">Modules that didn't fit in the room.</p>
            </div>
            <button
              onClick={() => patch({ follow_up: [...(plan.follow_up || []), { module_key: "", who: "", why: "" }] })}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-accent print:hidden"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          <div className="space-y-2">
            {(plan.follow_up || []).map((f, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1.2fr_1fr_1.6fr_auto] items-center">
                <select value={f.module_key} onChange={(e) => setFollowUp(i, { module_key: e.target.value })} className={inputCls}>
                  <option value="">Pick a module</option>
                  {MODULE_OPTIONS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                </select>
                <input value={f.who || ""} onChange={(e) => setFollowUp(i, { who: e.target.value })} placeholder="Who" className={inputCls} />
                <input value={f.why || ""} onChange={(e) => setFollowUp(i, { why: e.target.value })} placeholder="Why it matters" className={inputCls} />
                <button
                  onClick={() => patch({ follow_up: (plan.follow_up || []).filter((_, idx) => idx !== i) })}
                  className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-accent justify-self-start print:hidden"
                  title="Remove"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {(plan.follow_up || []).length === 0 && <p className="text-sm text-muted-foreground">Nothing set aside yet.</p>}
          </div>
        </div>

        <div className="flex justify-end print:hidden">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
            style={{ background: "hsl(45, 92%, 53%)", color: "hsl(230, 70%, 10%)" }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save plan
          </button>
        </div>
      </div>

      {runSheet && <FacilitatorRunSheet module={runSheet} open onClose={() => setRunSheet(null)} />}
    </div>
  );
}