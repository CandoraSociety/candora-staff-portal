import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Creates the pop-up's image from a written direction plus the uploaded brand
// components, which are passed along as reference images.
export default function PopupAiImage({ components = [], imageUrl, onImage, title }) {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setBusy(true);
    setError("");
    try {
      const direction =
        prompt.trim() ||
        `A warm, hopeful photo for a home page pop-up${title ? ` about "${title}"` : ""}, for a community charity in Canada.`;
      const referenceNote = components.length
        ? " The attached images are the organization's own brand components. Reproduce them faithfully and place them naturally in the composition — never redraw, recolour or restyle a logo."
        : "";
      const { url } = await base44.integrations.Core.GenerateImage({
        prompt: `Create the hero image for a small pop-up card on a charity website. ${direction} Compose it to read well as a wide banner roughly three times as wide as it is tall, with a clear focal point and no text or lettering.${referenceNote}`,
        existing_image_urls: components.map((component) => component.url).filter(Boolean),
      });
      onImage(url);
    } catch (err) {
      setError(err.message || "The image could not be created.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border p-4 bg-muted/20">
      <div>
        <p className="text-sm font-semibold text-foreground">Create the pop-up image</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Describe the visual you want. The components above are included automatically.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="popup-image-prompt">Direction for the image</Label>
        <Textarea
          id="popup-image-prompt"
          rows={2}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A family sharing a warm meal in a bright community kitchen, soft winter light"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={generate} disabled={busy} className="gap-1.5">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {busy ? "Creating image…" : imageUrl ? "Create another image" : "Create image"}
        </Button>
        {imageUrl && (
          <Button type="button" size="sm" variant="ghost" onClick={() => onImage("")} className="gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Remove image
          </Button>
        )}
        {components.length > 0 && (
          <span className="text-xs text-muted-foreground">
            Using {components.length} component{components.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {imageUrl && (
        <div className="rounded-lg border border-border bg-card overflow-hidden max-w-sm">
          <img src={imageUrl} alt="" className="w-full h-32 object-cover" />
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}