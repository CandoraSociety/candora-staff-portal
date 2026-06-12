import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Target, Sparkles, Calendar, Check } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";

export default function FocusTab({ focusToday, focusDate, onChange, notes = [], tasks = [], priorities = [] }) {
  const [focusInput, setFocusInput] = useState(focusToday || "");
  const [isFinding, setIsFinding] = useState(false);
  const [relevance, setRelevance] = useState(null);

  const handleSaveFocus = () => {
    onChange({
      focus_today: focusInput,
      focus_date: new Date().toISOString().split("T")[0],
    });
  };

  const handleFindRelevance = async () => {
    if (!focusInput.trim()) return;
    setIsFinding(true);
    try {
      const context = `
        Focus: ${focusInput}
        
        Notes: ${notes.map(n => n.raw_entry).join(" | ")}
        Tasks: ${tasks.filter(t => !t.done).map(t => t.text).join(" | ")}
        Priorities: ${priorities.map(p => p.title).join(" | ")}
        
        Find connections between the focus and these items. Return JSON:
        {
          "related_notes": [note subjects],
          "related_tasks": [task texts],
          "related_priorities": [priority titles],
          "suggestions": [actionable suggestions]
        }
      `;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: context,
        response_json_schema: {
          type: "object",
          properties: {
            related_notes: { type: "array", items: { type: "string" } },
            related_tasks: { type: "array", items: { type: "string" } },
            related_priorities: { type: "array", items: { type: "string" } },
            suggestions: { type: "array", items: { type: "string" } }
          }
        }
      });

      setRelevance(JSON.parse(result));
    } catch (error) {
      console.error("Failed to find relevance:", error);
    } finally {
      setIsFinding(false);
    }
  };

  const isStale = focusDate && focusDate !== new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
          <Target className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Today's Focus</h3>
          {isStale && <p className="text-xs text-amber-600">Focus may be outdated</p>}
        </div>
      </div>

      <Textarea
        placeholder="What do you want to focus on today?"
        value={focusInput}
        onChange={(e) => setFocusInput(e.target.value)}
        className="min-h-[60px]"
      />

      <div className="flex gap-2">
        <Button onClick={handleSaveFocus} size="sm" disabled={!focusInput.trim()}>
          <Check className="w-3 h-3 mr-1" /> Save Focus
        </Button>
        <Button onClick={handleFindRelevance} variant="outline" size="sm" disabled={!focusInput.trim() || isFinding}>
          <Sparkles className={`w-3 h-3 mr-1 ${isFinding ? "animate-spin" : ""}`} />
          {isFinding ? "Finding..." : "Find Connections"}
        </Button>
      </div>

      {relevance && (
        <div className="space-y-3 p-3 rounded-lg bg-muted/30">
          <h4 className="text-xs font-semibold uppercase tracking-wide">Connections Found</h4>
          
          {relevance.related_notes?.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-1">Related Notes:</p>
              <div className="flex flex-wrap gap-1">
                {relevance.related_notes.map((note, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{note}</Badge>
                ))}
              </div>
            </div>
          )}

          {relevance.related_tasks?.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-1">Related Tasks:</p>
              <div className="flex flex-wrap gap-1">
                {relevance.related_tasks.map((task, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{task}</Badge>
                ))}
              </div>
            </div>
          )}

          {relevance.related_priorities?.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-1">Related Priorities:</p>
              <div className="flex flex-wrap gap-1">
                {relevance.related_priorities.map((priority, i) => (
                  <Badge key={i} variant="default" className="text-xs">{priority}</Badge>
                ))}
              </div>
            </div>
          )}

          {relevance.suggestions?.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-1">Suggestions:</p>
              <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                {relevance.suggestions.map((suggestion, i) => (
                  <li key={i}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {focusToday && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Last updated: {focusDate ? format(new Date(focusDate), "MMM d, yyyy") : "Today"}
        </div>
      )}
    </div>
  );
}