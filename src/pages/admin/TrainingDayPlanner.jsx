import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Sparkles, Plus, CalendarDays, Clock, Users, User, Trash2, FileText } from "lucide-react";
import { planStats } from "@/lib/training/planTimeline";
import { pathwaysPlanSeed } from "@/lib/training/trainingDayPlans";
import TrainingDayAIBuilder from "@/components/training/plan/TrainingDayAIBuilder";
import ConfirmDialog from "@/components/training/ConfirmDialog";

const fmtDate = (d) => d ? new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "No date set";

// Saved training days: one per group or individual. Each opens into the
// editable agenda; new ones start blank, from the Pathways template, or from
// the assistant.
export default function TrainingDayPlanner() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAI, setShowAI] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["training-day-plans"],
    queryFn: () => base44.entities.TrainingDayPlan.list("-plan_date"),
  });

  const createPlan = async (data) => {
    const created = await base44.entities.TrainingDayPlan.create(data);
    queryClient.invalidateQueries({ queryKey: ["training-day-plans"] });
    navigate(`/admin/training-day/${created.id}`);
  };

  const newBlank = () => createPlan({
    title: "New training day",
    audience_type: "group",
    audience: "",
    plan_date: "",
    start_time: "09:00",
    summary: "",
    outcomes: [],
    setup: [],
    blocks: [
      { type: "admin", title: "Arrival and Test Mode check", minutes: 15, activities: [] },
    ],
    follow_up: [],
  });

  const confirmDelete = async () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    if (!target) return;
    await base44.entities.TrainingDayPlan.delete(target.id);
    queryClient.invalidateQueries({ queryKey: ["training-day-plans"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button
            onClick={() => navigate("/admin/training")}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Training Hub
          </button>
          <h1 className="text-2xl font-bold">Training day plans</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            An agenda per group or per person: dated, timed, with the module for each block, the Test Mode
            activities and the follow-up list. Build one with the assistant, or from a template.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAI(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
            style={{ background: "hsl(45, 92%, 53%)", color: "hsl(230, 70%, 10%)" }}
          >
            <Sparkles className="w-4 h-4" /> Build with assistant
          </button>
          <button onClick={newBlank} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent">
            <Plus className="w-4 h-4" /> Blank plan
          </button>
          <button
            onClick={() => createPlan(pathwaysPlanSeed())}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent"
          >
            <FileText className="w-4 h-4" /> Pathways template
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading plans…</p>
      ) : plans.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <CalendarDays className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="font-semibold">No training days yet</p>
          <p className="text-sm text-muted-foreground mt-1">Start with the assistant — describe the group and the time you have.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {plans.map(p => {
            const stats = planStats(p);
            return (
              <div key={p.id} className="rounded-2xl border bg-card p-4 hover:border-primary/40 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <button onClick={() => navigate(`/admin/training-day/${p.id}`)} className="text-left flex-1 min-w-0">
                    <h2 className="font-bold leading-snug truncate">{p.title}</h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                      {p.audience_type === "individual" ? <User className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                      {p.audience || (p.audience_type === "individual" ? "One person" : "Group")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {fmtDate(p.plan_date)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {stats.endTime} · {stats.teaching} min teaching</span>
                    </p>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(p)}
                    className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-accent"
                    title="Delete plan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TrainingDayAIBuilder
        open={showAI}
        onClose={() => setShowAI(false)}
        onCreated={(plan) => {
          queryClient.invalidateQueries({ queryKey: ["training-day-plans"] });
          setShowAI(false);
          navigate(`/admin/training-day/${plan.id}`);
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete “${deleteTarget?.title || "this plan"}”?`}
        description="The agenda and its content will be removed. This can be undone by an administrator from deleted records."
        confirmLabel="Delete plan"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  );
}