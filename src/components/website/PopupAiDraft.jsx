import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PopupComponentsField from "@/components/website/PopupComponentsField";

// The AI-assisted way of building the pop-up. One prompt either drafts the whole
// thing or changes just the part you name — the title, the message, the button,
// the image, the background — and leaves everything else exactly as it is.
export default function PopupAiDraft({ form, set, components, onComponentsChange, onDrafted }) {
  const [instruction, setInstruction] = useState("");
  const [step, setStep] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const busy = !!step;
  const hasContent = !!(form.popup_title || form.popup_message || form.popup_image_url);

  const referenceNote = components.length
    ? " The attached images are the organization's own brand components. Reproduce them faithfully and place them naturally in the composition — never redraw, recolour or restyle a logo."
    : "";

  const apply = async () => {
    if (!instruction.trim()) {
      setError("Say what you would like written or changed.");
      return;
    }
    setError("");
    setResult("");
    const changed = [];
    try {
      setStep("text");
      const plan = await base44.integrations.Core.InvokeLLM({
        prompt: `You are editing the pop-up that opens over the home page of the website of ${
          form.site_name || "Candora"
        }, a community charity in Canada.
${form.about_summary ? `About the organization: ${form.about_summary}` : ""}

The pop-up as it stands now:
- title: ${form.popup_title || "(empty)"}
- message: ${form.popup_message || "(empty)"}
- button label: ${form.popup_button_label || "(empty)"}
- button link: ${form.popup_button_url || "(empty)"}
- image: ${form.popup_image_url ? "yes" : "none"}
- background behind the pop-up: ${form.popup_background_url ? "yes" : "none"}

The staff member's instruction: "${instruction.trim()}"

Change only what the instruction asks for. Return an empty string for every field that should stay as it is.
- title: at most 8 words, warm and direct, no exclamation marks.
- message: one or two sentences, at most 30 words, plain language a supporter understands.
- button_label: two or three words, an action such as "Donate now".
- button_url: only when the instruction asks where the button should go, e.g. /donate.
- change_image: true only when the instruction asks for a new or different card image, or when the pop-up has no image yet.
- image_prompt: a detailed visual description for that image, wide banner shape, no text or lettering in the picture.
- change_background: true only when the instruction asks for a different background behind the pop-up.
- background_prompt: a detailed description for that background photograph, no text or lettering.
If the pop-up is still empty, fill the title, message and button label from the instruction.
Never invent statistics, dollar amounts, dates or program names that were not given to you.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            message: { type: "string" },
            button_label: { type: "string" },
            button_url: { type: "string" },
            change_image: { type: "boolean" },
            image_prompt: { type: "string" },
            change_background: { type: "boolean" },
            background_prompt: { type: "string" },
          },
          required: [
            "title",
            "message",
            "button_label",
            "button_url",
            "change_image",
            "image_prompt",
            "change_background",
            "background_prompt",
          ],
        },
      });

      if (plan.title) {
        set("popup_title", plan.title);
        changed.push("title");
      }
      if (plan.message) {
        set("popup_message", plan.message);
        changed.push("message");
      }
      if (plan.button_label) {
        set("popup_button_label", plan.button_label);
        changed.push("button");
      }
      if (plan.button_url) {
        set("popup_button_url", plan.button_url);
        changed.push("button link");
      }

      if (plan.change_image) {
        setStep("image");
        const { url } = await base44.integrations.Core.GenerateImage({
          prompt: `Create the image for a small pop-up card on a charity website. ${
            plan.image_prompt || instruction.trim()
          } Compose it to read well as a wide banner roughly three times as wide as it is tall, with a clear focal point and no text or lettering.${referenceNote}`,
          existing_image_urls: components.map((component) => component.url).filter(Boolean),
        });
        if (url) {
          set("popup_image_url", url);
          changed.push("image");
        }
      }

      if (plan.change_background) {
        setStep("background");
        const { url } = await base44.integrations.Core.GenerateImage({
          prompt: `Create a background photograph that sits behind a pop-up on a charity website, dimmed, so the card in front stands out. ${
            plan.background_prompt || instruction.trim()
          } Wide landscape photograph, soft and calm, no text or lettering.`,
        });
        if (url) {
          set("popup_background_url", url);
          changed.push("background");
        }
      }

      if (changed.length) {
        const list =
          changed.length === 1
            ? changed[0]
            : `${changed.slice(0, -1).join(", ")} and ${changed[changed.length - 1]}`;
        setResult(`Updated the ${list}. Change anything else, or edit it directly.`);
        onDrafted?.();
        setInstruction("");
      } else {
        setResult("Nothing changed — try naming the part you want different.");
      }
    } catch (err) {
      setError(err.message || "That change could not be made.");
    } finally {
      setStep("");
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">
          {hasContent ? "Ask the AI for a change" : "What is this pop-up about?"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {hasContent
            ? "Name the part you want different — the title, the message, the button, the image or the background — and only that part changes."
            : "Describe it in a sentence and the AI writes the title, message and button, then creates the image."}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="popup-ai-instruction">{hasContent ? "What should change?" : "The brief"}</Label>
        <Textarea
          id="popup-ai-instruction"
          rows={2}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder={
            hasContent
              ? "Make the title shorter, change the button to Give today, and use a photo of a family in the snow"
              : "Our winter warmth appeal — a gift keeps a family's heat on this winter"
          }
        />
      </div>

      <PopupComponentsField components={components} onChange={onComponentsChange} />

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button type="button" size="sm" onClick={apply} disabled={busy} className="gap-1.5">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {step === "text"
            ? "Thinking…"
            : step === "image"
              ? "Creating the image…"
              : step === "background"
                ? "Creating the background…"
                : hasContent
                  ? "Apply to my pop-up"
                  : "Draft my pop-up"}
        </Button>
        <span className="text-[11px] text-muted-foreground">Nothing goes on the website until you save.</span>
      </div>

      {result && <p className="text-xs text-muted-foreground">{result}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}