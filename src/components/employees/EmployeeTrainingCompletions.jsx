import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap } from "lucide-react";
import { format } from "date-fns";
import { STATUS_LABELS, STATUS_CLASSES } from "@/lib/training/trainingCompletion";

// Training days this staff member attended, with completion status and date —
// recorded by the facilitator from the training plan editor.
export default function EmployeeTrainingCompletions({ employee }) {
  const { data: completions = [] } = useQuery({
    queryKey: ["employee-training-completions", employee?.email],
    queryFn: () => base44.entities.TrainingCompletion.filter({ employee_email: employee.email }, "-created_date", 100),
    enabled: !!employee?.email,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <GraduationCap className="w-4 h-4" />Training
        </CardTitle>
      </CardHeader>
      <CardContent>
        {completions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No training days recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {completions.map(c => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 p-3 bg-muted/30 rounded-lg text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{c.plan_title}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.plan_date ? `Ran ${format(new Date(`${c.plan_date}T12:00:00`), "MMM d, yyyy")}` : "Date not set"}
                    {c.completion_date ? ` · Completed ${format(new Date(`${c.completion_date}T12:00:00`), "MMM d, yyyy")}` : ""}
                    {c.recorded_by_name ? ` · Recorded by ${c.recorded_by_name}` : ""}
                  </p>
                </div>
                <Badge className={STATUS_CLASSES[c.status] || STATUS_CLASSES.not_started}>
                  {STATUS_LABELS[c.status] || c.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}