import { CheckCircle2, Circle, ListChecks, ChevronRight } from "lucide-react";
import TrainingSidebarSteps from "@/components/training/TrainingSidebarSteps";

export default function TrainingSidebarModule({ module, progress, isActive, isOpen, activeStepIndex, onToggle, onJump, onOpenPractice }) {
  const doneTasks = progress?.tasks_done?.length || 0;
  return (
    <div className={`rounded-xl border bg-sidebar-accent/40 ${isActive ? "border-sidebar-primary/60" : "border-sidebar-border"}`}>
      <button onClick={onToggle} aria-expanded={isOpen} className="flex w-full items-center gap-2 px-2.5 py-2.5 text-left text-sidebar-foreground">
        {progress?.is_completed
          ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
          : <Circle className={`h-3.5 w-3.5 shrink-0 ${progress ? "text-sidebar-primary" : "text-sidebar-foreground/40"}`} />}
        <span className={`min-w-0 flex-1 text-xs font-semibold ${isActive ? "text-sidebar-primary" : ""}`}>
          {module.shortTitle || module.title}
        </span>
        <ChevronRight className={`h-3.5 w-3.5 shrink-0 text-sidebar-foreground/50 ${isOpen ? "rotate-90" : ""}`} />
      </button>
      {isOpen && (
        <div className="space-y-3 border-t border-sidebar-border px-2.5 pb-2.5 pt-2">
          <p className="text-[9px] font-bold uppercase tracking-wide text-sidebar-foreground/50">
            Guided tour{progress?.tour_done ? " — done" : ""}
          </p>
          <TrainingSidebarSteps module={module} isActive={isActive} activeStepIndex={activeStepIndex} onJump={onJump} />
          {!!module.tasks?.length && (
            <div className="border-t border-sidebar-primary/30 pt-2">
              {isActive ? (
                <button onClick={onOpenPractice} className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-sidebar-primary hover:bg-sidebar-accent">
                  <ListChecks className="h-3 w-3 shrink-0" />
                  <span className="text-[10px] font-semibold">Practice — {doneTasks}/{module.tasks.length} tasks</span>
                </button>
              ) : (
                <p className="flex items-center gap-1.5 px-1.5 py-1 text-[10px] text-sidebar-foreground/60">
                  <ListChecks className="h-3 w-3 shrink-0" /> {module.tasks.length} practice tasks
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}