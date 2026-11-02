import { Clock, Coffee, PlayCircle, FileText, CheckCircle2, Lightbulb, Utensils } from "lucide-react";
import { getTrainingModule } from "@/lib/training/trainingModules";

// One row of the training-day agenda: a taught module block, a break, or an
// admin block (arrival, wrap-up). Taught blocks carry the module's buttons so
// the facilitator can start the session or print its run-sheet from here.
export default function TrainingDayBlock({ block, onFacilitate, onRunSheet }) {
  const module = block.module ? getTrainingModule(block.module) : null;
  const isBreak = block.type === "break";

  if (isBreak) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-dashed bg-muted/40">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-semibold">{block.time}</span>
        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
          {block.title === "Lunch" ? <Utensils className="w-3.5 h-3.5" /> : <Coffee className="w-3.5 h-3.5" />}
          {block.title} · {block.minutes} min
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="flex items-start gap-4 px-5 py-3.5 border-b bg-muted/30">
        <div className="shrink-0 w-[104px]">
          <p className="text-sm font-bold tabular-nums">{block.time}</p>
          <p className="text-xs text-muted-foreground">{block.minutes} min</p>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold leading-snug">{block.title}</h3>
          {module && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Module: {module.title}
            </p>
          )}
        </div>
        {module && (
          <div className="flex gap-2 shrink-0 print:hidden">
            <button
              onClick={() => onFacilitate(module)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-90"
              style={{ background: "hsl(45, 92%, 53%)", color: "hsl(230, 70%, 10%)" }}
            >
              <PlayCircle className="w-3.5 h-3.5" /> Facilitate
            </button>
            <button
              onClick={() => onRunSheet(module)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-accent"
            >
              <FileText className="w-3.5 h-3.5" /> Run-sheet
            </button>
          </div>
        )}
      </div>

      <div className="px-5 py-4 space-y-3">
        {block.why && <p className="text-sm text-muted-foreground">{block.why}</p>}

        {block.cue && (
          <div className="flex gap-2 rounded-xl px-3 py-2.5" style={{ background: "hsl(45, 92%, 53%, 0.12)" }}>
            <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "hsl(38, 85%, 42%)" }} />
            <p className="text-sm leading-relaxed">
              <span className="font-semibold">Say this: </span>
              {block.cue}
            </p>
          </div>
        )}

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
            In Test Mode, everyone does
          </p>
          <ul className="space-y-1.5">
            {block.activities.map((a, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-1 text-muted-foreground" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}