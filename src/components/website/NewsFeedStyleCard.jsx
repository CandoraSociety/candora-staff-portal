import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STYLES = [
  { value: "grid", label: "Grid of cards", hint: "Posts sit side by side in a grid." },
  { value: "scroll", label: "Scrolling row", hint: "Posts move across the screen in one continuous strip." },
  { value: "fade", label: "Fade in and out", hint: "One post at a time, fading from one to the next." },
  { value: "list", label: "Simple list", hint: "One post per row, nothing moves." },
];

const SPEEDS = [
  { value: "slow", label: "Slow" },
  { value: "normal", label: "Normal" },
  { value: "fast", label: "Fast" },
];

export default function NewsFeedStyleCard({ form, set }) {
  const style = form.news_feed_style || "grid";
  const active = STYLES.find((item) => item.value === style) || STYLES[0];
  const animated = style === "scroll" || style === "fade";

  return (
    <Card className="border-border/70">
      <CardContent className="p-6 space-y-4">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">News feed style</h2>
          <p className="text-sm text-muted-foreground mt-1">
            How published news posts appear on the website.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Style</Label>
            <Select value={style} onValueChange={(value) => set("news_feed_style", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{active.hint}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="news-limit">How many posts to show</Label>
            <Input
              id="news-limit"
              type="number"
              min={1}
              max={24}
              value={form.news_feed_limit ?? 6}
              onChange={(e) => set("news_feed_limit", Number(e.target.value) || 0)}
            />
          </div>

          {animated && (
            <div className="space-y-1.5">
              <Label>Speed</Label>
              <Select
                value={form.news_feed_speed || "normal"}
                onValueChange={(value) => set("news_feed_speed", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPEEDS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {animated && (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium text-foreground">Pause on hover</p>
              <p className="text-xs text-muted-foreground">Stops the movement while a visitor points at it.</p>
            </div>
            <Switch
              checked={form.news_feed_pause_on_hover !== false}
              onCheckedChange={(value) => set("news_feed_pause_on_hover", value)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}