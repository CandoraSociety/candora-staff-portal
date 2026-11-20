import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import WebsiteImageField from "@/components/website/WebsiteImageField";
import PopupCampaignSuggestions from "@/components/website/PopupCampaignSuggestions";
import PopupAiDraft from "@/components/website/PopupAiDraft";
import PopupPreview from "@/components/website/PopupPreview";

const FREQUENCIES = [
  { value: "every_visit", label: "Every visit" },
  { value: "once_per_session", label: "Once per visit" },
  { value: "once_per_day", label: "Once a day" },
];

const MODES = [
  { value: "manual", label: "Write it myself" },
  { value: "ai", label: "Draft it with AI" },
];

export default function HomePopupCard({ form, set }) {
  const enabled = !!form.popup_enabled;
  const components = Array.isArray(form.popup_components) ? form.popup_components : [];
  const [mode, setMode] = useState(() =>
    form.popup_title || form.popup_message ? "manual" : "ai"
  );
  const [drafted, setDrafted] = useState(false);

  return (
    <Card className="border-border/70">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">Home page pop-up</h2>
            <p className="text-sm text-muted-foreground mt-1">
              A message that opens over the website when someone lands on the home page — an appeal, an
              event or an announcement.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Visitors see it on the public website, not inside Website Studio — the preview shows how it looks.
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={(value) => set("popup_enabled", value)} />
        </div>

        <PopupCampaignSuggestions set={set} />

        {!enabled ? (
          <p className="text-xs italic text-muted-foreground">
            Off — visitors go straight to the home page.
          </p>
        ) : (
          <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
            <div className="space-y-5">
              <div className="inline-flex rounded-lg border border-border bg-muted p-1">
                {MODES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setMode(item.value)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold rounded-md transition-colors",
                      mode === item.value
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {mode === "ai" && (
                <PopupAiDraft
                  form={form}
                  set={set}
                  components={components}
                  onComponentsChange={(next) => set("popup_components", next)}
                  onDrafted={() => setDrafted(true)}
                />
              )}

              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground">
                  {mode === "ai" && drafted ? "Your draft — change anything" : "Pop-up content"}
                </p>

                <div className="space-y-1.5">
                  <Label htmlFor="popup-title">Title</Label>
                  <Input
                    id="popup-title"
                    value={form.popup_title || ""}
                    onChange={(e) => set("popup_title", e.target.value)}
                    placeholder="Give the gift of a warm winter"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="popup-message">Message</Label>
                  <Textarea
                    id="popup-message"
                    rows={3}
                    value={form.popup_message || ""}
                    onChange={(e) => set("popup_message", e.target.value)}
                    placeholder="What the pop-up says to visitors"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="popup-button-label">Button label (optional)</Label>
                    <Input
                      id="popup-button-label"
                      value={form.popup_button_label || ""}
                      onChange={(e) => set("popup_button_label", e.target.value)}
                      placeholder="Donate now"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="popup-button-url">Button link</Label>
                    <Input
                      id="popup-button-url"
                      value={form.popup_button_url || ""}
                      onChange={(e) => set("popup_button_url", e.target.value)}
                      placeholder="/donate"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border p-4 space-y-4 bg-muted/20">
                <div>
                  <p className="text-sm font-semibold text-foreground">Image &amp; background</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    The image sits at the top of the card; the background sits behind the pop-up, dimmed.
                  </p>
                </div>

                <WebsiteImageField
                  label="Pop-up image (optional)"
                  value={form.popup_image_url}
                  onChange={(url) => set("popup_image_url", url)}
                  hint="Upload one or pick a brand asset — or let the AI create it."
                />

                <WebsiteImageField
                  label="Background behind the pop-up (optional)"
                  value={form.popup_background_url}
                  onChange={(url) => set("popup_background_url", url)}
                  hint="Leave empty for a plain dark backdrop."
                />
              </div>

              <div className="space-y-1.5 max-w-xs">
                <Label>How often to show it</Label>
                <Select
                  value={form.popup_frequency || "once_per_session"}
                  onValueChange={(value) => set("popup_frequency", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-xl border border-border p-4 space-y-3 bg-muted/30">
                <p className="text-sm font-semibold text-foreground">Schedule this pop-up</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="popup-starts">Show from (optional)</Label>
                    <Input
                      id="popup-starts"
                      type="datetime-local"
                      value={form.popup_starts_at || ""}
                      onChange={(e) => set("popup_starts_at", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="popup-ends">Show until (optional)</Label>
                    <Input
                      id="popup-ends"
                      type="datetime-local"
                      value={form.popup_ends_at || ""}
                      onChange={(e) => set("popup_ends_at", e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Leave both empty to show it from the moment you save. With dates set, the website starts and stops
                  showing it on its own.
                </p>
              </div>
            </div>

            <div className="space-y-2 lg:sticky lg:top-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">
                Live preview
              </p>
              <PopupPreview form={form} />
              <p className="text-[11px] text-muted-foreground">
                This is how it opens over the home page. Remember to save your site settings.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}