import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, ChevronDown, Plus, Trash2, CalendarDays, Check, Bell, MessageSquare } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import WeeklyBrainDump from "./WeeklyBrainDump";
import MissedTasksSection from "./MissedTasksSection";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekStart(date) {
  return startOfWeek(date, { weekStartsOn: 1 });
}

function formatTime(time) {
  if (!time) return null;
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 || 12;
  return `${display}:${m} ${ampm}`;
}

function isItemMissed(item) {
  if (item.done || item.status === "on_hold" || item.status === "missed") return false;
  if (!item.scheduled_date) return false;
  try {
    const dateStr = item.scheduled_date + (item.time ? `T${item.time}:00` : "T23:59:59");
    const scheduled = new Date(dateStr);
    return scheduled < new Date();
  } catch { return false; }
}

export default function WeeklyPlannerTab({ weeklyPlan = [], onChange, tasks = [], onNotesChange }) {
  const [currentWeek, setCurrentWeek] = useState(getWeekStart(new Date()));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [checkedKeys, setCheckedKeys] = useState(new Set());
  const [expandedTaskIds, setExpandedTaskIds] = useState(new Set());
  const [customText, setCustomText] = useState("");
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedTime, setSelectedTime] = useState("");

  const weekDays = useMemo(() => {
    return DAY_NAMES.map((name, i) => ({
      name,
      short: DAY_SHORT[i],
      date: addDays(currentWeek, i),
      items: weeklyPlan
        .filter(item => {
          if (!item.scheduled_date) return false;
          if (item.status === "on_hold") return false;
          try {
            return isSameDay(parseISO(item.scheduled_date), addDays(currentWeek, i));
          } catch { return false; }
        })
        .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99")),
    }));
  }, [currentWeek, weeklyPlan]);

  const todayIndex = useMemo(() => {
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      if (isSameDay(addDays(currentWeek, i), today)) return i;
    }
    return -1;
  }, [currentWeek]);

  // Detect missed items (date/time passed, not done, not on hold/missed yet)
  const missedItems = useMemo(() => {
    return weeklyPlan.filter(isItemMissed);
  }, [weeklyPlan]);

  const onHoldItems = useMemo(() => {
    return weeklyPlan.filter(item => item.status === "on_hold" && !item.done);
  }, [weeklyPlan]);

  const scheduledTaskIds = new Set(weeklyPlan.filter(i => i.task_id).map(i => i.task_id));
  const availableTasks = tasks.filter(t => !t.done && !scheduledTaskIds.has(t.id));

  const toggleTask = (task) => {
    const keys = new Set(checkedKeys);
    const subKeys = (task.subtasks || []).map(s => `${task.id}__sub__${s.id}`);
    const allKeys = [task.id, ...subKeys];
    const allChecked = allKeys.every(k => keys.has(k));
    if (allChecked) {
      allKeys.forEach(k => keys.delete(k));
    } else {
      allKeys.forEach(k => keys.add(k));
    }
    setCheckedKeys(keys);
  };

  const toggleSubtask = (taskId, subtask) => {
    const key = `${taskId}__sub__${subtask.id}`;
    const keys = new Set(checkedKeys);
    if (keys.has(key)) keys.delete(key);
    else keys.add(key);
    setCheckedKeys(keys);
  };

  const toggleExpand = (taskId) => {
    const ids = new Set(expandedTaskIds);
    if (ids.has(taskId)) ids.delete(taskId);
    else ids.add(taskId);
    setExpandedTaskIds(ids);
  };

  const addItems = () => {
    const dateStr = format(addDays(currentWeek, selectedDay), "yyyy-MM-dd");
    const newEntries = [];
    let ts = Date.now();

    checkedKeys.forEach(key => {
      let text, taskId;
      if (key.includes("__sub__")) {
        const [parentId, , subId] = key.split("__sub__");
        const parent = tasks.find(t => t.id === parentId);
        const sub = parent?.subtasks?.find(s => s.id === subId);
        if (!sub) return;
        text = sub.text;
        taskId = undefined;
      } else {
        const task = tasks.find(t => t.id === key);
        if (!task) return;
        text = task.text;
        taskId = key;
      }
      newEntries.push({
        id: `wp_${ts++}`,
        text,
        scheduled_date: dateStr,
        time: selectedTime || "",
        done: false,
        notes: "",
        status: "scheduled",
        reminder_sent: false,
        task_id: taskId || undefined,
      });
    });

    if (customText.trim()) {
      newEntries.push({
        id: `wp_${ts++}`,
        text: customText.trim(),
        scheduled_date: dateStr,
        time: selectedTime || "",
        done: false,
        notes: "",
        status: "scheduled",
        reminder_sent: false,
      });
    }

    if (newEntries.length === 0) return;
    onChange([...weeklyPlan, ...newEntries]);

    setCheckedKeys(new Set());
    setExpandedTaskIds(new Set());
    setCustomText("");
    setSelectedDay(0);
    setSelectedTime("");
    setDialogOpen(false);
  };

  const addItemsFromDump = (newItems) => {
    onChange([...weeklyPlan, ...newItems]);
  };

  const toggleItem = (id) => {
    onChange(weeklyPlan.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const deleteItem = (id) => {
    onChange(weeklyPlan.filter(item => item.id !== id));
  };

  const holdItem = (id) => {
    onChange(weeklyPlan.map(item => item.id === id ? { ...item, status: "on_hold" } : item));
  };

  const rescheduleItem = (id, newDate, newTime) => {
    onChange(weeklyPlan.map(item =>
      item.id === id
        ? { ...item, scheduled_date: newDate, time: newTime, status: "scheduled", reminder_sent: false }
        : item
    ));
  };

  const goPrevWeek = () => setCurrentWeek(d => addDays(d, -7));
  const goNextWeek = () => setCurrentWeek(d => addDays(d, 7));
  const goThisWeek = () => setCurrentWeek(getWeekStart(new Date()));

  const weekLabel = `${format(currentWeek, "MMM d")} – ${format(addDays(currentWeek, 6), "MMM d, yyyy")}`;
  const totalItems = weekDays.reduce((sum, d) => sum + d.items.length, 0);
  const doneItems = weekDays.reduce((sum, d) => sum + d.items.filter(i => i.done).length, 0);
  const upcomingReminders = weeklyPlan.filter(i => !i.done && i.status !== "on_hold" && i.scheduled_date && !i.reminder_sent).length;

  return (
    <div className="space-y-4">
      {/* Brain dump */}
      <WeeklyBrainDump
        weekStart={currentWeek}
        onAddItems={addItemsFromDump}
        onAddNote={onNotesChange}
        existingTasks={tasks}
      />

      {/* Missed / On hold */}
      <MissedTasksSection
        missedItems={missedItems}
        onHoldItems={onHoldItems}
        onReschedule={rescheduleItem}
        onHold={holdItem}
        onDelete={deleteItem}
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goPrevWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-sm font-semibold min-w-[120px] text-center">{weekLabel}</div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goNextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={goThisWeek}>
            Today
          </Button>
        </div>
        <div className="flex items-center gap-1.5">
          {upcomingReminders > 0 && (
            <Badge variant="outline" className="text-xs gap-0.5" title="Reminders will be sent for upcoming items">
              <Bell className="w-2.5 h-2.5" />{upcomingReminders}
            </Badge>
          )}
          {totalItems > 0 && (
            <Badge variant="secondary" className="text-xs">
              {doneItems}/{totalItems} done
            </Badge>
          )}
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="w-3 h-3 mr-1" /> Add to Week
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((day, idx) => (
          <div
            key={idx}
            className={`rounded-lg border min-h-[180px] flex flex-col ${
              idx === todayIndex ? "border-primary bg-primary/5" : "border-border bg-card"
            }`}
          >
            <div className={`px-2 py-1.5 text-center border-b ${idx === todayIndex ? "border-primary/30 bg-primary/10" : "border-border bg-muted/30"}`}>
              <div className="text-xs font-semibold text-foreground">{day.short}</div>
              <div className={`text-xs ${idx === todayIndex ? "text-primary font-bold" : "text-muted-foreground"}`}>
                {format(day.date, "MMM d")}
              </div>
            </div>
            <div className="flex-1 p-1 space-y-1 overflow-y-auto max-h-[200px]">
              {day.items.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground/50">—</span>
                </div>
              ) : (
                day.items.map(item => (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`group cursor-pointer rounded-md px-1.5 py-1 text-xs border transition-colors hover:border-primary/40 ${
                      item.done ? "bg-muted/40 border-transparent opacity-60" : "bg-background border-border"
                    } ${item.status === "missed" ? "border-amber-300 bg-amber-50/50" : ""}`}
                  >
                    <div className="flex items-start gap-1">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={(e) => { e.stopPropagation(); toggleItem(item.id); }}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-border mt-0.5 h-3 w-3 shrink-0 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        {item.time && (
                          <span className="text-[10px] font-medium text-primary block leading-tight">
                            {formatTime(item.time)}
                          </span>
                        )}
                        <span className={`text-xs leading-tight ${item.done ? "line-through" : ""}`}>
                          {item.text}
                        </span>
                        {item.notes && (
                          <span className="flex items-center gap-0.5 mt-0.5 text-[9px] text-muted-foreground">
                            <MessageSquare className="w-2 h-2" />{item.notes}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-0.5"
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {totalItems === 0 && missedItems.length === 0 && onHoldItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <CalendarDays className="w-8 h-8 text-muted-foreground/40 mb-2" />
          <p className="text-xs text-muted-foreground">Nothing planned for this week yet.</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">Use the brain dump above or click "Add to Week".</p>
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Add to Weekly Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Pick from existing tasks
              </label>
              {availableTasks.length === 0 ? (
                <div className="text-xs text-muted-foreground italic py-2">No pending tasks — add one in the Tasks tab first.</div>
              ) : (
                <div className="max-h-48 overflow-y-auto rounded-md border border-border divide-y divide-border">
                  {availableTasks.map(t => {
                    const hasSubs = t.subtasks && t.subtasks.length > 0;
                    const isExpanded = expandedTaskIds.has(t.id);
                    const subKeys = (t.subtasks || []).map(s => `${t.id}__sub__${s.id}`);
                    const allKeys = [t.id, ...subKeys];
                    const allChecked = allKeys.every(k => checkedKeys.has(k));
                    const someChecked = allKeys.some(k => checkedKeys.has(k));
                    return (
                      <div key={t.id}>
                        <div className="flex items-center gap-1.5 px-2 py-1.5">
                          {hasSubs ? (
                            <button
                              type="button"
                              onClick={() => toggleExpand(t.id)}
                              className="shrink-0 p-0.5 hover:bg-muted rounded"
                            >
                              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            </button>
                          ) : (
                            <span className="w-4 shrink-0" />
                          )}
                          <input
                            type="checkbox"
                            checked={allChecked}
                            ref={el => { if (el) el.indeterminate = !allChecked && someChecked; }}
                            onChange={() => toggleTask(t)}
                            className="rounded border-border h-3.5 w-3.5 shrink-0"
                          />
                          <button
                            type="button"
                            onClick={() => toggleTask(t)}
                            className={`flex-1 text-left text-xs ${checkedKeys.has(t.id) ? "font-medium text-primary" : ""}`}
                          >
                            {t.text}
                            {hasSubs && (
                              <span className="text-[10px] text-muted-foreground ml-1">({t.subtasks.length} subtasks)</span>
                            )}
                          </button>
                        </div>
                        {hasSubs && isExpanded && (
                          <div className="pl-8 pb-1 space-y-0.5">
                            {t.subtasks.map(s => {
                              const subKey = `${t.id}__sub__${s.id}`;
                              return (
                                <div key={s.id} className="flex items-center gap-1.5 px-2 py-1">
                                  <input
                                    type="checkbox"
                                    checked={checkedKeys.has(subKey)}
                                    onChange={() => toggleSubtask(t.id, s)}
                                    className="rounded border-border h-3.5 w-3.5 shrink-0"
                                  />
                                  <span className={`text-xs ${checkedKeys.has(subKey) ? "text-primary" : "text-muted-foreground"}`}>
                                    {s.text}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Or add a custom item
              </label>
              <Input
                placeholder="Enter a task or activity..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="h-9"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Day</label>
              <div className="grid grid-cols-7 gap-1">
                {DAY_SHORT.map((name, i) => {
                  const date = addDays(currentWeek, i);
                  const isToday = isSameDay(date, new Date());
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDay(i)}
                      className={`py-1.5 rounded-md text-xs font-medium transition-colors ${
                        selectedDay === i
                          ? "bg-primary text-primary-foreground"
                          : isToday
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : "bg-muted hover:bg-muted/70"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Time (optional)
              </label>
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={addItems} disabled={checkedKeys.size === 0 && !customText.trim()}>
              <Check className="w-3 h-3 mr-1" /> Schedule{checkedKeys.size > 0 || customText.trim() ? ` (${checkedKeys.size + (customText.trim() ? 1 : 0)})` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}