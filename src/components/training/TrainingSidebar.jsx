import { useState } from "react";
import { GraduationCap, CheckCircle2, Circle, ListChecks, ChevronRight, PanelRightClose, PanelRightOpen } from "lucide-react";
import useTrainingModules from "@/lib/useTrainingModules";
import { startTrainingSession } from "@/lib/training/trainingSession";
import { useTrainingTour } from "@/components/training/TrainingTourProvider";

// Docked right-hand panel listing every training mini-module the learner can
// take, with the active module's tour steps and practice open for direct
// navigation. It complements — never replaces — the guided-tour popup: the
// tour keeps its own Next/Back flow, and the sidebar is a quick way to jump to
// any step or switch to another module.
export default function TrainingSidebar({ activeKey, activeStepIndex, onOpenTour, onOpenPractice }) {
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(activeKey);
  const { modules, progress } = useTrainingModules();
  const { requestJump } = useTrainingTour();

  if (!modules.length) return null;

  const recFor = (key) => progress.find(p => p.portal_key === key);

  const jumpToStep = (m, i) => {
    if (m.key === activeKey) {
      onOpenTour?.();
      requestJump(m.key, i);
    } else {
      // Start (or switch) the training session on that module, resuming its
      // tour directly at the chosen step after the reload.
      try { sessionStorage.setItem(`candora-tour-step-${m.key}`, String(i)); } catch { /* ignore */ }
      startTrainingSession(m.key);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-[99] rounded-l-xl border shadow-lg px-1.5 py-3 flex-col items-center gap-1.5 print:hidden"
        style={{ background: "hsl(230, 70%, 10%)", borderColor: "hsl(45, 60%, 45%)" }}
        title="Show training sidebar"
      >
        <PanelRightOpen className="w-4 h-4" style={{ color: "hsl(45, 92%, 53%)" }} />
        <span className="text-[10px] font-bold" style={{ color: "hsl(45, 60%, 85%)", writingMode: "vertical-rl" }}>Training</span>
      </button>
    );
  }

  return (
    <div className="hidden md:flex fixed right-3 top-20 bottom-4 w-[250px] z-[99] flex-col print:hidden">
      <div className="training-window-glow rounded-2xl border shadow-2xl overflow-hidden flex flex-col min-h-0" style={{ background: "hsl(230, 70%, 10%)", borderColor: "hsl(230, 50%, 22%)" }}>
        <div className="flex items-center justify-between px-3 py-2.5 shrink-0" style={{ borderBottom: "1px solid hsl(230, 50%, 22%)" }}>
          <div className="flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4" style={{ color: "hsl(45, 92%, 53%)" }} />
            <span className="text-xs font-bold" style={{ color: "hsl(45, 60%, 85%)" }}>Training modules</span>
          </div>
          <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:opacity-70" style={{ color: "hsl(230, 30%, 60%)" }} title="Hide sidebar">
            <PanelRightClose className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {modules.map(m => {
            const rec = recFor(m.key);
            const isActive = m.key === activeKey;
            const isOpen = expanded === m.key;
            const doneTasks = rec?.tasks_done?.length || 0;
            return (
              <div key={m.key} className="rounded-xl" style={{ background: "hsl(230, 60%, 13%)", border: `1px solid ${isActive ? "hsl(45, 60%, 40%)" : "hsl(230, 45%, 22%)"}` }}>
                <button onClick={() => setExpanded(e => (e === m.key ? null : m.key))} className="w-full flex items-center gap-2 px-2.5 py-2 text-left">
                  {rec?.is_completed
                    ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(152, 55%, 55%)" }} />
                    : <Circle className="w-3.5 h-3.5 shrink-0" style={{ color: rec ? "hsl(45, 92%, 60%)" : "hsl(230, 30%, 50%)" }} />}
                  <span className="flex-1 min-w-0 text-[11px] font-semibold truncate" style={{ color: isActive ? "hsl(45, 60%, 90%)" : "hsl(230, 25%, 78%)" }}>
                    {m.shortTitle || m.title}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`} style={{ color: "hsl(230, 30%, 55%)" }} />
                </button>

                {isOpen && (
                  <div className="px-2 pb-2 space-y-0.5">
                    <p className="text-[9px] font-bold uppercase tracking-wide px-1.5 pt-0.5" style={{ color: "hsl(230, 25%, 50%)" }}>
                      Guided tour{rec?.tour_done ? " — done" : ""}
                    </p>
                    {m.steps.map((s, i) => {
                      const current = isActive && activeStepIndex === i;
                      return (
                        <button
                          key={i}
                          onClick={() => jumpToStep(m, i)}
                          className="w-full flex items-start gap-1.5 px-1.5 py-1 rounded-md text-left transition-colors hover:opacity-80"
                          style={{ background: current ? "hsl(45, 60%, 22%)" : "transparent" }}
                          title={isActive ? "Jump to this step" : "Switch to this training at this step"}
                        >
                          <span className="text-[9px] w-3 text-center shrink-0 mt-px" style={{ color: "hsl(230, 25%, 55%)" }}>{i + 1}</span>
                          <span className="text-[10px] leading-snug line-clamp-2" style={{ color: current ? "hsl(45, 95%, 82%)" : "hsl(230, 20%, 72%)" }}>{s.title}</span>
                        </button>
                      );
                    })}
                    <div className="pt-1">
                      {isActive ? (
                        <button onClick={() => onOpenPractice?.()} className="w-full flex items-center gap-1.5 px-1.5 py-1 rounded-md text-left transition-colors hover:opacity-80" style={{ color: "hsl(45, 70%, 75%)" }}>
                          <ListChecks className="w-3 h-3 shrink-0" />
                          <span className="text-[10px] font-semibold">Practice — {doneTasks}/{m.tasks.length} tasks</span>
                        </button>
                      ) : (
                        <p className="flex items-center gap-1.5 px-1.5 py-1 text-[10px]" style={{ color: "hsl(230, 25%, 60%)" }}>
                          <ListChecks className="w-3 h-3 shrink-0" /> {m.tasks.length} practice tasks
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}