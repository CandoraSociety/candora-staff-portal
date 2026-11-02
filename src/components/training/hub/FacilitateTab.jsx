import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { TRAINING_MODULES, getTrainingModule } from "@/lib/training/trainingModules";
import { groupModulesBySection } from "@/lib/training/moduleSections";
import { startFacilitatedSession } from "@/lib/training/facilitatorSession";
import { planModuleKeys } from "@/lib/training/planAssignment";
import FacilitatorRunSheet from "@/components/training/FacilitatorRunSheet";
import PlanPrintDialog from "@/components/training/plan/PlanPrintDialog";
import { CalendarDays, FileText, Loader2, Play, Plus, Presentation } from "lucide-react";

const NAVY = "hsl(230, 70%, 12%)";
const GOLD = "hsl(45, 92%, 53%)";
const goldBtn = { background: GOLD, color: "hsl(230, 70%, 10%)" };

const prettyDate = (d) => {
  if (!d) return "";
  const dt = new Date(`${d}T12:00:00`);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
};

const SectionCard = ({ icon: Icon, title, subtitle, action, children }) => (
  <section className="rounded-2xl border bg-card shadow-sm overflow-hidden">
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b bg-muted/30">
      <div className="flex items-center gap-3">
        <span className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0" style={{ background: "hsl(45, 92%, 53%, 0.18)" }}>
          <Icon className="w-4 h-4" style={{ color: "hsl(230, 70%, 20%)" }} />
        </span>
        <div>
          <h2 className="font-bold leading-tight">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </section>
);

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
    <div className="space-y-4">
      {/* One module */}
      <SectionCard
        icon={Presentation}
        title="Facilitate one module"
        subtitle="Project it for the room, with your talking points beside it."
      >
        <div className="space-y-3">
          {groupModulesBySection(TRAINING_MODULES).map(section => (
            <div key={section.key}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                {section.title}
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {section.modules.map(m => {
                  const active = selectedModule === m.key;
                  return (
                    <button
                      key={m.key}
                      onClick={() => setSelectedModule(m.key)}
                      className={`rounded-xl border px-3 py-2.5 text-left text-sm font-medium leading-snug transition-colors ${active ? "border-transparent shadow-sm" : "hover:bg-accent"}`}
                      style={active ? goldBtn : undefined}
                    >
                      {m.shortTitle || m.title}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4" style={{ background: NAVY }}>
          <div className="min-w-0">
            <p className="font-bold" style={{ color: "hsl(45, 60%, 92%)" }}>{module.title}</p>
            <p className="text-sm mt-0.5" style={{ color: "hsl(230, 25%, 72%)" }}>{module.blurb}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => startFacilitatedSession(module)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
              style={goldBtn}
            >
              <Play className="w-4 h-4" /> Start session
            </button>
            <button
              onClick={() => setRunSheet(module)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10"
              style={{ border: "1px solid hsl(230, 45%, 32%)", color: "hsl(45, 60%, 90%)" }}
            >
              <FileText className="w-4 h-4" /> Run-sheet
            </button>
          </div>
        </div>
      </SectionCard>

      {/* A whole training day */}
      <SectionCard
        icon={CalendarDays}
        title="Facilitate a training day"
        subtitle="Work a saved agenda block by block, in order."
        action={
          <button
            onClick={() => navigate("/admin/training-day")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
            style={goldBtn}
          >
            <Plus className="w-4 h-4" /> Training day plans
          </button>
        }
      >
        {isLoading && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading plans…
          </p>
        )}

        {!isLoading && plans.length === 0 && (
          <div className="rounded-xl border border-dashed px-5 py-8 text-center">
            <CalendarDays className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="font-semibold text-sm">No training day plans yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">Build one and it appears here, ready to run.</p>
          </div>
        )}

        <div className="space-y-3">
          {plans.map(plan => {
            const keys = planModuleKeys(plan);
            const sessions = (plan.blocks || []).filter(b => b.type === "session" && b.module_key);
            return (
              <div key={plan.id} className="rounded-xl border overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3" style={{ background: "hsl(230, 70%, 98%)" }}>
                  <div className="min-w-0">
                    <p className="font-semibold leading-snug">{plan.title || "Training day"}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {prettyDate(plan.plan_date) && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-card border">{prettyDate(plan.plan_date)}</span>
                      )}
                      {plan.audience && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-card border truncate max-w-[260px]">{plan.audience}</span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full border" style={{ background: "hsl(45, 92%, 53%, 0.18)" }}>
                        {keys.length} module{keys.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setPrintPlan(plan)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-card text-xs font-semibold hover:bg-accent"
                    >
                      <FileText className="w-3.5 h-3.5" /> Run-sheet
                    </button>
                    <button
                      onClick={() => navigate(`/admin/training-day/${plan.id}`)}
                      className="px-3 py-1.5 rounded-lg border bg-card text-xs font-semibold hover:bg-accent"
                    >
                      Open plan
                    </button>
                  </div>
                </div>

                <div className="p-3">
                  {sessions.length > 0 ? (
                    <>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">Start a block</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {sessions.map((b, i) => {
                          const m = getTrainingModule(b.module_key);
                          if (!m) return null;
                          return (
                            <button
                              key={`${b.module_key}-${i}`}
                              onClick={() => startFacilitatedSession(m)}
                              className="group flex items-center gap-3 rounded-lg border px-3 py-2 text-left hover:border-transparent hover:shadow-sm transition-all"
                            >
                              <span className="flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold shrink-0" style={{ background: "hsl(45, 92%, 53%, 0.22)", color: "hsl(230, 70%, 20%)" }}>
                                {i + 1}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium truncate">{m.shortTitle || m.title}</span>
                                <span className="block text-xs text-muted-foreground truncate">
                                  {b.title}{b.minutes ? ` · ${b.minutes} min` : ""}
                                </span>
                              </span>
                              <Play className="w-4 h-4 shrink-0" style={{ color: "hsl(45, 92%, 45%)" }} />
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground px-1">No modules on this plan yet.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {runSheet && <FacilitatorRunSheet module={runSheet} open onClose={() => setRunSheet(null)} />}
      <PlanPrintDialog open={!!printPlan} plan={printPlan} onClose={() => setPrintPlan(null)} />
    </div>
  );
}