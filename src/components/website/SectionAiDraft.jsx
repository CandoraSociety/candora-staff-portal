import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// AI help for a single content block: describe what the block should say and the
// heading, text and button label are written for you. Empty fields come back
// untouched, so asking for a change to one part leaves the rest alone.
export default function SectionAiDraft({ form, set, pageLabel, site, existingHeadings = [] }) {
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const hasContent = !!(form.heading || form.body);

  const apply = async () => {
    if (!instruction.trim()) {
      setError("Say what this block should be about.");
      return;
    }
    setBusy(true);
    setError("");
    setResult("");
    try {
      const plan = await base44.integrations.Core.InvokeLLM({
        prompt: `You are writing one content block on the "${pageLabel || form.page}" page of the public website of ${
          site?.site_name || "Candora"
        }, a community charity in Canada.
${site?.about_summary ? `About the organization: ${site.about_summary}` : ""}
${existingHeadings.length ? `Blocks already on this page: ${existingHeadings.join(" | ")}` : ""}

The block as it stands now:
- heading: ${form.heading || "(empty)"}
- text: ${form.body || "(empty)"}
- button label: ${form.cta_label || "(empty)"}

The staff member's brief: "${instruction.trim()}"

Return:
- heading: two to seven words, plain and specific.
- body: one or two short sentences, at most 45 words, warm plain language a supporter understands.
- cta_label: two or three words such as "Get involved", or an empty string when the block needs no button.
If the brief asks to change existing text, change only the part it names and return an empty string for the rest.
Do not repeat the heading of another block on this page.
Never invent statistics, dollar amounts, dates, names or program names that were not given to you.`,
        response_json_schema: {
          type: "object",
          properties: {
            heading: { type: "string" },
            body: { type: "string" },
            cta_label: { type: "string" },
          },
          required: ["heading", "body", "cta_label"],
        },
      });

      const changed = [];
      if (plan.heading) {
        set("heading", plan.heading);
        changed.push("heading");
      }
      if (plan.body) {
        set("body", plan.body);
        changed.push("text");
      }
      if (plan.cta_label) {
        set("cta_label", plan.cta_label);
        changed.push("button");
      }

      setResult(changed.length ? `Wrote the ${changed.join(" and ")}. Edit it freely, then save.` : "Nothing changed — try naming the part you want.");
      if (changed.length) setInstruction("");
    } catch (err) {
      setError(err.message || "The block could not be written.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">
          {hasContent ? "Ask the AI for a change" : "Write this block with AI"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {hasContent
            ? "Name the part you want different — the heading, the text or the button — and only that part changes."
            : "Describe what the block should say and the heading, text and button are written for you."}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="section-ai-brief">{hasContent ? "What should change?" : "What is this block about?"}</Label>
        <Textarea
          id="section-ai-brief"
          rows={2}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder={
            hasContent
              ? "Make the heading shorter and mention the food bank"
              : "Our community lunch — a free hot meal every Wednesday for anyone who needs one"
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={apply} disabled={busy} className="gap-1.5">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {busy ? "Writing…" : hasContent ? "Apply to this block" : "Write this block"}
        </Button>
        <span className="text-[11px] text-muted-foreground">Nothing goes on the website until you save.</span>
      </div>

      {result && <p className="text-xs text-muted-foreground">{result}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}