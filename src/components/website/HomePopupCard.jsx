import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import WebsiteImageField from "@/components/website/WebsiteImageField";
import PopupCampaignSuggestions from "@/components/website/PopupCampaignSuggestions";

const FREQUENCIES = [
  { value: "every_visit", label: "Every visit" },
  { value: "once_per_session", label: "Once per visit" },
  { value: "once_per_day", label: "Once a day" },
];

export default function HomePopupCard({ form, set }) {
  const enabled = !!form.popup_enabled;

  return (
    <Card className="border-border/70">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">Home page pop-up</h2>
            <p className="text-sm text-muted-foreground mt-1">
              A message that opens over the website when someone lands on the home page — an appeal, an
              event or an announcement.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Visitors see it on the public website, not inside Website Studio — the preview below shows how it looks.
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
          <>
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

            <WebsiteImageField
              label="Pop-up image (optional)"
              value={form.popup_image_url}
              onChange={(url) => set("popup_image_url", url)}
            />

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

            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold mb-3">
                Preview
              </p>
              <div className="mx-auto max-w-sm rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                {form.popup_image_url && (
                  <img src={form.popup_image_url} alt="" className="w-full h-28 object-cover" />
                )}
                <div className="p-4 space-y-2">
                  <p className="font-display font-bold text-foreground">
                    {form.popup_title || "Your pop-up title"}
                  </p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {form.popup_message || "What the pop-up says to visitors."}
                  </p>
                  {form.popup_button_label && (
                    <span className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                      {form.popup_button_label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}