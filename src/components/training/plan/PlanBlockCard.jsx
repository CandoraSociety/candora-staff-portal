import { ArrowUp, ArrowDown, Trash2, Plus, X, Sparkles, FileText, Clock, Loader2 } from "lucide-react";
import { MODULE_OPTIONS, MODULE_MINUTES, BLOCK_TYPES } from "@/lib/training/planTimeline";

const inputCls = "w-full rounded-lg border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30";

// One editable agenda block: its length, which module it teaches, the
// facilitator's cue and the Test Mode activities the room does. Times come from
// planTimeline, so changing the minutes re-times everything below it.
export default function PlanBlockCard({ block, count, onChange, onRemove, onMove, onAISuggest, aiBusy, onRunSheet }) {
  const isBreak = block.type === "break";
  const activities = block.activities || [];

  const setActivity = (i, value) => {
    const next = [...activities];
    next[i] = value;
    onChange({ activities: next });
  };

  return (
    <div className="rounded-2xl border bg-card overflow-hidden print:break-inside-avoid">
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b bg-muted/30">
        <div className="w-[112px] shrink-0">
          <p className="text-sm font-bold tabular-nums flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" /> {block.time}
          </p>
          <p className="text-[11px] text-muted-foreground">{block.minutes} min</p>
        </div>

        <select
          value={block.type}
          onChange={(e) => onChange({ type: e.target.value })}
          className="rounded-lg border bg-background px-2 py-1 text-xs font-semibold print:hidden"
        >
          {BLOCK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        <input
          value={block.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Block title"
          className="flex-1 min-w-[180px] rounded-lg border-0 bg-transparent px-1 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-ring/30"
        />

        <input
          type="number"
          min="0"
          step="5"
          value={block.minutes}
          onChange={(e) => onChange({ minutes: Number(e.target.value) })}
          className="w-16 rounded-lg border bg-background px-2 py-1 text-xs tabular-nums print:hidden"
          title="Length in minutes"
        />

        <div className="flex items-center gap-1 print:hidden">
          <button onClick={() => onMove(-1)} disabled={block.index === 0} className="p-1 rounded hover:bg-accent disabled:opacity-30" title="Move up">
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onMove(1)} disabled={block.index === count - 1} className="p-1 rounded hover:bg-accent disabled:opacity-30" title="Move down">
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button onClick={onRemove} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-destructive" title="Remove block">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isBreak ? (
        <p className="px-4 py-3 text-sm text-muted-foreground">{block.title} · {block.minutes} minutes</p>
      ) : (
        <div className="px-4 py-3.5 space-y-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
            <select
              value={block.module_key || ""}
              onChange={(e) => {
                const key = e.target.value;
                onChange({ module_key: key, minutes: MODULE_MINUTES[key] || block.minutes });
              }}
              className={inputCls}
            >
              <option value="">No module — custom session</option>
              {MODULE_OPTIONS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
            {block.module && (
              <button
                onClick={() => onRunSheet(block.module)}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-accent print:hidden"
              >
                <FileText className="w-3.5 h-3.5" /> Run-sheet
              </button>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Why here</label>
              <textarea
                value={block.why || ""}
                onChange={(e) => onChange({ why: e.target.value })}
                rows={2}
                placeholder="Why this block sits at this point in the day"
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Say this</label>
              <textarea
                value={block.cue || ""}
                onChange={(e) => onChange({ cue: e.target.value })}
                rows={2}
                placeholder="The one thing to say out loud in this block"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">In Test Mode, everyone does</p>
              <button
                onClick={onAISuggest}
                disabled={aiBusy}
                className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg transition-colors hover:opacity-90 disabled:opacity-50 print:hidden"
                style={{ background: "hsl(45, 92%, 53%, 0.18)", color: "hsl(38, 80%, 32%)" }}
              >
                {aiBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {aiBusy ? "Thinking…" : "Suggest activities"}
              </button>
            </div>
            <ul className="space-y-1.5">
              {activities.map((a, i) => (
                <li key={i} className="flex gap-1.5 items-start">
                  <span className="text-muted-foreground text-sm mt-1.5">·</span>
                  <input
                    value={a}
                    onChange={(e) => setActivity(i, e.target.value)}
                    className="flex-1 rounded-lg border border-transparent hover:border-border px-1.5 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-border"
                  />
                  <button
                    onClick={() => onChange({ activities: activities.filter((_, idx) => idx !== i) })}
                    className="p-1 mt-0.5 rounded text-muted-foreground hover:text-destructive print:hidden"
                    title="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => onChange({ activities: [...activities, ""] })}
              className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground print:hidden"
            >
              <Plus className="w-3.5 h-3.5" /> Add activity
            </button>
          </div>
        </div>
      )}
    </div>
  );
}