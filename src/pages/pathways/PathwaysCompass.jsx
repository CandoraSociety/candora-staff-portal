import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ClipboardList, CheckCircle } from 'lucide-react';

const WORKERS = [
  { email: 'priscilla@candorasociety.com', name: 'Priscilla' },
  { email: 'lola@candorasociety.com', name: 'Lola' },
  { email: 'john@candorasociety.com', name: 'John' },
  { email: 'Dawn.williston@candorasociety.com', name: 'Dawn' },
  { email: 'olena@candorasociety.com', name: 'Olena' },
];

export default function PathwaysCompass() {
  const queryClient = useQueryClient();
  const [selectedWorker, setSelectedWorker] = useState('all');
  
  const { data: tasks = [] } = useQuery({
    queryKey: ['pathways-compass-tasks'],
    queryFn: () => base44.entities.CompassTask.list('-created_date', 500),
  });
  
  const completeTaskMutation = useMutation({
    mutationFn: async ({ id, completed_by, completed_by_name }) => {
      await base44.entities.CompassTask.update(id, {
        status: 'completed',
        completed_by,
        completed_by_name,
        completed_date: new Date().toISOString().split('T')[0],
      });
    },
    onSuccess: () => {
      toast.success('Task marked as completed');
      queryClient.invalidateQueries({ queryKey: ['pathways-compass-tasks'] });
    },
  });
  
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  
  const tasksByWorker = WORKERS.map(w => ({
    worker: w,
    pending: pendingTasks.filter(t => t.assigned_worker === w.email),
    completed: completedTasks.filter(t => t.assigned_worker === w.email),
  }));
  
  const actionPlanTasks = pendingTasks.filter(t => t.task_type === 'action_plan');
  const otherTasks = pendingTasks.filter(t => t.task_type !== 'action_plan');
  
  const filteredTasks = selectedWorker === 'all' 
    ? pendingTasks 
    : pendingTasks.filter(t => t.assigned_worker === selectedWorker);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Compass Tasks</h1>
        <p className="text-sm text-slate-600">Manage government database entry tasks</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {WORKERS.map(w => {
          const count = pendingTasks.filter(t => t.assigned_worker === w.email).length;
          return (
            <button
              key={w.email}
              onClick={() => setSelectedWorker(selectedWorker === w.email ? 'all' : w.email)}
              className={`p-4 rounded-lg border text-left ${selectedWorker === w.email ? 'border-primary bg-primary/10' : 'hover:bg-slate-50'}`}
            >
              <p className="font-medium">{w.name}</p>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-slate-600">pending tasks</p>
            </button>
          );
        })}
      </div>
      
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingTasks.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-4">
          {actionPlanTasks.length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader><CardTitle className="flex items-center gap-2 text-orange-800"><ClipboardList className="h-5 w-5" /> Action Plan Tasks (Priority)</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {actionPlanTasks.map(t => (
                    <TaskCard key={t.id} task={t} onComplete={completeTaskMutation.mutate} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader><CardTitle>Other Tasks ({otherTasks.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {otherTasks.map(t => (
                  <TaskCard key={t.id} task={t} onComplete={completeTaskMutation.mutate} />
                ))}
                {otherTasks.length === 0 && <p className="text-center text-slate-500 py-8">No other tasks</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed">
          <Card>
            <CardHeader><CardTitle>Completed Tasks ({completedTasks.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {completedTasks.slice(0, 50).map(t => (
                  <div key={t.id} className="p-3 border rounded-lg opacity-75">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium line-through">{t.title}</p>
                        <p className="text-sm text-slate-600">Client: {t.client_name}</p>
                        <p className="text-xs text-slate-500">Completed: {t.completed_by_name} on {t.completed_date}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Done</Badge>
                    </div>
                  </div>
                ))}
                {completedTasks.length === 0 && <p className="text-center text-slate-500 py-8">No completed tasks</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TaskCard({ task, onComplete }) {
  return (
    <div className="p-4 border rounded-lg bg-white">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-medium">{task.title}</p>
          <p className="text-sm text-slate-600 mt-1">{task.instructions}</p>
          <div className="flex gap-2 mt-2">
            <Badge>{task.task_type}</Badge>
            <Badge variant="outline">Client: {task.client_name}</Badge>
            {task.compass_hsid && <Badge variant="outline">HSID: {task.compass_hsid}</Badge>}
          </div>
        </div>
        <Button size="sm" onClick={() => onComplete({ id: task.id, completed_by: 'current_user', completed_by_name: 'Current User' })}>
          <CheckCircle className="h-4 w-4 mr-2" /> Mark Complete
        </Button>
      </div>
    </div>
  );
}