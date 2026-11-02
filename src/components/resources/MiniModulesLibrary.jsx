import { BookOpen, Clock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MINI_MODULES } from "@/lib/training/modules/miniModules";
import { startTrainingSession } from "@/lib/training/trainingSession";

// The Mini-Modules category of a Resources tab: short single-page trainings.
// Starting one puts the app in Test Mode and opens that module's guided tour.
export default function MiniModulesLibrary({ pathPrefix = "/pathways" }) {
  const modules = MINI_MODULES.filter(m => m.path.startsWith(pathPrefix));

  if (!modules.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No mini-modules for this portal yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">Mini-Modules</h3>
          <p className="text-sm text-muted-foreground">
            Short trainings on one tool at a time. Each one runs in Training Mode on demo data and takes
            a few minutes — start it whenever you have a gap, and pick up where you left off later.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {modules.map(module => (
          <div key={module.key} className="rounded-xl border bg-card p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-slate-800 leading-snug">{module.title}</h4>
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                Mini
              </span>
            </div>
            <p className="text-sm text-muted-foreground flex-1">{module.blurb}</p>
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" /> {module.steps.length} steps · ~5 min
              </span>
              <Button size="sm" onClick={() => startTrainingSession(module.key)} className="gap-1.5">
                <Play className="w-3.5 h-3.5" /> Start
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}