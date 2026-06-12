import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, AlertCircle, X } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function DailyPlan({ plan, onUpdate, onDismiss }) {
  const [expandedPriorities, setExpandedPriorities] = useState({});
  const [isGeneratingHelp, setIsGeneratingHelp] = useState({});

  const handleTaskHelp = async (priorityId, taskId, taskText) => {
    const key = `${priorityId}_${taskId}`;
    setIsGeneratingHelp(prev => ({ ...prev, [key]: true }));
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Provide a concise, actionable tip for completing this task: "${taskText}". Keep it under 2 sentences.`,
      });
      // Store help text in expanded state
      setExpandedPriorities(prev => ({
        ...prev,
        [priorityId]: { ...prev[priorityId], taskHelp: { ...prev[priorityId]?.taskHelp, [taskId]: result } }
      }));
    } catch (error) {
      console.error("Failed to get help:", error);
    } finally {
      setIsGeneratingHelp(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleStruggle = async (priorityTitle) => {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `I'm struggling with this priority: "${priorityTitle}". Give me 3 simple, encouraging suggestions to move forward. Return as JSON array of strings.`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: { type: "array", items: { type: "string" } }
          }
        }
      });
      setExpandedPriorities(prev => ({
        ...prev,
        [priorityTitle]: { ...prev[priorityTitle], struggleSuggestions: result.suggestions }
      }));
    } catch (error) {
      console.error("Failed to get struggle help:", error);
    }
  };

  const togglePriority = (id) => {
    setExpandedPriorities(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 w-96 max-h-[80vh] overflow-y-auto z-50"
    >
      <Card className="shadow-lg border-primary/20">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Your Daily Plan
              </h3>
              {plan.focus && <p className="text-sm text-muted-foreground mt-1">Focus: {plan.focus}</p>}
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDismiss}>
              <X className="w-3 h-3" />
            </Button>
          </div>

          {plan.ai_plan && (
            <div className="text-sm prose prose-sm max-w-none bg-muted/30 p-3 rounded-md">
              <div dangerouslySetInnerHTML={{ __html: plan.ai_plan.replace(/\n/g, "<br />") }} />
            </div>
          )}

          {plan.priorities?.map((priority) => (
            <div key={priority.id} className="space-y-2">
              <div
                className="flex items-center gap-2 cursor-pointer hover:bg-muted/30 p-2 rounded-md transition-colors"
                onClick={() => togglePriority(priority.id)}
              >
                <div className={`w-2 h-2 rounded-full ${getPriorityColor(priority.priority_level)}`} />
                <span className="text-sm font-medium flex-1">{priority.title}</span>
                <Badge variant="secondary" className="text-xs">
                  {priority.tasks?.filter(t => t.done).length || 0}/{priority.tasks?.length || 0}
                </Badge>
              </div>

              {expandedPriorities[priority.id] && (
                <div className="pl-4 space-y-2 border-l-2 border-muted">
                  {priority.tasks?.map((task) => (
                    <div key={task.id} className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => {
                            const updated = plan.priorities.map(p =>
                              p.id === priority.id
                                ? { ...p, tasks: p.tasks.map(t => t.id === task.id ? { ...t, done: !t.done } : t) }
                                : p
                            );
                            onUpdate({ ...plan, priorities: updated });
                          }}
                          className="rounded"
                        />
                        <span className={task.done ? "line-through text-muted-foreground" : ""}>{task.text}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 ml-auto"
                          onClick={() => handleTaskHelp(priority.id, task.id, task.text)}
                          disabled={isGeneratingHelp[`${priority.id}_${task.id}`]}
                        >
                          {isGeneratingHelp[`${priority.id}_${task.id}`] ? (
                            <Sparkles className="w-2.5 h-2.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-2.5 h-2.5" />
                          )}
                        </Button>
                      </div>
                      {expandedPriorities[priority.id]?.taskHelp?.[task.id] && (
                        <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded ml-6">
                          {expandedPriorities[priority.id].taskHelp[task.id]}
                        </div>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => handleStruggle(priority.title)}
                  >
                    <AlertCircle className="w-3 h-3 mr-1" /> I'm stuck on this
                  </Button>
                  {expandedPriorities[priority.id]?.struggleSuggestions && (
                    <div className="space-y-1">
                      {expandedPriorities[priority.id].struggleSuggestions.map((s, i) => (
                        <div key={i} className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function getPriorityColor(level) {
  const colors = {
    critical: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-yellow-500",
    low: "bg-green-500",
  };
  return colors[level] || "bg-gray-500";
}