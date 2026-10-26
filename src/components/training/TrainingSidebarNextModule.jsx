import { Play } from "lucide-react";
import { startTrainingSession } from "@/lib/training/trainingSession";

// The single "up next" module at the bottom of the training sidebar: not
// started yet, so clicking it launches that module's session.
export default function TrainingSidebarNextModule({ module }) {
  return (
    <button
      onClick={() => startTrainingSession(module.key)}
      title={`Start module: ${module.title}`}
      className="flex w-full items-center gap-2 rounded-xl border border-dashed border-sidebar-primary/40 bg-sidebar-accent/20 px-2.5 py-2.5 text-left transition-colors hover:bg-sidebar-accent/50"
    >
      <Play className="h-3.5 w-3.5 shrink-0 text-sidebar-primary" />
      <span className="min-w-0 flex-1 text-xs font-semibold text-sidebar-foreground/90">
        {module.shortTitle || module.title}
      </span>
    </button>
  );
}