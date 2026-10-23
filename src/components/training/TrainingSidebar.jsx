import { useState, useEffect } from "react";
import { GraduationCap, PanelRightClose, PanelRightOpen } from "lucide-react";
import useTrainingModules from "@/lib/useTrainingModules";
import { startTrainingSession } from "@/lib/training/trainingSession";
import { TRAINING_NAV_GROUPS } from "@/lib/training/trainingNavigation";
import { useTrainingTour } from "@/components/training/TrainingTourProvider";
import TrainingSidebarModule from "@/components/training/TrainingSidebarModule";

export default function TrainingSidebar({ activeKey, activeStepIndex, onOpenTour, onOpenPractice }) {
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(activeKey);
  const { modules, progress } = useTrainingModules();
  const { requestJump } = useTrainingTour();
  // While the sidebar is open it is docked: the body gets right padding so the
  // app's working space shrinks to sit beside it instead of being covered.
  useEffect(() => {
    document.body.classList.toggle("has-training-sidebar", open && modules.length > 0);
    return () => document.body.classList.remove("has-training-sidebar");
  }, [open, modules.length]);
  if (!modules.length) return null;
  const jumpToStep = (module, index) => {
    if (module.key === activeKey) { onOpenTour?.(); requestJump(module.key, index); }
    else {
      sessionStorage.setItem(`candora-tour-step-${module.key}`, String(index));
      startTrainingSession(module.key);
    }
  };
  if (!open) return (
    <button onClick={() => setOpen(true)} title="Show training sidebar" className="fixed right-0 top-1/2 z-[99] hidden -translate-y-1/2 flex-col items-center gap-1.5 rounded-l-xl border border-sidebar-primary/50 bg-sidebar px-1.5 py-3 text-sidebar-primary shadow-lg md:flex print:hidden">
      <PanelRightOpen className="h-4 w-4" /><span className="text-[10px] font-bold [writing-mode:vertical-rl]">Training</span>
    </button>
  );
  return (
    <aside aria-label="Training modules" className="fixed bottom-4 right-3 top-20 z-[99] hidden w-[250px] flex-col md:flex print:hidden">
      <div className="training-window-glow flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-sidebar text-sidebar-foreground shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-sidebar-border px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold"><GraduationCap className="h-4 w-4 text-sidebar-primary" />Training modules</div>
          <button onClick={() => setOpen(false)} title="Hide sidebar" className="rounded-lg p-1 text-sidebar-foreground/60 hover:opacity-70"><PanelRightClose className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-2">
          {TRAINING_NAV_GROUPS.map(group => {
            const members = modules.filter(module => group.keys.includes(module.key));
            return members.length > 0 && (
              <section key={group.title} aria-label={group.title}>
                <h2 className="mb-2 border-b-2 border-sidebar-primary/50 bg-sidebar-accent px-2.5 py-2 text-[11px] font-bold uppercase tracking-wide text-sidebar-primary">{group.title}</h2>
                <div className="space-y-2">{members.map(module => (
                  <TrainingSidebarModule key={module.key} module={module} progress={progress.find(record => record.portal_key === module.key)} isActive={module.key === activeKey} isOpen={expanded === module.key} activeStepIndex={activeStepIndex} onToggle={() => setExpanded(value => value === module.key ? null : module.key)} onJump={jumpToStep} onOpenPractice={onOpenPractice} />
                ))}</div>
              </section>
            );
          })}
        </div>
      </div>
    </aside>
  );
}