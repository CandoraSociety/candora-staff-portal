import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Flag } from "lucide-react";

export default function TasksTab({ tasks = [], onChange, priorities = [], onPrioritiesChange }) {
  const [newTask, setNewTask] = useState("");

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    onChange([
      ...tasks,
      {
        id: `task_${Date.now()}`,
        text: newTask.trim(),
        done: false,
        created_at: new Date().toISOString(),
      },
    ]);
    setNewTask("");
  };

  const toggleTask = (id) => {
    onChange(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTask = (id) => {
    onChange(tasks.filter(t => t.id !== id));
  };

  const pendingTasks = tasks.filter(t => !t.done);
  const completedTasks = tasks.filter(t => t.done);

  const priorityTasks = priorities.flatMap(p =>
    (p.tasks || []).map(t => ({ ...t, priorityTitle: p.title, priorityId: p.id }))
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2">My Tasks</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Add a new task"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddTask()}
            className="h-9"
          />
          <Button onClick={handleAddTask} size="default">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {pendingTasks.length === 0 && completedTasks.length === 0 && priorityTasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No tasks yet. Add your first task above!
        </div>
      ) : (
        <>
          {pendingTasks.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending</h4>
              {pendingTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={() => toggleTask(task.id)}
                  onDelete={() => deleteTask(task.id)}
                />
              ))}
            </div>
          )}

          {priorityTasks.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Flag className="w-3 h-3" /> From Priorities
              </h4>
              {priorityTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/30 text-sm">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => onPrioritiesChange(
                      priorities.map(p =>
                        p.id === task.priorityId
                          ? { ...p, tasks: p.tasks.map(t => t.id === task.id ? { ...t, done: !t.done } : t) }
                          : p
                      )
                    )}
                    className="rounded border-border"
                  />
                  <span className={task.done ? "line-through text-muted-foreground" : ""}>{task.text}</span>
                  <span className="text-xs text-muted-foreground ml-auto">({task.priorityTitle})</span>
                </div>
              ))}
            </div>
          )}

          {completedTasks.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Completed</h4>
              {completedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={() => toggleTask(task.id)}
                  onDelete={() => deleteTask(task.id)}
                  completed
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TaskItem({ task, onToggle, onDelete, completed = false }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/30 transition-colors">
      <input
        type="checkbox"
        checked={task.done}
        onChange={onToggle}
        className="rounded border-border"
      />
      <span className={task.done || completed ? "line-through text-muted-foreground" : "text-sm"}>{task.text}</span>
      <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={onDelete}>
        <Trash2 className="w-3 h-3 text-muted-foreground" />
      </Button>
    </div>
  );
}