import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format, addDays } from "date-fns";

export default function WeeklyBrainDump({ weekStart, onAddItems, onAddNote, existingTasks }) {
  const [dumpText, setDumpText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dateListStr = weekDates.map((d, i) => `${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i]} ${format(d, "MMM d")} (yyyy-MM-dd: ${format(d, "yyyy-MM-dd")})`).join(", ");

  const processDump = async () => {
    if (!dumpText.trim()) return;
    setProcessing(true);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a scheduling assistant. The user is dumping tasks for the week starting Monday ${format(weekStart, "yyyy-MM-dd")}.

Here are the days of the current week with their dates:
${dateListStr}

Today is ${format(new Date(), "yyyy-MM-dd")}.

Parse the user's text dump and extract each task/activity. For each, determine:
- text: the task description (concise but clear)
- scheduled_date: the YYYY-MM-DD date for this week (resolve relative days like "Tuesday", "tomorrow", "Thursday" to the actual date)
- time: HH:MM format if a time is mentioned, otherwise empty string
- notes: any additional comments or context the user included for that item

If the user references existing tasks by name, match them. If a task has no specific day, use the soonest reasonable day.

User's dump:
"""
${dumpText}
"""`,
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  scheduled_date: { type: "string" },
                  time: { type: "string" },
                  notes: { type: "string" }
                }
              }
            },
            summary: { type: "string", description: "A brief summary of what was scheduled" }
          }
        }
      });

      const parsedItems = (result.items || []).map(item => {
        const matchedTask = existingTasks.find(t => t.text.toLowerCase() === item.text.toLowerCase());
        return {
          id: `wp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          text: item.text,
          scheduled_date: item.scheduled_date,
          time: item.time || "",
          done: false,
          notes: item.notes || "",
          status: "scheduled",
          reminder_sent: false,
          task_id: matchedTask?.id || undefined,
        };
      });

      if (parsedItems.length > 0) {
        onAddItems(parsedItems);

        if (result.summary) {
          onAddNote({
            id: `note_${Date.now()}`,
            raw_entry: `Weekly planner dump — ${parsedItems.length} item(s) scheduled`,
            subject: "Week Dump",
            formatted: result.summary,
            created_at: new Date().toISOString(),
          });
        }
      }

      setDumpText("");
    } catch (err) {
      console.error("Dump processing failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50/40 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Zap className="w-3.5 h-3.5 text-violet-600" />
        <span className="text-xs font-semibold text-violet-700">Brain Dump — type your tasks below</span>
        <button
          className="text-[10px] text-violet-500 hover:text-violet-700 underline ml-auto"
          onClick={() => setShowHint(s => !s)}
        >
          {showHint ? "Hide examples" : "Show examples"}
        </button>
      </div>

      {showHint && (
        <div className="text-[11px] text-violet-600/80 bg-violet-100/50 rounded-md p-2 space-y-0.5">
          <p>• "Call dentist Tuesday 2pm — need referral"</p>
          <p>• "Submit grant report Thursday morning"</p>
          <p>• "Pick up supplies Wed 10am"</p>
          <p>• "Team meeting Friday 3pm, bring agenda"</p>
          <p>• "Review budget Mon"</p>
        </div>
      )}

      <Textarea
        value={dumpText}
        onChange={(e) => setDumpText(e.target.value)}
        placeholder="Dump everything here... e.g. 'Call dentist Tue 2pm need referral, submit grant report Thu morning, team meeting Fri 3pm bring agenda'"
        className="min-h-[70px] text-xs resize-y bg-white"
        disabled={processing}
      />

      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={processDump}
          disabled={!dumpText.trim() || processing}
        >
          {processing ? (
            <><Sparkles className="w-3 h-3 mr-1 animate-spin" /> Parsing...</>
          ) : (
            <><Sparkles className="w-3 h-3 mr-1" /> Parse & Fill Calendar</>
          )}
        </Button>
      </div>
    </div>
  );
}