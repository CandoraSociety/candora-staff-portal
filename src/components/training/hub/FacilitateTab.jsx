import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { TRAINING_MODULES, getTrainingModule } from "@/lib/training/trainingModules";
import { startFacilitatedSession } from "@/lib/training/facilitatorSession";
import { planModuleKeys } from "@/lib/training/planAssignment";
import FacilitatorRunSheet from "@/components/training/FacilitatorRunSheet";
import PlanPrintDialog from "@/components/training/plan/PlanPrintDialog";
import { CalendarDays, FileText, Loader2, PlayCircle, Plus, Presentation } from "lucide-react";

const goldBtn = { background: "hsl(45, 92%, 53%)", color: "hsl(230, 70%, 10%)" };

const prettyDate = (d) => {
  if (!d) return "";
  const dt = new Date(`${d}T12:00:00`);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" });
};

// Run a session in the room: one module on its own, or a whole training day
// walked block by block from a saved plan.
export default function FacilitateTab() {
  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState(TRAINING_MODULES[0].key);
  const [runSheet, setRunSheet] = useState(null);
  const [printPlan, setPrintPlan] = useState(null);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["facilitate-training-plans"],
    queryFn: () => base44.entities.TrainingDayPlan.list("-created_date", 50),
  });

  const module = getTrainingModule(selectedModule);

  return (
    <div className="space-y-5">
      {/* One module */}
      <section className="rounded-2xl border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b bg-muted/40">
          <Presentation className="w-4 h-4 text-muted-foreground" />
          <div>
            <h2 className="font-bold leading-tight">Facilitate one module</h2>
            <p className="text-xs text-muted-foreground">Project it for the room, with your talking points beside it.</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {TRAINING_MODULES.map(m => {
              const active = selectedModule === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setSelectedModule(m.key)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${active ? "border-transparent" : "hover:bg-accent"}`}
                  style={active ? goldBtn : undefined}
                >
                  {m.shortTitle || m.title}
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border bg-muted/20 p-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold">{module.title}</p>
              <p className="text-sm text-muted-foreground">{module.blurb}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => startFacilitatedSession(module)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
                style={goldBtn}
              >
                <PlayCircle className="w-4 h-4" /> Start session
              </button>
              <button
                onClick={() => setRunSheet(module)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent"
              >
                <FileText className="w-4 h-4" /> Run-sheet
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* A whole training day */}
      <section className="rounded-2xl border bg-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b bg-muted/40">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <div>
              <h2 className="font-bold leading-tight">Facilitate a training day</h2>
              <p className="text-xs text-muted-foreground">Work a saved agenda block by block, in order.</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/admin/training-day")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
            style={goldBtn}
          >
            <Plus className="w-4 h-4" /> Training day plans
          </button>
        </div>

        <div className="p-5 space-y-3">
          {isLoading && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading plans…
            </p>
          )}

          {!isLoading && plans.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No training day plans yet. Build one and it will appear here, ready to run.
            </p>
          )}

          {plans.map(plan => {
            const keys = planModuleKeys(plan);
            const sessions = (plan.blocks || []).filter(b => b.type === "session" && b.module_key);
            return (
              <div key={plan.id} className="rounded-xl border p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{plan.title || "Training day"}</p>
                    <p className="text-xs text-muted-foreground">
                      {[prettyDate(plan.plan_date), plan.audience, `${keys.length} module${keys.length === 1 ? "" : "s"}`]
                        .filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setPrintPlan(plan)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-accent"
                    >
                      <FileText className="w-3.5 h-3.5" /> Run-sheet
                    </button>
                    <button
                      onClick={() => navigate(`/admin/training-day/${plan.id}`)}
                      className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-accent"
                    >
                      Open plan
                    </button>
                  </div>
                </div>

                {sessions.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Start a block</p>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {sessions.map((b, i) => {
                        const m = getTrainingModule(b.module_key);
                        if (!m) return null;
                        return (
                          <button
                            key={`${b.module_key}-${i}`}
                            onClick={() => startFacilitatedSession(m)}
                            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm hover:bg-accent"
                          >
                            <PlayCircle className="w-4 h-4 shrink-0" style={{ color: "hsl(45, 92%, 45%)" }} />
                            <span className="min-w-0">
                              <span className="block font-medium truncate">{m.shortTitle || m.title}</span>
                              <span className="block text-xs text-muted-foreground truncate">{b.title}{b.minutes ? ` · ${b.minutes} min` : ""}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No modules on this plan yet.</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {runSheet && <FacilitatorRunSheet module={runSheet} open onClose={() => setRunSheet(null)} />}
      <PlanPrintDialog open={!!printPlan} plan={printPlan} onClose={() => setPrintPlan(null)} />
    </div>
  );
}