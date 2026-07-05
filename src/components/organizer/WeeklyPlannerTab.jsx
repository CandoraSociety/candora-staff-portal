import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays, Check } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";

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

export default function WeeklyPlannerTab({ weeklyPlan = [], onChange, tasks = [] }) {
  const [currentWeek, setCurrentWeek] = useState(getWeekStart(new Date()));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");
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

  const availableTasks = tasks.filter(t => !t.done);

  const addItem = () => {
    const text = selectedTaskId
      ? tasks.find(t => t.id === selectedTaskId)?.text
      : customText.trim();
    if (!text) return;

    const dateStr = format(addDays(currentWeek, selectedDay), "yyyy-MM-dd");
    const newItem = {
      id: `wp_${Date.now()}`,
      text,
      scheduled_date: dateStr,
      time: selectedTime || "",
      done: false,
      task_id: selectedTaskId || undefined,
    };
    onChange([...weeklyPlan, newItem]);

    // Reset form
    setSelectedTaskId("");
    setCustomText("");
    setSelectedDay(0);
    setSelectedTime("");
    setDialogOpen(false);
  };

  const toggleItem = (id) => {
    onChange(weeklyPlan.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const deleteItem = (id) => {
    onChange(weeklyPlan.filter(item => item.id !== id));
  };

  const goPrevWeek = () => setCurrentWeek(d => addDays(d, -7));
  const goNextWeek = () => setCurrentWeek(d => addDays(d, 7));
  const goThisWeek = () => setCurrentWeek(getWeekStart(new Date()));

  const weekLabel = `${format(currentWeek, "MMM d")} – ${format(addDays(currentWeek, 6), "MMM d, yyyy")}`;
  const totalItems = weekDays.reduce((sum, d) => sum + d.items.length, 0);
  const doneItems = weekDays.reduce((sum, d) => sum + d.items.filter(i => i.done).length, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goPrevWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-sm font-semibold min-w-[140px] text-center">{weekLabel}</div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goNextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={goThisWeek}>
            Today
          </Button>
        </div>
        <div className="flex items-center gap-2">
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
            {/* Day header */}
            <div className={`px-2 py-1.5 text-center border-b ${idx === todayIndex ? "border-primary/30 bg-primary/10" : "border-border bg-muted/30"}`}>
              <div className="text-xs font-semibold text-foreground">{day.short}</div>
              <div className={`text-xs ${idx === todayIndex ? "text-primary font-bold" : "text-muted-foreground"}`}>
                {format(day.date, "MMM d")}
              </div>
            </div>
            {/* Items */}
            <div className="flex-1 p-1 space-y-1 overflow-y-auto max-h-[200px]">
              {day.items.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground/50">—</span>
                </div>
              ) : (
                day.items.map(item => (
                  <div
                    key={item.id}
                    className={`group rounded-md px-1.5 py-1 text-xs border ${
                      item.done ? "bg-muted/40 border-transparent opacity-60" : "bg-background border-border"
                    }`}
                  >
                    <div className="flex items-start gap-1">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => toggleItem(item.id)}
                        className="rounded border-border mt-0.5 h-3 w-3 shrink-0"
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
                      </div>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
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

      {totalItems === 0 && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <CalendarDays className="w-8 h-8 text-muted-foreground/40 mb-2" />
          <p className="text-xs text-muted-foreground">Nothing planned for this week yet.</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">Click "Add to Week" to schedule items.</p>
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Add to Weekly Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Task selector */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Pick from existing tasks
              </label>
              <Select value={selectedTaskId} onValueChange={(v) => { setSelectedTaskId(v); if (v) setCustomText(""); }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select a task (optional)..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTasks.length === 0 ? (
                    <SelectItem value="__none" disabled>No pending tasks</SelectItem>
                  ) : (
                    availableTasks.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.text}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Or custom text */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Or add a custom item
              </label>
              <Input
                placeholder="Enter a task or activity..."
                value={customText}
                onChange={(e) => { setCustomText(e.target.value); if (e.target.value) setSelectedTaskId(""); }}
                className="h-9"
              />
            </div>

            {/* Day selector */}
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

            {/* Time selector */}
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
            <Button onClick={addItem} disabled={!selectedTaskId && !customText.trim()}>
              <Check className="w-3 h-3 mr-1" /> Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}