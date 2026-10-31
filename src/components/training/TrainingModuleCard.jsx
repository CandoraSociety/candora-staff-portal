import { CheckCircle2, PlayCircle, RotateCcw } from 'lucide-react';

// One training module card on the Staff Portal Training page.
export default function TrainingModuleCard({ module, record, onStart }) {
  const doneTasks = record?.tasks_done?.length || 0;
  const totalTasks = module.tasks?.length || 0;
  const completed = !!record?.is_completed;

  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-3">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold">{module.title}</h3>
          {completed ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-success shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
            </span>
          ) : record ? (
            <span className="text-xs font-semibold text-primary shrink-0">
              In progress{totalTasks > 0 ? ` · ${doneTasks}/${totalTasks} practice` : ''}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground shrink-0">Not started</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{module.blurb}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {module.steps?.length || 0} guided steps{totalTasks > 0 ? ` · ${totalTasks} practice tasks` : ''}
        </p>
      </div>
      <button
        onClick={() => onStart(module, record)}
        className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors hover:opacity-90 bg-primary text-primary-foreground mt-auto"
      >
        {completed
          ? <><RotateCcw className="w-3.5 h-3.5" /> Retake training</>
          : record
            ? <><PlayCircle className="w-3.5 h-3.5" /> Resume training</>
            : <><PlayCircle className="w-3.5 h-3.5" /> Start training</>}
      </button>
    </div>
  );
}