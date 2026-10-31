import { CheckCircle2, Circle, PlayCircle } from "lucide-react";

// Every module of the portal being trained, in sequence. Any row can be
// started or resumed, and each one states the learner's progress in it.
export default function TrainingSidebarPortalMenu({ modules, activeKey, progressFor, onOpen }) {
  return (
    <div className="space-y-1.5">
      {modules.map((module, index) => {
        const record = progressFor(module.key);
        const isActive = module.key === activeKey;
        const doneTasks = record?.tasks_done?.length || 0;
        const totalTasks = module.tasks?.length || 0;
        const status = record?.is_completed
          ? "Completed"
          : record
            ? `In progress${totalTasks ? ` · ${doneTasks}/${totalTasks} practice` : ""}${isActive ? " · current" : ""}`
            : isActive
              ? "Current module"
              : "Not started";
        return (
          <button
            key={module.key}
            onClick={() => onOpen(module)}
            title={isActive ? `Return to ${module.title}` : `${record ? "Resume" : "Start"} ${module.title}`}
            className={`flex w-full items-start gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent/60 ${
              isActive ? "border-sidebar-primary/60 bg-sidebar-accent/50" : "border-sidebar-border bg-sidebar-accent/20"
            }`}
          >
            {record?.is_completed ? (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
            ) : isActive ? (
              <PlayCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sidebar-primary" />
            ) : (
              <Circle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${record ? "text-sidebar-primary" : "text-sidebar-foreground/40"}`} />
            )}
            <span className="min-w-0 flex-1">
              <span className={`block text-xs font-semibold ${isActive || record?.is_completed ? "text-sidebar-primary" : "text-sidebar-foreground/90"}`}>
                {index + 1}. {module.shortTitle || module.title}
              </span>
              <span className="block text-[10px] text-sidebar-foreground/60">{status}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}