import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Compass() {
  const { data: tasks = [] } = useQuery({
    queryKey: ['compass-tasks'],
    queryFn: () => base44.entities.CompassTask.list('-created_date', 100),
  });

  const pendingTasks = tasks.filter(t => t.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#1a237e]">Compass Tasks</h1>
        <p className="text-muted-foreground mt-1">Government database task queue</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Tasks ({pendingTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <div key={task.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground">{task.client_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{task.instructions}</p>
                  </div>
                  <Badge>{task.status}</Badge>
                </div>
              </div>
            ))}
            {pendingTasks.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No pending tasks</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}