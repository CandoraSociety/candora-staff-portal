import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Brain, CheckSquare, Target, Bell, FileText, Flag, CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TasksTab from "./TasksTab";
import WeeklyPlannerTab from "./WeeklyPlannerTab";
import FocusTab from "./FocusTab";
import RemindersTab from "./RemindersTab";
import NotesTab from "./NotesTab";
import PrioritiesTab from "./PrioritiesTab";

const TABS = [
  { id: "notes", label: "Notes", icon: FileText },
  { id: "priorities", label: "Priorities", icon: Flag },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "week", label: "Week", icon: CalendarDays },
  { id: "focus", label: "Focus", icon: Target },
  { id: "reminders", label: "Reminders", icon: Bell },
];

export default function OrganizerPanel({ user }) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("notes");
  const queryClient = useQueryClient();

  const { data: records } = useQuery({
    queryKey: ["organizer", user?.email],
    queryFn: () => base44.entities.PersonalOrganizer.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const record = records?.[0];

  const saveMutation = useMutation({
    mutationFn: (data) =>
      record?.id
        ? base44.entities.PersonalOrganizer.update(record.id, data)
        : base44.entities.PersonalOrganizer.create({ user_email: user.email, ...data }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["organizer", user?.email] });
    },
  });

  const save = useCallback((patch) => {
    saveMutation.mutate(patch);
  }, [saveMutation]);

  const notes = record?.notes || [];
  const priorities = record?.priorities || [];
  const tasks = record?.tasks || [];
  const reminders = record?.reminders || [];
  const weeklyPlan = record?.weekly_plan || [];

  const pendingTaskCount = tasks.filter(t => !t.done).length;
  const priorityCount = priorities.length;

  const handleAddTasks = useCallback((newTasks) => {
    save({ tasks: [...tasks, ...newTasks] });
  }, [tasks, save]);

  const handleAddWeeklyItems = useCallback((newItems) => {
    save({ weekly_plan: [...weeklyPlan, ...newItems] });
  }, [weeklyPlan, save]);

  const handleHeaderClick = useCallback((e) => {
    // Only toggle collapse if clicking the header itself, not buttons inside it
    if (e.target.closest('button')) return;
    setCollapsed(v => !v);
  }, []);

  return (
    <div className="rounded-2xl border-2 border-violet-500/40 bg-card shadow-md">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 transition-colors"
        onClick={handleHeaderClick}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-white text-sm leading-tight">Organization for the Disorganized</h2>
            <p className="text-xs text-white/70">Your personal chaos management center</p>
          </div>
          <div className="flex gap-1.5 ml-2 shrink-0">
            {pendingTaskCount > 0 && (
              <Badge className="text-xs px-1.5 py-0 h-5 bg-white/20 text-white border-0 hover:bg-white/30">
                <CheckSquare className="w-2.5 h-2.5 mr-0.5" />{pendingTaskCount}
              </Badge>
            )}
            {priorityCount > 0 && (
              <Badge className="text-xs px-1.5 py-0 h-5 bg-white/20 text-white border-0 hover:bg-white/30">
                <Flag className="w-2.5 h-2.5 mr-0.5" />{priorityCount}
              </Badge>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-white hover:bg-white/20 hover:text-white pointer-events-none">
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </Button>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="px-5 pb-5">
          {/* Custom tab bar */}
          <div className="flex gap-1 mb-4 bg-muted rounded-lg p-1 h-9">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1 text-xs font-medium rounded-md px-2 transition-all ${
                    isActive
                      ? "bg-background text-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === "notes" && (
            <NotesTab
              notes={notes}
              onChange={(n) => save({ notes: n })}
              onAddTasks={handleAddTasks}
              onAddWeeklyItems={handleAddWeeklyItems}
            />
          )}
          {activeTab === "priorities" && (
            <PrioritiesTab
              priorities={priorities}
              onChange={(p) => save({ priorities: p })}
              focusToday={record?.focus_today}
              onPlanReady={(plan) => save({ daily_plan: plan })}
            />
          )}
          {activeTab === "tasks" && (
            <TasksTab tasks={tasks} onChange={(t) => save({ tasks: t })} priorities={priorities} onPrioritiesChange={(p) => save({ priorities: p })} />
          )}
          {activeTab === "week" && (
            <WeeklyPlannerTab
              weeklyPlan={weeklyPlan}
              onChange={(wp) => save({ weekly_plan: wp })}
              tasks={tasks}
              onNotesChange={(n) => save({ notes: [...notes, n] })}
            />
          )}
          {activeTab === "focus" && (
            <FocusTab
              focusToday={record?.focus_today}
              focusDate={record?.focus_date}
              onChange={(data) => save(data)}
              notes={notes}
              tasks={tasks}
              priorities={priorities}
            />
          )}
          {activeTab === "reminders" && (
            <RemindersTab reminders={reminders} onChange={(r) => save({ reminders: r })} />
          )}
        </div>
      )}
    </div>
  );
}