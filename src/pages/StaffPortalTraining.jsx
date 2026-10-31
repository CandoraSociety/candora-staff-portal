import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { GraduationCap } from 'lucide-react';
import { TRAINING_MODULES, TRAINING_MODULE_ACCESS } from '@/lib/training/trainingModules';
import { groupModulesBySection } from '@/lib/training/moduleSections';
import { startTrainingSession } from '@/lib/training/trainingSession';
import { useSupervisorAccess } from '@/lib/useSupervisorAccess';
import ConfirmDialog from '@/components/training/ConfirmDialog';
import TrainingModuleCard from '@/components/training/TrainingModuleCard';

// Sidebar tab listing every training module the signed-in staff member can
// take, grouped by the portal each one teaches — modules for portals they
// don't have access to are not shown.
export default function StaffPortalTraining() {
  const { user, access } = useOutletContext();
  const [retakeModule, setRetakeModule] = useState(null);

  const { data: progress = [] } = useQuery({
    queryKey: ['trainingProgress', user?.email],
    queryFn: () => base44.entities.TrainingProgress.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const { isSupervisor } = useSupervisorAccess();

  // Only the training for portals this user can actually access; optional
  // supervisor add-ons appear only for staff who actually supervise someone
  const modules = TRAINING_MODULES.filter(m => {
    const requiredPortal = TRAINING_MODULE_ACCESS[m.key];
    if (requiredPortal && !access?.canAccessModule?.(requiredPortal)) return false;
    if (m.supervisorOnly && !isSupervisor) return false;
    return true;
  });

  const sections = groupModulesBySection(modules);
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

      {sections.map(section => {
        const sectionDone = section.modules.filter(m => progress.find(p => p.portal_key === m.key)?.is_completed).length;
        return (
          <section key={section.key} className="space-y-3">
            <div className="flex items-baseline justify-between gap-3 border-b pb-2">
              <h2 className="font-display text-lg font-bold tracking-wide">{section.title}</h2>
              <span className="text-xs text-muted-foreground shrink-0">
                {sectionDone}/{section.modules.length} completed
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {section.modules.map(m => (
                <TrainingModuleCard
                  key={m.key}
                  module={m}
                  record={progress.find(p => p.portal_key === m.key)}
                  onStart={handleStart}
                />
              ))}
            </div>
          </section>
        );
      })}

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