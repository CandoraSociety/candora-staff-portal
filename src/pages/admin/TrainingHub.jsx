import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { TRAINING_MODULES, getTrainingModule } from "@/lib/training/trainingModules";
import { startFacilitatedSession } from "@/lib/training/facilitatorSession";
import FacilitatorRunSheet from "@/components/training/FacilitatorRunSheet";
import ConfirmDialog from "@/components/training/ConfirmDialog";
import { GraduationCap, RefreshCw, RotateCcw, Presentation, Users, PlayCircle, FileText } from "lucide-react";

export default function TrainingHub() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(TRAINING_MODULES[0].key);
  const [showRunSheet, setShowRunSheet] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);

  const isAdmin = user?.role === "admin";

  const { data: progressList = [] } = useQuery({
    queryKey: ["training-progress"],
    queryFn: () => base44.entities.TrainingProgress.list(),
    enabled: isAdmin,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["training-users"],
    queryFn: () => base44.entities.User.list(),
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-md mx-auto mt-16">
        <div className="rounded-2xl border p-8 text-center" style={{ background: "hsl(230, 70%, 10%)", borderColor: "hsl(230, 50%, 22%)" }}>
          <GraduationCap className="w-10 h-10 mx-auto mb-3" style={{ color: "hsl(45, 92%, 53%)" }} />
          <h2 className="text-lg font-bold mb-1" style={{ color: "hsl(45, 60%, 90%)" }}>Admins only</h2>
          <p className="text-sm" style={{ color: "hsl(230, 25%, 60%)" }}>
            The Training Hub shows every staff member's training progress. Ask an administrator for access.
          </p>
        </div>
      </div>
    );
  }

  const module = getTrainingModule(selected);
  const byUser = {};
  for (const p of progressList) {
    if (p.portal_key === selected && p.user_email) {
      byUser[p.user_email.toLowerCase()] = p;
    }
  }

  const statusOf = (u) => {
    const p = byUser[(u.email || "").toLowerCase()];
    if (!p) return { label: "Not started", color: "hsl(230, 25%, 60%)", bg: "hsl(230, 50%, 18%)" };
    if (p.is_completed) return { label: "Completed", color: "hsl(152, 55%, 55%)", bg: "hsl(152, 45%, 16%)" };
    if (p.tour_done) return { label: "Practice remaining", color: "hsl(35, 85%, 60%)", bg: "hsl(35, 60%, 18%)" };
    return { label: "In progress", color: "hsl(45, 85%, 60%)", bg: "hsl(45, 60%, 18%)" };
  };

  // Confirmation goes through the in-app dialog — the native window.confirm
  // is blocked in the preview frame and would silently swallow the click.
  const resetProgress = (p) => setResetTarget(p);
  const confirmResetProgress = async () => {
    const p = resetTarget;
    setResetTarget(null);
    if (!p) return;
    await base44.entities.TrainingProgress.delete(p.id);
    queryClient.invalidateQueries({ queryKey: ["training-progress"] });
  };

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["training-progress"] });

  const completedCount = users.filter(u => statusOf(u).label === "Completed").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Training Hub</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Staff start training themselves from the Training button inside each portal. Use this page to track everyone's
            progress — or run a facilitated session: project the tour on a screen with presentation mode
            (<Presentation className="w-3.5 h-3.5 inline" />), and watch the table below update as each person finishes.
          </p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-accent shrink-0"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Module selector */}
      <div className="flex flex-wrap gap-2">
        {TRAINING_MODULES.map(m => (
          <button
            key={m.key}
            onClick={() => setSelected(m.key)}
            className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${selected === m.key ? "border-primary" : "border-border hover:bg-accent"}`}
            style={selected === m.key
              ? { background: "hsl(45, 92%, 53%)", color: "hsl(230, 70%, 10%)" }
              : undefined}
          >
            {m.shortTitle || m.title}
          </button>
        ))}
      </div>

      {/* Module summary */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold">{module.title}</h2>
            <p className="text-sm text-muted-foreground">{module.blurb}</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold">{completedCount} of {users.length} staff completed</span>
          </div>
        </div>
      </div>

      {/* Facilitate this module — run a live session / print the run-sheet */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-bold">Facilitate: {module.title}</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Run a live session: the portal opens on simulated data with the tour already in presentation
              mode for the projector, and your own talking-points panel beside it — your personal training
              progress is never touched.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => startFacilitatedSession(module)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors hover:opacity-90"
              style={{ background: "hsl(45, 92%, 53%)", color: "hsl(230, 70%, 10%)" }}
            >
              <PlayCircle className="w-4 h-4" /> Start facilitated session
            </button>
            <button
              onClick={() => setShowRunSheet(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent"
            >
              <FileText className="w-4 h-4" /> Run-sheet
            </button>
          </div>
        </div>
      </div>

      {/* Staff table */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-4 py-3 font-semibold">Staff member</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Tour</th>
              <th className="px-4 py-3 font-semibold">Practice</th>
              <th className="px-4 py-3 font-semibold">Completed</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const p = byUser[(u.email || "").toLowerCase()];
              const s = statusOf(u);
              const doneTasks = p?.tasks_done?.length || 0;
              return (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ color: s.color, background: s.bg }}>
                      {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p?.tour_done ? "Done" : p ? "Started" : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p ? `${doneTasks}/${module.tasks.length}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p?.completed_date ? new Date(p.completed_date).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p && (
                      <button
                        onClick={() => resetProgress(p)}
                        className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors"
                        title="Reset this person's progress so they can retake the training"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reset
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Note: progress records staff create appear here in real time — refresh to see the latest. Each module's tour and
        practice run on simulated data, so training never touches live client records.
      </p>

      <FacilitatorRunSheet module={module} open={showRunSheet} onClose={() => setShowRunSheet(false)} />

      <ConfirmDialog
        open={!!resetTarget}
        onOpenChange={(o) => !o && setResetTarget(null)}
        title={`Reset training progress for ${resetTarget?.user_name || resetTarget?.user_email || ""}?`}
        description="Their progress for this module will be cleared so they can take it again from scratch."
        confirmLabel="Reset"
        destructive
        onConfirm={confirmResetProgress}
      />
    </div>
  );
}