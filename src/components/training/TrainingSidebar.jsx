import { useState, useEffect } from "react";
import { GraduationCap, PanelRightClose, PanelRightOpen } from "lucide-react";
import useTrainingModules from "@/lib/useTrainingModules";
import { startTrainingSession } from "@/lib/training/trainingSession";
import { TRAINING_NAV_GROUPS, TRAINING_MODULE_SERIES, TRAINING_SERIES_TITLES } from "@/lib/training/trainingNavigation";
import { useTrainingTour } from "@/components/training/TrainingTourProvider";
import TrainingSidebarModule from "@/components/training/TrainingSidebarModule";
import TrainingSidebarNextModule from "@/components/training/TrainingSidebarNextModule";
import TrainingSidebarPortalMenu from "@/components/training/TrainingSidebarPortalMenu";

export default function TrainingSidebar({ activeKey, activeStepIndex, onOpenTour, onOpenPractice }) {
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(activeKey);
  const { modules, progress } = useTrainingModules();
  const { requestJump } = useTrainingTour();

  // Active = started but not finished. The module of the session currently
  // running always counts as active, even before its progress record saves.
  const progressFor = (key) => progress.find(record => record.portal_key === key);
  const activeModules = modules.filter(module => {
    const record = progressFor(module.key);
    return module.key === activeKey || (!!record && !record.is_completed);
  });

  // "Up next" always follows the module order inside the same portal series —
  // whoever finishes first, the learner is walked through the portal's modules
  // in sequence. Completing a later module never skips the ones before it.
  const currentKey = activeKey || activeModules[activeModules.length - 1]?.key || null;
  const currentSeries = currentKey ? TRAINING_MODULE_SERIES[currentKey] : null;
  const portalModules = currentSeries
    ? modules.filter(module => TRAINING_MODULE_SERIES[module.key] === currentSeries)
    : [];
  const currentIndex = portalModules.findIndex(module => module.key === currentKey);
  const nextModule = currentIndex >= 0 ? portalModules[currentIndex + 1] || null : null;

  const openModule = (module) => {
    if (module.key === activeKey) { onOpenTour?.(); return; }
    startTrainingSession(module.key);
  };

  const hasContent = activeModules.length > 0 || !!nextModule;

  // While the sidebar is open it is docked: the body gets right padding so the
  // app's working space shrinks to sit beside it instead of being covered.
  useEffect(() => {
    document.body.classList.toggle("has-training-sidebar", open && hasContent);
    return () => document.body.classList.remove("has-training-sidebar");
  }, [open, hasContent]);

  if (!hasContent) return null;

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
            const members = activeModules.filter(module => group.keys.includes(module.key));
            return members.length > 0 && (
              <section key={group.title} aria-label={group.title}>
                <h2 className="mb-2 border-b-2 border-sidebar-primary/50 bg-sidebar-accent px-2.5 py-2 text-[11px] font-bold uppercase tracking-wide text-sidebar-primary">{group.title}</h2>
                <div className="space-y-2">{members.map(module => (
                  <TrainingSidebarModule key={module.key} module={module} progress={progressFor(module.key)} isActive={module.key === activeKey} isOpen={expanded === module.key} activeStepIndex={activeStepIndex} onToggle={() => setExpanded(value => value === module.key ? null : module.key)} onJump={jumpToStep} onOpenPractice={onOpenPractice} />
                ))}</div>
              </section>
            );
          })}
          {nextModule && (
            <section aria-label="Next module">
              <h2 className="mb-2 border-b-2 border-sidebar-primary/50 bg-sidebar-accent px-2.5 py-2 text-[11px] font-bold uppercase tracking-wide text-sidebar-primary">Up next</h2>
              <TrainingSidebarNextModule module={nextModule} />
            </section>
          )}
          {portalModules.length > 1 && (
            <section aria-label="All modules in this portal">
              <h2 className="mb-2 border-b-2 border-sidebar-primary/50 bg-sidebar-accent px-2.5 py-2 text-[11px] font-bold uppercase tracking-wide text-sidebar-primary">
                All {TRAINING_SERIES_TITLES[currentSeries] || "portal"} modules
              </h2>
              <TrainingSidebarPortalMenu
                modules={portalModules}
                activeKey={activeKey}
                progressFor={progressFor}
                onOpen={openModule}
              />
            </section>
          )}
        </div>
      </div>
    </aside>
  );
}