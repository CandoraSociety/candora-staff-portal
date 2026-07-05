import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Brain, CheckSquare, Target, Bell, FileText, Flag, CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TasksTab from "./TasksTab";
import WeeklyPlannerTab from "./WeeklyPlannerTab";
import FocusTab from "./FocusTab";
import RemindersTab from "./RemindersTab";
import NotesTab from "./NotesTab";
import PrioritiesTab from "./PrioritiesTab";
import TickerBar from "./TickerBar";
import ContextPopup from "./ContextPopup";
import PriorityDeadlineNotifier from "./PriorityDeadlineNotifier";
import DailyPlan from "./DailyPlan";

export default function OrganizerPanel({ user }) {
  const [collapsed, setCollapsed] = useState(false);
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organizer", user?.email] }),
  });

  const save = useCallback((patch) => {
    saveMutation.mutate(patch);
  }, [record?.id, user?.email]);

  const notes = record?.notes || [];
  const priorities = record?.priorities || [];
  const tasks = record?.tasks || [];
  const reminders = record?.reminders || [];
  const weeklyPlan = record?.weekly_plan || [];

  const pendingTaskCount = tasks.filter(t => !t.done).length;
  const priorityCount = priorities.length;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setCollapsed(v => !v)}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-foreground text-sm leading-tight">Organization for the Disorganized</h2>
              <p className="text-xs text-muted-foreground">Your personal chaos management center</p>
            </div>
            <div className="flex gap-1.5 ml-2 shrink-0">
              {pendingTaskCount > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                  <CheckSquare className="w-2.5 h-2.5 mr-0.5" />{pendingTaskCount}
                </Badge>
              )}
              {priorityCount > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                  <Flag className="w-2.5 h-2.5 mr-0.5" />{priorityCount}
                </Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </div>

        {/* Ticker bar */}
        {!collapsed && (notes.length > 0 || priorities.length > 0) && (
          <div className="px-5 pb-3">
            <TickerBar notes={notes} priorities={priorities} />
          </div>
        )}

        {/* Body */}
        {!collapsed && (
          <div className="px-5 pb-5">
            <Tabs defaultValue="notes">
              <TabsList className="w-full mb-4 grid grid-cols-6 h-9">
                <TabsTrigger value="notes" className="text-xs gap-1">
                  <FileText className="w-3 h-3" /> Notes
                </TabsTrigger>
                <TabsTrigger value="priorities" className="text-xs gap-1">
                  <Flag className="w-3 h-3" /> Priorities
                </TabsTrigger>
                <TabsTrigger value="tasks" className="text-xs gap-1">
                  <CheckSquare className="w-3 h-3" /> Tasks
                </TabsTrigger>
                <TabsTrigger value="week" className="text-xs gap-1">
                  <CalendarDays className="w-3 h-3" /> Week
                </TabsTrigger>
                <TabsTrigger value="focus" className="text-xs gap-1">
                  <Target className="w-3 h-3" /> Focus
                </TabsTrigger>
                <TabsTrigger value="reminders" className="text-xs gap-1">
                  <Bell className="w-3 h-3" /> Reminders
                </TabsTrigger>
              </TabsList>

              <TabsContent value="notes">
                <NotesTab notes={notes} onChange={(n) => save({ notes: n })} />
              </TabsContent>
              <TabsContent value="priorities">
                <PrioritiesTab
                  priorities={priorities}
                  onChange={(p) => save({ priorities: p })}
                  focusToday={record?.focus_today}
                  onPlanReady={(plan) => save({ daily_plan: plan })}
                />
              </TabsContent>
              <TabsContent value="tasks">
                <TasksTab tasks={tasks} onChange={(t) => save({ tasks: t })} priorities={priorities} onPrioritiesChange={(p) => save({ priorities: p })} />
              </TabsContent>
              <TabsContent value="week">
                <WeeklyPlannerTab
                  weeklyPlan={weeklyPlan}
                  onChange={(wp) => save({ weekly_plan: wp })}
                  tasks={tasks}
                  onNotesChange={(n) => save({ notes: [...notes, n] })}
                />
              </TabsContent>
              <TabsContent value="focus">
                <FocusTab
                  focusToday={record?.focus_today}
                  focusDate={record?.focus_date}
                  onChange={(data) => save(data)}
                  notes={notes}
                  tasks={tasks}
                  priorities={priorities}
                />
              </TabsContent>
              <TabsContent value="reminders">
                <RemindersTab reminders={reminders} onChange={(r) => save({ reminders: r })} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </motion.div>

      {record?.daily_plan && (
        <DailyPlan
          plan={record.daily_plan}
          onUpdate={(updatedPlan) => save({ daily_plan: updatedPlan })}
          onDismiss={() => save({ daily_plan: null })}
        />
      )}
      <ContextPopup notes={notes} priorities={priorities} />
      <PriorityDeadlineNotifier priorities={priorities} />
    </>
  );
}