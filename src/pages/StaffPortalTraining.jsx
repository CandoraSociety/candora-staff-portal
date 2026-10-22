import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { GraduationCap, CheckCircle2, PlayCircle, RotateCcw } from 'lucide-react';
import { TRAINING_MODULES, TRAINING_MODULE_ACCESS } from '@/lib/training/trainingModules';
import { startTrainingSession } from '@/lib/training/trainingSession';
import ConfirmDialog from '@/components/training/ConfirmDialog';

// Sidebar tab listing every training module the signed-in staff member can
// take — modules for portals they don't have access to are not shown.
export default function StaffPortalTraining() {
  const { user, access } = useOutletContext();
  const [retakeModule, setRetakeModule] = useState(null);

  const { data: progress = [] } = useQuery({
    queryKey: ['trainingProgress', user?.email],
    queryFn: () => base44.entities.TrainingProgress.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  // Only the training for portals this user can actually access
  const modules = TRAINING_MODULES.filter(m => {
    const requiredPortal = TRAINING_MODULE_ACCESS[m.key];
    return !requiredPortal || access?.canAccessModule?.(requiredPortal);
  });

  const completedCount = modules.filter(m => progress.find(p => p.portal_key === m.key)?.is_completed).length;

  // Retaking a completed module clears its saved progress (record + tour step)
  // so the training genuinely starts over from the first step. Confirmation
  // goes through the in-app dialog — the native confirm is blocked in the
  // preview frame and would silently swallow the click.
  const handleStart = (m, rec) => {
    if (rec?.is_completed) { setRetakeModule(m); return; }
    startTrainingSession(m.key);
  };

  const confirmRetake = async () => {
    const m = retakeModule;
    setRetakeModule(null);
    try {
      const rec = progress.find(p => p.portal_key === m?.key);
      if (rec) await base44.entities.TrainingProgress.delete(rec.id);
    } catch { /* ignore */ }
    try { sessionStorage.removeItem(`candora-tour-step-${m?.key}`); } catch { /* ignore */ }
    startTrainingSession(m?.key);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Staff Portal Training</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Guided tours with hands-on practice for every portal you have access to.
          Training runs on simulated demo data, so nothing you do while training affects real records.
        </p>
      </div>

      <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
        <span className="font-semibold">{completedCount} of {modules.length}</span> training modules completed
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {modules.map(m => {
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
                <p className="text-xs text-muted-foreground mt-1">
                  {m.steps?.length || 0} guided steps{totalTasks > 0 ? ` · ${totalTasks} practice tasks` : ''}
                </p>
              </div>
              <button
                onClick={() => handleStart(m, rec)}
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

      <ConfirmDialog
        open={!!retakeModule}
        onOpenChange={(o) => !o && setRetakeModule(null)}
        title={`Start the ${retakeModule?.shortTitle || retakeModule?.title || ""} training over from scratch?`}
        description="Your previous progress for this module will be cleared."
        confirmLabel="Start over"
        onConfirm={confirmRetake}
      />
    </div>
  );
}