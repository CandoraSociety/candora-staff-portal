import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PopupComponentsField from "@/components/website/PopupComponentsField";

// The AI-assisted way of building the pop-up. One brief writes the title, the
// message and the button, then creates the image from the same brief and the
// uploaded components — and everything lands in the same fields the manual way
// uses, ready to be edited.
export default function PopupAiDraft({ form, set, components, onComponentsChange, onDrafted }) {
  const [brief, setBrief] = useState("");
  const [step, setStep] = useState("");
  const [error, setError] = useState("");
  const busy = !!step;

  const draft = async () => {
    setError("");
    try {
      setStep("text");
      const copy = await base44.integrations.Core.InvokeLLM({
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
      if (copy.title) set("popup_title", copy.title);
      if (copy.message) set("popup_message", copy.message);
      if (copy.button_label) set("popup_button_label", copy.button_label);

      setStep("image");
      const direction =
        brief.trim() ||
        copy.title ||
        "a warm, hopeful moment from the community";
      const referenceNote = components.length
        ? " The attached images are the organization's own brand components. Reproduce them faithfully and place them naturally in the composition — never redraw, recolour or restyle a logo."
        : "";
      const { url } = await base44.integrations.Core.GenerateImage({
        prompt: `Create the image for a small pop-up card on a charity website. ${direction} Compose it to read well as a wide banner roughly three times as wide as it is tall, with a clear focal point and no text or lettering.${referenceNote}`,
        existing_image_urls: components.map((component) => component.url).filter(Boolean),
      });
      if (url) set("popup_image_url", url);
      onDrafted?.();
    } catch (err) {
      setError(err.message || "The draft could not be finished.");
    } finally {
      setStep("");
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">What is this pop-up about?</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Describe it in a sentence and the AI writes the title, message and button, then creates the
          image. Everything appears below, where you can change any of it.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="popup-ai-brief">The brief</Label>
        <Textarea
          id="popup-ai-brief"
          rows={2}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Our winter warmth appeal — a gift keeps a family's heat on this winter"
        />
      </div>

      <PopupComponentsField components={components} onChange={onComponentsChange} />

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button type="button" size="sm" onClick={draft} disabled={busy} className="gap-1.5">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {step === "text"
            ? "Writing the text…"
            : step === "image"
              ? "Creating the image…"
              : form.popup_title || form.popup_image_url
                ? "Draft it again"
                : "Draft my pop-up"}
        </Button>
        <span className="text-[11px] text-muted-foreground">Nothing goes on the website until you save.</span>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}