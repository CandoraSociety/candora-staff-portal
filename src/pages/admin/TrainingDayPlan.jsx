import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Printer, ArrowLeft, Target, Wrench, BookOpen } from "lucide-react";
import { PATHWAYS_TRAINING_DAY } from "@/lib/training/trainingDayPlans";
import { getTrainingModule } from "@/lib/training/trainingModules";
import { startFacilitatedSession } from "@/lib/training/facilitatorSession";
import TrainingDayBlock from "@/components/training/TrainingDayBlock";
import FacilitatorRunSheet from "@/components/training/FacilitatorRunSheet";

// Facilitator's plan for a live training day: the agenda in time order, what
// the room does in Test Mode in each block, the module runs-sheets, and the
// modules staff finish on their own afterwards. Prints as one clean document.
export default function TrainingDayPlan() {
  const navigate = useNavigate();
  const [runSheet, setRunSheet] = useState(null);
  const plan = PATHWAYS_TRAINING_DAY;

  // While this page is mounted, printing outputs only the plan document.
  useEffect(() => {
    document.body.classList.add("trainingday-printing");
    return () => document.body.classList.remove("trainingday-printing");
  }, []);

  const teachingMinutes = plan.blocks
    .filter(b => b.type === "session")
    .reduce((n, b) => n + b.minutes, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => navigate("/admin/training")}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Training Hub
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors hover:opacity-90"
          style={{ background: "hsl(45, 92%, 53%)", color: "hsl(230, 70%, 10%)" }}
        >
          <Printer className="w-4 h-4" /> Print plan
        </button>
      </div>

      <div className="training-day-plan space-y-5">
        {/* Header */}
        <div className="rounded-2xl p-6" style={{ background: "hsl(230, 70%, 10%)" }}>
          <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: "hsl(45, 92%, 53%)" }}>
            <GraduationCap className="w-4 h-4" /> {plan.kicker}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-2" style={{ color: "hsl(45, 60%, 94%)" }}>{plan.title}</h1>
          <p className="text-sm mt-1" style={{ color: "hsl(230, 30%, 72%)" }}>{plan.audience}</p>
          <p className="text-sm mt-2 font-semibold" style={{ color: "hsl(45, 60%, 85%)" }}>{plan.timing}</p>
          <p className="text-sm mt-3 max-w-3xl leading-relaxed" style={{ color: "hsl(230, 25%, 78%)" }}>{plan.summary}</p>
        </div>

        {/* What they leave able to do */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border bg-card p-5">
            <h2 className="font-bold flex items-center gap-1.5 mb-2"><Target className="w-4 h-4" /> By the end of the day</h2>
            <ul className="space-y-1.5">
              {plan.outcomes.map((o, i) => (
                <li key={i} className="text-sm leading-relaxed flex gap-2">
                  <span className="text-muted-foreground">·</span><span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border bg-card p-5">
            <h2 className="font-bold flex items-center gap-1.5 mb-2"><Wrench className="w-4 h-4" /> Room setup</h2>
            <ul className="space-y-1.5">
              {plan.setup.map((s, i) => (
                <li key={i} className="text-sm leading-relaxed flex gap-2">
                  <span className="text-muted-foreground">·</span><span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Agenda */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-bold">The agenda</h2>
            <span className="text-xs text-muted-foreground">
              {teachingMinutes} minutes of teaching · {plan.blocks.length} blocks
            </span>
          </div>
          {plan.blocks.map((b, i) => (
            <TrainingDayBlock
              key={i}
              block={b}
              onFacilitate={(m) => startFacilitatedSession(m)}
              onRunSheet={(m) => setRunSheet(m)}
            />
          ))}
        </div>

        {/* Follow-up */}
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="font-bold flex items-center gap-1.5 mb-1">
            <BookOpen className="w-4 h-4" /> Finish this week, on your own
          </h2>
          <p className="text-sm text-muted-foreground mb-3">
            Not in the room today — each person takes these from their own portal's Training button.
          </p>
          <ul className="divide-y">
            {plan.followUp.map((f) => {
              const m = getTrainingModule(f.module);
              return (
                <li key={f.module} className="py-2.5 flex flex-wrap items-baseline gap-x-2 text-sm">
                  <span className="font-semibold">{m?.title || f.module}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{f.who}</span>
                  <span className="text-muted-foreground">{f.why}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {runSheet && (
        <FacilitatorRunSheet module={runSheet} open onClose={() => setRunSheet(null)} />
      )}
    </div>
  );
}