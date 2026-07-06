import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function AIPlanGenerator({ open, onClose, plan, onGenerated }) {
  const [focus, setFocus] = useState("first_day_and_week");
  const [extraContext, setExtraContext] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const planTypeLabel = plan.plan_type?.replace(/_/g, " ") || "onboarding";
      const focusLabel = focus === "first_day_and_week" ? "first day and first week" : focus.replace(/_/g, " ");

      const prompt = `You are an expert onboarding and training planner for a non-profit organization (Candora, based in Edmonton, Canada).

Create a detailed ${focusLabel} training/onboarding plan for the following person:

**Employee:** ${plan.employee_name}
**New Position:** ${plan.position_title}
**Previous Position:** ${plan.previous_position || "(new to the organization)"}
**Department:** ${plan.department || "General"}
**Plan Type:** ${planTypeLabel}
**Start Date:** ${plan.start_date}
**Supervisor:** ${plan.supervisor_name || "TBD"}
**Buddy/Mentor:** ${plan.buddy_mentor_name || "TBD"}
**Key Objectives:** ${plan.key_objectives || "Smooth transition into the new role"}

${extraContext ? `\n**Additional Context:**\n${extraContext}\n` : ""}
Generate a comprehensive set of activities/tasks for this person's ${focusLabel}. Think about:

- Pre-start preparations (workspace, IT, access, welcome materials)
- First day: welcome, introductions, workspace setup, key meetings, orientation
- First week: role-specific training, shadowing, key introductions, initial tasks, check-ins
- Mix of meetings, training sessions, introductions, setup tasks, and shadowing opportunities
- Realistic timing (don't overpack — leave breathing room)
- Non-profit context: community focus, volunteer engagement, multiple program areas

Return a JSON object with this exact structure:
{
  "items": [
    {
      "title": "Short activity title",
      "description": "What this involves and why it matters",
      "phase": "pre_start" | "first_day" | "first_week" | "first_month",
      "day_number": 1,
      "time_block": "9:00 AM" | "Morning" | "Afternoon" | "",
      "duration_minutes": 30,
      "item_type": "meeting" | "training" | "task" | "introduction" | "review" | "setup" | "shadowing" | "assessment",
      "owner_name": "Who should lead this (use role/title if specific person unknown)",
      "location": "Where this happens" | "",
      "sort_order": 1
    }
  ]
}

Guidelines:
- For first_day items, use day_number = 1 and include time_block (9:00 AM through 4:00 PM, with lunch break)
- For first_week items, use day_number 2-5 and group with time_block "Morning" or "Afternoon"
- For pre_start items, use day_number = 0
- Order items chronologically within each phase
- Be specific and practical — avoid generic placeholders
- Include a mix of structured activities and informal relationship-building
- Add a end-of-week check-in/review with supervisor
- 8-15 items total for first_day_and_week focus

Return ONLY the JSON object, no markdown or explanation.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  phase: { type: "string" },
                  day_number: { type: "number" },
                  time_block: { type: "string" },
                  duration_minutes: { type: "number" },
                  item_type: { type: "string" },
                  owner_name: { type: "string" },
                  location: { type: "string" },
                  sort_order: { type: "number" },
                },
              },
            },
          },
        },
        model: "claude_sonnet_4_6",
      });

      const items = result?.items || result?.data?.items || [];
      if (items.length > 0) {
        await onGenerated(items);
        toast.success(`Generated ${items.length} training activities`);
        onClose();
      } else {
        toast.error("AI didn't return any activities. Try adding more context.");
      }
    } catch (err) {
      console.error("AI generation failed:", err);
      toast.error(err?.message || "AI generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            AI Plan Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <p className="font-medium">{plan.employee_name}</p>
            <p className="text-muted-foreground">{plan.position_title} · Starting {plan.start_date}</p>
          </div>

          <div>
            <Label className="text-xs">What should I generate?</Label>
            <Select value={focus} onValueChange={setFocus}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="first_day_and_week">First Day & First Week (recommended)</SelectItem>
                <SelectItem value="first_day">First Day Only</SelectItem>
                <SelectItem value="first_week">First Week Only</SelectItem>
                <SelectItem value="first_month">First Month (broader plan)</SelectItem>
                <SelectItem value="pre_start">Pre-Start Preparations</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Additional context (optional)</Label>
            <Textarea
              value={extraContext}
              onChange={e => setExtraContext(e.target.value)}
              className="mt-1"
              rows={3}
              placeholder="e.g. This person is moving from frontline to coordinator role, needs to learn Salesforce, should meet the board chair..."
            />
          </div>

          <p className="text-xs text-muted-foreground">
            The AI will generate structured activities you can review and edit before saving.
            Existing items in the selected phases will be kept.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={generate} disabled={loading}>
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Generate Plan</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}