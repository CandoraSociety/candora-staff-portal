import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flag, Plus, Trash2, List, Grid, Calendar, ChevronDown, Sparkles, Pencil, Check, X } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { motion } from "framer-motion";
import PriorityCoach from "./PriorityCoach";

const PRIORITY_LEVELS = [
  { value: "critical", label: "Critical", color: "bg-red-500" },
  { value: "high", label: "High", color: "bg-orange-500" },
  { value: "medium", label: "Medium", color: "bg-yellow-500" },
  { value: "low", label: "Low", color: "bg-green-500" },
];

export default function PrioritiesTab({ priorities = [], onChange, focusToday, onPlanReady }) {
  const [viewMode, setViewMode] = useState("list");
  const [newTask, setNewTask] = useState("");
  const [expandedPriorities, setExpandedPriorities] = useState({});
  const [showCoach, setShowCoach] = useState(false);
  const [editingPriority, setEditingPriority] = useState(null); // { id, title, due_date, priority_level }
  const [newPriority, setNewPriority] = useState({
    title: "",
    due_date: "",
    priority_level: "medium",
    tasks: [],
  });

  const handleAddPriority = () => {
    if (!newPriority.title.trim()) return;
    onChange([
      ...priorities,
      {
        id: `priority_${Date.now()}`,
        ...newPriority,
        created_at: new Date().toISOString(),
      },
    ]);
    setNewPriority({ title: "", due_date: "", priority_level: "medium", tasks: [] });
  };

  const deletePriority = (id) => {
    onChange(priorities.filter(p => p.id !== id));
  };

  const updatePriority = (id, updates) => {
    onChange(priorities.map(p => (p.id === id ? { ...p, ...updates } : p)));
  };

  const addTask = (priorityId, taskText) => {
    if (!taskText.trim()) return;
    onChange(priorities.map(p =>
      p.id === priorityId
        ? { ...p, tasks: [...p.tasks, { id: `task_${Date.now()}`, text: taskText, done: false }] }
        : p
    ));
  };

  const toggleTask = (priorityId, taskId) => {
    onChange(priorities.map(p =>
      p.id === priorityId
        ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t) }
        : p
    ));
  };

  const deleteTask = (priorityId, taskId) => {
    onChange(priorities.map(p =>
      p.id === priorityId
        ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) }
        : p
    ));
  };

  const toggleExpand = (id) => {
    setExpandedPriorities(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const saveEdit = () => {
    if (!editingPriority || !editingPriority.title.trim()) return;
    updatePriority(editingPriority.id, {
      title: editingPriority.title,
      due_date: editingPriority.due_date,
      priority_level: editingPriority.priority_level,
    });
    setEditingPriority(null);
  };

  const sortedPriorities = [...priorities].sort((a, b) => {
    const levelOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    if (levelOrder[a.priority_level] !== levelOrder[b.priority_level]) {
      return levelOrder[a.priority_level] - levelOrder[b.priority_level];
    }
    if (a.due_date && b.due_date) {
      return new Date(a.due_date) - new Date(b.due_date);
    }
    return 0;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Priorities</h3>
        <div className="flex items-center gap-1">
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")} className="h-7 px-2">
            <List className="w-3 h-3" />
          </Button>
          <Button variant={viewMode === "card" ? "default" : "outline"} size="sm" onClick={() => setViewMode("card")} className="h-7 px-2">
            <Grid className="w-3 h-3" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowCoach(true)} className="h-7 gap-1">
            <Flag className="w-3 h-3" /> Coach
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Input
          placeholder="New priority title..."
          value={newPriority.title}
          onChange={(e) => setNewPriority({ ...newPriority, title: e.target.value })}
          onKeyPress={(e) => e.key === "Enter" && handleAddPriority()}
          className="h-11 text-base w-full"
        />
        <div className="flex gap-2">
          <div className="relative flex-1">
            <label className="absolute -top-2 left-2 text-[10px] font-medium text-muted-foreground bg-background px-1 z-10">Due date</label>
            <Input
              type="date"
              value={newPriority.due_date}
              onChange={(e) => setNewPriority({ ...newPriority, due_date: e.target.value })}
              className="h-9 w-full"
            />
          </div>
          <Select value={newPriority.priority_level} onValueChange={(v) => setNewPriority({ ...newPriority, priority_level: v })}>
            <SelectTrigger className="h-9 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_LEVELS.map(level => (
                <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddPriority} size="default" className="h-9">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {sortedPriorities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No priorities yet. Add your first priority above!
        </div>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-3" : "space-y-2"}>
          {sortedPriorities.map((priority) => {
            const level = PRIORITY_LEVELS.find(l => l.value === priority.priority_level);
            const daysUntilDue = priority.due_date ? differenceInDays(new Date(priority.due_date), new Date()) : null;
            const isExpanded = expandedPriorities[priority.id];

            return (
              <Card key={priority.id} className={viewMode === "grid" ? "" : ""}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${level?.color}`} />
                    <div className="flex-1 min-w-0">
                      {editingPriority?.id === priority.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editingPriority.title}
                            onChange={(e) => setEditingPriority({ ...editingPriority, title: e.target.value })}
                            className="h-9 text-sm w-full"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <label className="absolute -top-2 left-2 text-[10px] font-medium text-muted-foreground bg-background px-1 z-10">Due date</label>
                              <Input
                                type="date"
                                value={editingPriority.due_date}
                                onChange={(e) => setEditingPriority({ ...editingPriority, due_date: e.target.value })}
                                className="h-9 w-full"
                              />
                            </div>
                            <Select value={editingPriority.priority_level} onValueChange={(v) => setEditingPriority({ ...editingPriority, priority_level: v })}>
                              <SelectTrigger className="h-9 w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PRIORITY_LEVELS.map(level => (
                                  <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button size="icon" className="h-9 w-9" onClick={saveEdit}>
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => setEditingPriority(null)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-medium truncate">{priority.title}</h4>
                        <div className="flex items-center gap-1 shrink-0">
                          {priority.due_date && (
                            <Badge variant={daysUntilDue < 0 ? "destructive" : daysUntilDue <= 3 ? "secondary" : "outline"} className="text-xs h-5 gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)}d overdue` : daysUntilDue === 0 ? "Due today" : `${daysUntilDue}d`}
                            </Badge>
                          )}
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingPriority({ id: priority.id, title: priority.title, due_date: priority.due_date || "", priority_level: priority.priority_level })}>
                            <Pencil className="w-3 h-3 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleExpand(priority.id)}>
                            <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deletePriority(priority.id)}>
                            <Trash2 className="w-3 h-3 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                      )}

                      {editingPriority?.id !== priority.id && isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-3 space-y-2"
                        >
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add sub-task"
                              value={newTask}
                              onChange={(e) => setNewTask(e.target.value)}
                              onKeyPress={(e) => e.key === "Enter" && addTask(priority.id, newTask)}
                              className="h-8 text-xs"
                            />
                            <Button onClick={() => { addTask(priority.id, newTask); setNewTask(""); }} size="sm" className="h-8">
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>

                          {priority.tasks.length > 0 && (
                            <div className="space-y-1">
                              {priority.tasks.map((task) => (
                                <div key={task.id} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={task.done}
                                    onChange={() => toggleTask(priority.id, task.id)}
                                    className="rounded border-border"
                                  />
                                  <span className={`text-xs ${task.done ? "line-through text-muted-foreground" : ""}`}>{task.text}</span>
                                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto" onClick={() => deleteTask(priority.id, task.id)}>
                                    <Trash2 className="w-2.5 h-2.5 text-muted-foreground" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!showCoach && priorities.length > 0 && (
        <button
          onClick={() => setShowCoach(true)}
          className="w-full mt-1 rounded-xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors py-3 px-4 flex items-center justify-center gap-2 text-sm text-primary font-medium"
        >
          <Sparkles className="w-4 h-4" />
          Can I help you with your priorities today?
        </button>
      )}

      {showCoach && (
        <PriorityCoach
          priorities={priorities}
          focusToday={focusToday}
          onClose={() => setShowCoach(false)}
          onPlanReady={onPlanReady}
        />
      )}
    </div>
  );
}