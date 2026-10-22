import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { GraduationCap, CheckCircle2, PlayCircle, RotateCcw } from 'lucide-react';
import { TRAINING_MODULES } from '@/lib/training/trainingModules';
import { startTrainingSession } from '@/lib/training/trainingSession';

// Prominent dashboard section listing every training module with the user's
// progress, so training is reachable from one obvious place — not just from
// the small pill on whichever portal happens to match it.
export default function TrainingCatalogWidget({ user }) {
  const { data: progress = [] } = useQuery({
    queryKey: ['trainingProgress', user?.email],
    queryFn: () => base44.entities.TrainingProgress.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  if (!user?.email) return null;

  return (
    <section className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-primary" />
        <h2 className="font-bold text-lg">Staff Training</h2>
      </div>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        Guided tours with hands-on practice for every portal. Training runs on simulated demo data, so nothing you do while training affects real records.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {TRAINING_MODULES.map(m => {
          const rec = progress.find(p => p.portal_key === m.key);
          const doneTasks = rec?.tasks_done?.length || 0;
          const totalTasks = m.tasks?.length || 0;
          const completed = !!rec?.is_completed;
          return (
            <div key={m.key} className="rounded-xl border bg-card p-4 flex flex-col gap-3">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{m.title}</h3>
                  {completed ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-success shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                    </span>
                  ) : rec ? (
                    <span className="text-xs font-semibold text-primary shrink-0">
                      In progress{totalTasks > 0 ? ` · ${doneTasks}/${totalTasks} practice` : ''}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground shrink-0">Not started</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{m.blurb}</p>
              </div>
              <button
                onClick={() => startTrainingSession(m.key)}
                className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors hover:opacity-90 bg-primary text-primary-foreground mt-auto"
              >
                {completed
                  ? <><RotateCcw className="w-3.5 h-3.5" /> Retake training</>
                  : rec
                    ? <><PlayCircle className="w-3.5 h-3.5" /> Resume training</>
                    : <><PlayCircle className="w-3.5 h-3.5" /> Start training</>}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}