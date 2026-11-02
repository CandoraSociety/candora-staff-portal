import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { TRAINING_MODULES, getTrainingModule } from "@/lib/training/trainingModules";
import ConfirmDialog from "@/components/training/ConfirmDialog";
import { RefreshCw, RotateCcw, Users } from "lucide-react";

// Who has finished what, module by module: pick a module on the left, read the
// room on the right.
export default function TrainingProgressTab() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(TRAINING_MODULES[0].key);
  const [resetTarget, setResetTarget] = useState(null);

  const { data: progressList = [] } = useQuery({
    queryKey: ["training-progress"],
    queryFn: () => base44.entities.TrainingProgress.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["training-users"],
    queryFn: () => base44.entities.User.list(),
  });

  const module = getTrainingModule(selected);
  const byUser = {};
  for (const p of progressList) {
    if (p.portal_key === selected && p.user_email) byUser[p.user_email.toLowerCase()] = p;
  }

  const completedFor = (key) =>
    progressList.filter(p => p.portal_key === key && p.is_completed).length;

  const statusOf = (u) => {
    const p = byUser[(u.email || "").toLowerCase()];
    if (!p) return { label: "Not started", color: "hsl(230, 25%, 60%)", bg: "hsl(230, 50%, 18%)" };
    if (p.is_completed) return { label: "Completed", color: "hsl(152, 55%, 55%)", bg: "hsl(152, 45%, 16%)" };
    if (p.tour_done) return { label: "Practice remaining", color: "hsl(35, 85%, 60%)", bg: "hsl(35, 60%, 18%)" };
    return { label: "In progress", color: "hsl(45, 85%, 60%)", bg: "hsl(45, 60%, 18%)" };
  };

  const confirmResetProgress = async () => {
    const p = resetTarget;
    setResetTarget(null);
    if (!p) return;
    await base44.entities.TrainingProgress.delete(p.id);
    queryClient.invalidateQueries({ queryKey: ["training-progress"] });
  };

  const completedCount = users.filter(u => statusOf(u).label === "Completed").length;

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      {/* Module list */}
      <div className="rounded-2xl border bg-card overflow-hidden self-start">
        <div className="px-4 py-3 border-b bg-muted/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Modules</p>
        </div>
        <div className="max-h-[520px] overflow-y-auto divide-y">
          {TRAINING_MODULES.map(m => {
            const done = completedFor(m.key);
            const active = selected === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setSelected(m.key)}
                className={`w-full text-left px-4 py-2.5 transition-colors ${active ? "" : "hover:bg-accent"}`}
                style={active ? { background: "hsl(45, 92%, 53%, 0.18)", borderLeft: "3px solid hsl(45, 92%, 53%)" } : { borderLeft: "3px solid transparent" }}
              >
                <p className="text-sm font-medium leading-snug">{m.shortTitle || m.title}</p>
                <p className="text-xs text-muted-foreground">{done} of {users.length} completed</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* The selected module */}
      <div className="space-y-4 min-w-0">
        <div className="rounded-2xl border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold">{module.title}</h2>
              <p className="text-sm text-muted-foreground">{module.blurb}</p>
            </div>
            <div className="flex items-center gap-2 text-sm shrink-0">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">{completedCount} of {users.length} staff completed</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Staff progress</p>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["training-progress"] })}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium hover:bg-accent"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/20 text-left">
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
                            onClick={() => setResetTarget(p)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors"
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
        </div>

        <p className="text-xs text-muted-foreground">
          Progress records staff create appear here in real time — refresh to see the latest. Each module's tour and
          practice run on simulated data, so training never touches live client records.
        </p>
      </div>

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