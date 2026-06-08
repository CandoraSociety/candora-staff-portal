import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle } from 'lucide-react';

export default function PathwaysCompass() {
  const { data: tasks = [] } = useQuery({
    queryKey: ['pathways-compass-tasks'],
    queryFn: () => base44.entities.CompassTask.list('-created_date', 100),
  });
  
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  
  const completeTask = async (taskId) => {
    await base44.entities.CompassTask.update(taskId, {
      status: 'completed',
      completed_date: new Date().toISOString().split('T')[0],
    });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Compass Task Queue</h1>
        <p className="text-sm text-slate-600">Manage government database tasks</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Tasks ({pendingTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingTasks.map((task) => (
                <div key={task.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-slate-600">{task.client_name}</p>
                      <Badge variant="outline" className="mt-1">{task.task_type}</Badge>
                    </div>
                    <Button size="sm" onClick={() => completeTask(task.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Complete
                    </Button>
                  </div>
                  {task.instructions && (
                    <p className="text-sm text-slate-600 mt-2">{task.instructions}</p>
                  )}
                </div>
              ))}
              {pendingTasks.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <p>No pending tasks</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Completed ({completedTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedTasks.slice(0, 10).map((task) => (
                <div key={task.id} className="p-3 border rounded-lg bg-slate-50">
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-slate-600">{task.client_name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Completed: {task.completed_date}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}