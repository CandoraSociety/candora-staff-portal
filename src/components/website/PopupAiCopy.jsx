import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Writes the pop-up's title, message and button label from a short brief, using
// the site's own words for context.
export default function PopupAiCopy({ form, onCopy }) {
  const [brief, setBrief] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Write the copy for a pop-up that opens over the home page of the website of ${
          form.site_name || "Candora"
        }, a community charity in Canada.
What the pop-up is about: ${brief.trim() || form.popup_title || "an appeal for support"}
${form.about_summary ? `About the organization: ${form.about_summary}` : ""}
${form.popup_title ? `Current working title (improve it): ${form.popup_title}` : ""}
${form.popup_message ? `Current working message (improve it): ${form.popup_message}` : ""}

Write:
- title: at most 8 words, warm and direct, no exclamation marks.
- message: one or two sentences, at most 30 words, plain language a supporter understands, saying what their gift or action makes possible.
- button_label: two or three words, an action such as "Donate now".
Never invent statistics, dollar amounts, dates or program names that were not given to you.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            message: { type: "string" },
            button_label: { type: "string" },
          },
          required: ["title", "message", "button_label"],
        },
      });
      onCopy({
        popup_title: result.title || "",
        popup_message: result.message || "",
        popup_button_label: result.button_label || "",
      });
    } catch (err) {
      setError(err.message || "The copy could not be written.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border p-4 bg-muted/20">
      <div>
        <p className="text-sm font-semibold text-foreground">Write the pop-up text</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Say what the pop-up is for and the AI writes the title, message and button.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="popup-copy-brief">What is this pop-up about?</Label>
        <Textarea
          id="popup-copy-brief"
          rows={2}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Our winter warmth appeal — a gift keeps a family's heat on this winter"
        />
      </div>

      <Button type="button" size="sm" onClick={generate} disabled={busy} className="gap-1.5">
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
        {busy ? "Writing…" : "Write the text"}
      </Button>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}