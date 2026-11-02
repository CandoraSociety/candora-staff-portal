import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, X, Users } from "lucide-react";
import { STATUS_OPTIONS, STATUS_LABELS } from "@/lib/training/trainingCompletion";

const inputCls = "w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30";

// Who finished this training day, and when. Each row is written to the staff
// member's record, so it shows on their profile in the HR portal — replacing
// the paper competency sign-off sheet.
export default function PlanCompletionCard({ plan }) {
  const qc = useQueryClient();
  const [pick, setPick] = useState("");

  const { data: employees = [] } = useQuery({
    queryKey: ["employees-for-training"],
    queryFn: () => base44.entities.Employee.list("-created_date", 500),
  });

  const { data: completions = [] } = useQuery({
    queryKey: ["training-completions", plan.id],
    queryFn: () => base44.entities.TrainingCompletion.filter({ plan_id: plan.id }, "-created_date", 200),
    enabled: !!plan.id,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["training-completions", plan.id] });

  const add = useMutation({
    mutationFn: async (employee) => {
      const me = await base44.auth.me();
      return base44.entities.TrainingCompletion.create({
        employee_id: employee.id,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        employee_email: employee.email,
        plan_id: plan.id,
        plan_title: plan.title || "Training day",
        plan_date: plan.plan_date || "",
        status: "completed",
        completion_date: plan.plan_date || new Date().toISOString().split("T")[0],
        recorded_by_name: me?.full_name || "",
      });
    },
    onSuccess: () => { setPick(""); refresh(); },
  });

  const update = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TrainingCompletion.update(id, data),
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: (id) => base44.entities.TrainingCompletion.delete(id),
    onSuccess: refresh,
  });

  const staff = employees.filter(e => !e.is_deleted && e.status !== "terminated");
  const recorded = staff.filter(e => completions.some(c => c.employee_email === e.email || c.employee_id === e.id));
  const available = staff.filter(e => !recorded.includes(e));

  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="mb-3">
        <h2 className="font-bold flex items-center gap-2"><Users className="w-4 h-4" /> Completion</h2>
        <p className="text-xs text-muted-foreground">
          Recorded on each staff member's profile, visible in the HR portal. Status and date, not a paper sign-off.
        </p>
      </div>

      {!plan.id && (
        <p className="text-sm text-muted-foreground">Save this plan once before recording completion.</p>
      )}

      {plan.id && (
        <>
          <div className="flex flex-wrap gap-2 mb-3">
            <select value={pick} onChange={(e) => setPick(e.target.value)} className={`${inputCls} sm:w-72`}>
              <option value="">Add a staff member…</option>
              {available.map(e => (
                <option key={e.id} value={e.id}>{e.first_name} {e.last_name}{e.position ? ` — ${e.position}` : ""}</option>
              ))}
            </select>
            <button
              onClick={() => { const e = staff.find(s => s.id === pick); if (e) add.mutate(e); }}
              disabled={!pick || add.isPending}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border text-xs font-semibold hover:bg-accent disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" /> Record
            </button>
          </div>

          <div className="space-y-2">
            {completions.length === 0 && <p className="text-sm text-muted-foreground">No one recorded for this day yet.</p>}
            {completions.map(c => (
              <div key={c.id} className="grid gap-2 sm:grid-cols-[1.4fr_1fr_auto_auto] items-center rounded-lg border p-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{c.employee_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.employee_email}</p>
                </div>
                <select
                  value={c.status}
                  onChange={(e) => update.mutate({ id: c.id, data: { status: e.target.value } })}
                  className={inputCls}
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
                <input
                  type="date"
                  value={c.completion_date || ""}
                  onChange={(e) => update.mutate({ id: c.id, data: { completion_date: e.target.value } })}
                  className={inputCls}
                />
                <button
                  onClick={() => remove.mutate(c.id)}
                  className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-accent justify-self-start"
                  title="Remove"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}