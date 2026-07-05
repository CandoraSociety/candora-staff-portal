import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Flag, ChevronRight, ChevronDown, StickyNote, ListChecks } from "lucide-react";

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

  const updateTask = (id, updates) => {
    onChange(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
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
                  onUpdate={(updates) => updateTask(task.id, updates)}
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
                  onUpdate={(updates) => updateTask(task.id, updates)}
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

function TaskItem({ task, onToggle, onDelete, onUpdate, completed = false }) {
  const [expanded, setExpanded] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  const subtasks = task.subtasks || [];
  const completedSubs = subtasks.filter(s => s.done).length;

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    const updated = [...subtasks, { id: `sub_${Date.now()}`, text: newSubtask.trim(), done: false }];
    onUpdate({ subtasks: updated });
    setNewSubtask("");
  };

  const toggleSubtask = (subId) => {
    onUpdate({ subtasks: subtasks.map(s => s.id === subId ? { ...s, done: !s.done } : s) });
  };

  const deleteSubtask = (subId) => {
    onUpdate({ subtasks: subtasks.filter(s => s.id !== subId) });
  };

  const hasDetails = subtasks.length > 0 || task.notes;

  return (
    <div className="rounded-md hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-2 p-2">
        {(subtasks.length > 0 || task.notes) && (
          <button onClick={() => setExpanded(e => !e)} className="shrink-0 text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        )}
        {!(subtasks.length > 0 || task.notes) && <div className="w-3.5 shrink-0" />}
        <input
          type="checkbox"
          checked={task.done}
          onChange={onToggle}
          className="rounded border-border shrink-0"
        />
        <span className={task.done || completed ? "line-through text-muted-foreground" : "text-sm"}>{task.text}</span>
        {subtasks.length > 0 && (
          <span className="text-xs text-muted-foreground">{completedSubs}/{subtasks.length}</span>
        )}
        <div className="flex items-center gap-0.5 ml-auto">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setShowNotes(s => !s); setExpanded(true); }} title="Notes">
            <StickyNote className="w-3 h-3 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpanded(true)} title="Add subtask">
            <ListChecks className="w-3 h-3 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDelete}>
            <Trash2 className="w-3 h-3 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="pl-9 pr-2 pb-2 space-y-2">
          {/* Subtasks */}
          <div className="space-y-1">
            {subtasks.map(sub => (
              <div key={sub.id} className="flex items-center gap-2 group">
                <input
                  type="checkbox"
                  checked={sub.done}
                  onChange={() => toggleSubtask(sub.id)}
                  className="rounded border-border h-3.5 w-3.5"
                />
                <span className={`text-xs flex-1 ${sub.done ? "line-through text-muted-foreground" : ""}`}>{sub.text}</span>
                <button onClick={() => deleteSubtask(sub.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-1.5">
            <Input
              placeholder="Add a subtask..."
              value={newSubtask}
              onChange={e => setNewSubtask(e.target.value)}
              onKeyPress={e => e.key === "Enter" && addSubtask()}
              className="h-7 text-xs"
            />
            <Button onClick={addSubtask} size="icon" className="h-7 w-7 shrink-0">
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          {/* Notes */}
          {showNotes || task.notes ? (
            <Textarea
              placeholder="Add notes..."
              value={task.notes || ""}
              onChange={e => onUpdate({ notes: e.target.value })}
              className="text-xs min-h-[60px] resize-y"
            />
          ) : null}
        </div>
      )}
    </div>
  );
}