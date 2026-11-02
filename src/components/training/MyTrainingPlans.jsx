import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, GraduationCap, Loader2 } from "lucide-react";
import { getTrainingModule } from "@/lib/training/trainingModules";
import { planAppliesToStaff, planModuleKeys } from "@/lib/training/planAssignment";
import { STATUS_LABELS, STATUS_CLASSES } from "@/lib/training/trainingCompletion";

// Training days that belong to the signed-in staff member. The completion
// button only unlocks once every module on the plan is finished, and pressing
// it writes the completion (with today's date) straight to their HR record.
export default function MyTrainingPlans({ user, progress }) {
  const qc = useQueryClient();

  const { data: employee } = useQuery({
    queryKey: ["currentEmployee", user?.email],
    queryFn: () => base44.entities.Employee.filter({ email: user.email }).then(e => e[0] || null),
    enabled: !!user?.email,
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["trainingPlans"],
    queryFn: () => base44.entities.TrainingDayPlan.list("-created_date", 100),
  });

  const { data: completions = [] } = useQuery({
    queryKey: ["my-training-completions", user?.email],
    queryFn: () => base44.entities.TrainingCompletion.filter({ employee_email: user.email }),
    enabled: !!user?.email,
  });

  const markComplete = useMutation({
    mutationFn: async ({ plan, existing }) => {
      const data = {
        employee_id: employee?.id || "",
        employee_name: employee ? `${employee.first_name} ${employee.last_name}` : (user?.full_name || ""),
        employee_email: user.email,
        plan_id: plan.id,
        plan_title: plan.title || "Training day",
        plan_date: plan.plan_date || "",
        status: "completed",
        completion_date: new Date().toISOString().split("T")[0],
        recorded_by_name: user?.full_name || "",
      };
      return existing
        ? base44.entities.TrainingCompletion.update(existing.id, data)
        : base44.entities.TrainingCompletion.create(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-training-completions", user?.email] }),
  });

  const mine = plans.filter(p => planAppliesToStaff(p, employee, user));
  if (!mine.length) return null;

  return (
    <section className="space-y-3" data-tour="my-training-plans">
      <div className="flex items-center gap-2 border-b pb-2">
        <GraduationCap className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-display text-lg font-bold tracking-wide">My training days</h2>
      </div>

      <div className="grid gap-3">
        {mine.map(plan => {
          const keys = planModuleKeys(plan);
          const done = keys.filter(k => progress.find(p => p.portal_key === k)?.is_completed);
          const remaining = keys.filter(k => !done.includes(k));
          const record = completions.find(c => c.plan_id === plan.id);
          const finished = keys.length > 0 && remaining.length === 0;

          return (
            <div key={plan.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{plan.title || "Training day"}</p>
                  <p className="text-xs text-muted-foreground">
                    {keys.length ? `${done.length} of ${keys.length} modules finished` : "No modules on this plan yet"}
                    {plan.audience ? ` · ${plan.audience}` : ""}
                  </p>
                </div>
                {record?.status === "completed" ? (
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_CLASSES.completed}`}>
                    {STATUS_LABELS.completed}
                    {record.completion_date ? ` · ${record.completion_date}` : ""}
                  </span>
                ) : finished ? (
                  <button
                    onClick={() => markComplete.mutate({ plan, existing: record })}
                    disabled={markComplete.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
                    style={{ background: "hsl(45, 92%, 53%)", color: "hsl(230, 70%, 10%)" }}
                  >
                    {markComplete.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Mark training plan complete
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {record ? STATUS_LABELS[record.status] || record.status : `${remaining.length} module${remaining.length === 1 ? "" : "s"} to go`}
                  </span>
                )}
              </div>

              {keys.length > 0 && (
                <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(done.length / keys.length) * 100}%`, background: "hsl(45, 92%, 53%)" }} />
                </div>
              )}

              {!finished && remaining.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Still to finish: {remaining.map(k => getTrainingModule(k)?.shortTitle || getTrainingModule(k)?.title || k).join(", ")}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}