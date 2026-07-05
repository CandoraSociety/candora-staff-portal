import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Flag, ChevronRight, ChevronDown, StickyNote, ListChecks, Check, Link2, Unlink } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

const PRIORITY_LEVELS = [
  { value: "critical", label: "Critical", color: "bg-red-500", dot: "bg-red-500", text: "text-red-600" },
  { value: "high", label: "High", color: "bg-orange-500", dot: "bg-orange-500", text: "text-orange-600" },
  { value: "medium", label: "Medium", color: "bg-yellow-500", dot: "bg-yellow-500", text: "text-yellow-600" },
  { value: "low", label: "Low", color: "bg-green-500", dot: "bg-green-500", text: "text-green-600" },
];

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical only" },
  { value: "high", label: "High & up" },
  { value: "medium", label: "Medium & up" },
];

const levelOrder = { critical: 0, high: 1, medium: 2, low: 3 };

function getLevel(value) {
  return PRIORITY_LEVELS.find(l => l.value === value) || PRIORITY_LEVELS.find(l => l.value === "medium");
}

export default function TasksTab({ tasks = [], onChange, priorities = [], onPrioritiesChange }) {
  const [newTask, setNewTask] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [linkFilter, setLinkFilter] = useState("all");

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    onChange([
      ...tasks,
      {
        id: `task_${Date.now()}`,
        text: newTask.trim(),
        done: false,
        priority_level: newTaskPriority,
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

  const setPriority = (id, level) => {
    updateTask(id, { priority_level: level });
  };

  const filterRank = { all: 99, critical: 0, high: 1, medium: 2 };
  const filterMaxRank = filterRank[priorityFilter];

  const pendingTasks = tasks
    .filter(t => !t.done)
    .filter(t => levelOrder[t.priority_level || "medium"] <= filterMaxRank)
    .filter(t => {
      if (linkFilter === "all") return true;
      if (linkFilter === "unlinked") return !t.linked_priority_id;
      return t.linked_priority_id === linkFilter;
    })
    .sort((a, b) => {
      const la = levelOrder[a.priority_level || "medium"];
      const lb = levelOrder[b.priority_level || "medium"];
      if (la !== lb) return la - lb;
      return 0;
    });

  const completedTasks = tasks
    .filter(t => t.done)
    .filter(t => {
      if (linkFilter === "all") return true;
      if (linkFilter === "unlinked") return !t.linked_priority_id;
      return t.linked_priority_id === linkFilter;
    });

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
          <PrioritySelector
            level={newTaskPriority}
            onSelect={(level) => setNewTaskPriority(level)}
          />
          <Button onClick={handleAddTask} size="default">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Priority filter */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">Show:</span>
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setPriorityFilter(opt.value)}
            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
              priorityFilter === opt.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Link filter — only show if priorities exist */}
      {priorities.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1">Linked to:</span>
          <button
            type="button"
            onClick={() => setLinkFilter("all")}
            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
              linkFilter === "all"
                ? "bg-accent text-accent-foreground border-accent"
                : "bg-transparent text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setLinkFilter("unlinked")}
            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
              linkFilter === "unlinked"
                ? "bg-accent text-accent-foreground border-accent"
                : "bg-transparent text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            Unlinked
          </button>
          {priorities.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setLinkFilter(p.id)}
              className={`text-xs px-2 py-0.5 rounded-full border transition-colors max-w-[140px] truncate ${
                linkFilter === p.id
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-transparent text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>
      )}

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
                  priorities={priorities}
                  onToggle={() => toggleTask(task.id)}
                  onDelete={() => deleteTask(task.id)}
                  onUpdate={(updates) => updateTask(task.id, updates)}
                  onSetPriority={(level) => setPriority(task.id, level)}
                />
              ))}
            </div>
          )}

          {priorityTasks.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Flag className="w-3 h-3" /> Priority Sub-Tasks
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
                  priorities={priorities}
                  onToggle={() => toggleTask(task.id)}
                  onDelete={() => deleteTask(task.id)}
                  onUpdate={(updates) => updateTask(task.id, updates)}
                  onSetPriority={(level) => setPriority(task.id, level)}
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

function PrioritySelector({ level, onSelect, size = "w-3 h-3" }) {
  const lvl = getLevel(level);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={`Priority: ${lvl.label} (click to change)`}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 flex items-center justify-center w-9 h-9 rounded-md hover:bg-muted transition-colors"
        >
          <span className={`rounded-full ${size} ${lvl.dot}`} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="z-[200]">
        <DropdownMenuLabel>Set priority</DropdownMenuLabel>
        {PRIORITY_LEVELS.map(l => (
          <DropdownMenuItem
            key={l.value}
            onClick={() => onSelect(l.value)}
            className="gap-2 text-xs"
          >
            <span className={`rounded-full w-3 h-3 ${l.dot}`} />
            {l.label}
            {l.value === level && <Check className="w-3 h-3 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PriorityLink({ task, priorities = [], onLink }) {
  const linked = priorities.find(p => p.id === task.linked_priority_id);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={linked ? `Linked to: ${linked.title}` : "Link to a priority"}
          onClick={(e) => e.stopPropagation()}
          className={`shrink-0 flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
            linked
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          {linked ? <Link2 className="w-3 h-3" /> : <Unlink className="w-3 h-3" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="z-[200]">
        <DropdownMenuLabel>Link to priority</DropdownMenuLabel>
        {priorities.length === 0 && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">No priorities yet</div>
        )}
        {priorities.map(p => (
          <DropdownMenuItem
            key={p.id}
            onClick={() => onLink(p.id)}
            className="gap-2 text-xs"
          >
            <Flag className="w-3 h-3 text-muted-foreground" />
            <span className="truncate max-w-[160px]">{p.title}</span>
            {p.id === task.linked_priority_id && <Check className="w-3 h-3 ml-auto" />}
          </DropdownMenuItem>
        ))}
        {task.linked_priority_id && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onLink(null)}
              className="gap-2 text-xs text-muted-foreground"
            >
              <Unlink className="w-3 h-3" />
              Unlink
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TaskItem({ task, onToggle, onDelete, onUpdate, onSetPriority, priorities = [], completed = false }) {
  const [expanded, setExpanded] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(task.notes || "");

  useEffect(() => {
    setNotesDraft(task.notes || "");
  }, [task.notes]);

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

  const lvl = getLevel(task.priority_level);
  const linkedPriority = priorities.find(p => p.id === task.linked_priority_id);

  return (
    <div className="rounded-md hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-2 p-2">
        {(subtasks.length > 0 || task.notes) && (
          <button onClick={() => setExpanded(e => !e)} className="shrink-0 text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        )}
        {!(subtasks.length > 0 || task.notes) && <div className="w-3.5 shrink-0" />}
        <PrioritySelector
          level={task.priority_level || "medium"}
          onSelect={onSetPriority}
        />
        <input
          type="checkbox"
          checked={task.done}
          onChange={onToggle}
          className="rounded border-border shrink-0"
        />
        <span className={task.done || completed ? "line-through text-muted-foreground" : "text-sm"}>{task.text}</span>
        {linkedPriority && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1 shrink-0 max-w-[140px]">
            <Flag className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{linkedPriority.title}</span>
          </span>
        )}
        {subtasks.length > 0 && (
          <span className="text-xs text-muted-foreground">{completedSubs}/{subtasks.length}</span>
        )}
        <div className="flex items-center gap-0.5 ml-auto">
          <PriorityLink
            task={task}
            priorities={priorities}
            onLink={(priorityId) => onUpdate({ linked_priority_id: priorityId || undefined })}
          />
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
          {showNotes || task.notes || notesDraft ? (
            <Textarea
              placeholder="Add notes..."
              value={notesDraft}
              onChange={e => setNotesDraft(e.target.value)}
              onBlur={() => {
                if (notesDraft !== (task.notes || "")) {
                  onUpdate({ notes: notesDraft });
                }
              }}
              className="text-xs min-h-[60px] resize-y"
            />
          ) : null}
        </div>
      )}
    </div>
  );
}