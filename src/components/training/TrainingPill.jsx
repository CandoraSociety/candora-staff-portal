import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { GraduationCap, ListChecks, Map, LogOut, Users, CheckCircle2, ArrowLeft, RotateCcw } from "lucide-react";
import { getTrainingModule, moduleForPath } from "@/lib/training/trainingModules";
import { readSession, SESSION_KEY, startTrainingSession } from "@/lib/training/trainingSession";
import { readFacilitatorSession } from "@/lib/training/facilitatorSession";
import FacilitatorSession from "@/components/training/FacilitatorSession";
import SpotlightTour from "@/components/training/SpotlightTour";
import PracticeChecklist from "@/components/training/PracticeChecklist";



export default function TrainingPill() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [rec, setRec] = useState(undefined); // undefined = loading, null = none
  const [tourOpen, setTourOpen] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);

  const session = readSession();
  const fSession = readFacilitatorSession();
  // While a training session (learner or facilitated) is active, the module
  // stays pinned to that session's portal — tours like Time & Money walk
  // across several pages (time off, receipts, the dashboard), and the pill
  // must not flip to a different module mid-tour.
  const module = (session && getTrainingModule(session.portal))
    || (fSession && getTrainingModule(fSession.portal))
    || moduleForPath(location.pathname);
  const samePortalSession = session && module && session.portal === module.key ? session : null;
  const otherPortalSession = session && (!module || session.portal !== module.key) ? session : null;

  // Load this user's progress for the current module
  useEffect(() => {
    if (!user?.email || !module) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await base44.entities.TrainingProgress.filter({ user_email: user.email, portal_key: module.key });
        if (!cancelled) setRec(rows[0] || null);
      } catch {
        if (!cancelled) setRec(null);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.email, module?.key]);

  // Auto-launch the tour right after a training session starts (post-reload)
  useEffect(() => {
    const s = readSession();
    if (s?.autoStart && module && s.portal === module.key) {
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...s, autoStart: false })); } catch { /* ignore */ }
      setTourOpen(true);
    }
  }, [module?.key]);

  if (!user) return null;

  // A facilitated session (started from the Training Hub) takes over from the
  // normal learner UI: the facilitator gets the tour, talking points and
  // practice controls instead of personal training progress.
  if (fSession) {
    const fm = getTrainingModule(fSession.portal);
    if (module && fSession.portal === module.key) {
      return <FacilitatorSession module={module} />;
    }
    return (
      <div className="fixed bottom-4 left-4 z-[60] print:hidden">
        <button
          onClick={() => navigate(fm?.path || "/")}
          className="flex items-center gap-2 rounded-full border shadow-lg px-4 py-2 transition-transform hover:scale-[1.02]"
          style={{ background: "hsl(230, 70%, 10%)", borderColor: "hsl(45, 60%, 45%)" }}
        >
          <GraduationCap className="w-4 h-4" style={{ color: "hsl(45, 92%, 53%)" }} />
          <span className="text-xs font-semibold" style={{ color: "hsl(45, 60%, 85%)" }}>
            Facilitated session — back to {fm?.shortTitle || "training"}
          </span>
        </button>
      </div>
    );
  }

  const updateProgress = async (fields) => {
    if (!user?.email || !module) return;
    const base = { user_email: user.email, user_name: user.full_name || "", portal_key: module.key, portal_name: module.title };
    let next;
    if (rec) {
      next = await base44.entities.TrainingProgress.update(rec.id, fields);
    } else {
      next = await base44.entities.TrainingProgress.create({ ...base, started_date: new Date().toISOString(), ...fields });
    }
    const tasksDone = next.tasks_done || [];
    const allTasks = module.tasks.length > 0 && tasksDone.length >= module.tasks.length;
    if (next.tour_done && allTasks && !next.is_completed) {
      next = await base44.entities.TrainingProgress.update(next.id, { is_completed: true, completed_date: new Date().toISOString() });
    }
    setRec(next);
  };

  // Start a training session. When `resetProgress` is true, the user's saved
  // progress for this module is cleared first so the training starts over
  // from scratch (used by the Retake and Start over buttons).
  const startTraining = async (resetProgress = false) => {
    if (resetProgress) {
      const ok = window.confirm(
        `Start the ${module?.shortTitle || module?.title || ""} training over from scratch? ` +
        "Your previous progress for this module will be cleared."
      );
      if (!ok) return;
      try { if (rec) await base44.entities.TrainingProgress.delete(rec.id); } catch { /* ignore */ }
    }
    try { sessionStorage.removeItem(`candora-tour-step-${module?.key}`); } catch { /* ignore */ }
    startTrainingSession(module.key);
  };

  const exitTraining = () => {
    if (window.confirm("Exit Training Mode? Your training progress is saved; any demo data you created is discarded.")) {
      try {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem("candora-test-mode");
      } catch { /* ignore */ }
      window.location.reload();
    }
  };

  const totalTasks = module?.tasks?.length || 0;
  const doneTasks = rec?.tasks_done?.length || 0;
  const isAdmin = user?.role === "admin";

  // No module here — only show a "return to training" pill if a session is
  // active on another portal.
  if (!module) {
    if (!otherPortalSession) return null;
    const m = getTrainingModule(otherPortalSession.portal);
    return (
      <div className="fixed bottom-4 left-4 z-[60] print:hidden">
        <button
          onClick={() => navigate(m?.path || "/")}
          className="flex items-center gap-2 rounded-full border shadow-lg px-4 py-2 transition-transform hover:scale-[1.02]"
          style={{ background: "hsl(230, 70%, 10%)", borderColor: "hsl(45, 60%, 45%)" }}
        >
          <GraduationCap className="w-4 h-4" style={{ color: "hsl(45, 92%, 53%)" }} />
          <span className="text-xs font-semibold" style={{ color: "hsl(45, 60%, 85%)" }}>
            Training in progress — back to {m?.shortTitle || "training"}
          </span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Active training session on this portal */}
      {samePortalSession && (
        <div className="fixed bottom-4 left-4 z-[60] print:hidden">
          <div className="rounded-2xl border shadow-2xl px-3 py-2.5 flex items-center gap-2 flex-wrap max-w-[calc(100vw-32px)]" style={{ background: "hsl(230, 70%, 10%)", borderColor: "hsl(45, 60%, 45%)" }}>
            <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "hsl(45, 60%, 85%)" }}>
              <GraduationCap className="w-4 h-4" style={{ color: "hsl(45, 92%, 53%)" }} /> Training Mode
            </span>
            <button
              onClick={() => setTourOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors hover:opacity-80"
              style={rec?.tour_done
                ? { background: "hsl(152, 45%, 28%)", color: "hsl(152, 60%, 80%)" }
                : { background: "hsl(45, 92%, 53%)", color: "hsl(230, 70%, 10%)" }}
            >
              {rec?.tour_done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Map className="w-3.5 h-3.5" />}
              {rec?.tour_done ? "Tour done" : (rec ? "Resume tour" : "Guided tour")}
            </button>
            <button
              onClick={() => setChecklistOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors hover:opacity-80"
              style={{ background: "hsl(230, 55%, 20%)", color: "hsl(45, 60%, 85%)" }}
            >
              <ListChecks className="w-3.5 h-3.5" /> Practice {totalTasks ? `${doneTasks}/${totalTasks}` : ""}
            </button>
            <button
              onClick={() => startTraining(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors hover:opacity-80"
              style={{ background: "hsl(230, 55%, 20%)", color: "hsl(45, 60%, 85%)" }}
              title="Clear your progress and take this training again from the beginning"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Start over
            </button>
            <button
              onClick={exitTraining}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors hover:opacity-80"
              style={{ background: "hsl(0, 45%, 28%)", color: "hsl(0, 0%, 95%)" }}
            >
              <LogOut className="w-3.5 h-3.5" /> Exit
            </button>
            {isAdmin && (
              <Link to="/admin/training" className="p-1.5 rounded-lg hover:opacity-70" style={{ color: "hsl(230, 30%, 60%)" }} title="Training Hub">
                <Users className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* No session yet — offer training for this portal */}
      {!session && (
        <div className="fixed bottom-4 left-4 z-[60] print:hidden">
          <div className="rounded-full border shadow-lg px-4 py-2 flex items-center gap-2" style={{ background: "hsl(230, 70%, 10%)", borderColor: "hsl(230, 50%, 22%)" }}>
            <GraduationCap className="w-4 h-4" style={{ color: "hsl(45, 92%, 53%)" }} />
            <span className="text-xs" style={{ color: "hsl(230, 25%, 65%)" }}>
              {rec?.is_completed ? `${module.shortTitle} training complete` : `New to ${module.shortTitle || module.title}?`}
            </span>
            <button
              onClick={() => startTraining(rec?.is_completed)}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold transition-colors hover:opacity-80"
              style={{ background: rec ? "hsl(230, 55%, 20%)" : "hsl(45, 92%, 53%)", color: rec ? "hsl(45, 60%, 85%)" : "hsl(230, 70%, 10%)" }}
            >
              {rec?.is_completed ? "Retake" : (rec ? "Resume training" : "Start training")}
              {!rec?.is_completed && rec && <ArrowLeft className="w-3 h-3 rotate-180" />}
            </button>
          </div>
        </div>
      )}

      <SpotlightTour
        open={tourOpen}
        module={module}
        progress={rec || null}
        updateProgress={updateProgress}
        onClose={(finished) => { setTourOpen(false); if (finished) setChecklistOpen(true); }}
      />
      <PracticeChecklist
        open={checklistOpen}
        module={module}
        progress={rec || null}
        updateProgress={updateProgress}
        onClose={() => setChecklistOpen(false)}
      />
    </>
  );
}