import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, CalendarClock, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import ThemeStagePreview from "@/components/website/ThemeStagePreview";

const MODES = [
  { value: "auto", label: "Automatic" },
  { value: "manual", label: "Choose a stage" },
  { value: "off", label: "Off" },
];

export default function WebsiteThemesCard({ form, set }) {
  const mode = form.theme_mode || "auto";

  // The calendar, the stage list and the live stage all come from the server so
  // the Studio and the public website read the same Alberta dates.
  const { data, isLoading } = useQuery({
    queryKey: ["website-theme-calendar"],
    queryFn: () => base44.functions.invoke("getWebsiteTheme", {}).then((res) => res.data),
    staleTime: 5 * 60 * 1000,
  });

  const stages = data?.stages || [];
  const liveId = data?.active?.id || "none";
  const chosenId =
    mode === "off" ? "none" : mode === "manual" ? form.theme_manual_stage || "none" : liveId;
  const chosen = stages.find((stage) => stage.id === chosenId) || null;

  return (
    <Card className="border-border/70">
      <CardContent className="p-6 space-y-5">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">Seasonal themes</h2>
          <p className="text-sm text-muted-foreground mt-1">
            The website decorates itself through the year — Halloween from the morning after
            Canadian Thanksgiving, Christmas from December 1, and New Year's from December 31. Every
            change happens at midnight, Alberta time.
          </p>
        </div>

        <div className="inline-flex flex-wrap rounded-lg border border-border bg-muted p-1">
          {MODES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => set("theme_mode", item.value)}
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

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Working out the holiday calendar…
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-4">
              {mode === "auto" && (
                <>
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">
                      Live right now
                    </p>
                    <p className="font-display text-base font-bold text-foreground mt-1">
                      {data?.active?.label || "No theme"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {data?.active?.ends_label
                        ? `Runs until ${data.active.ends_label} at midnight, Alberta time.`
                        : "The site stays in its normal colours until the next holiday begins."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">What comes next</p>
                    <ul className="divide-y divide-border rounded-xl border border-border">
                      {(data?.schedule || []).map((item, index) => (
                        <li
                          key={`${item.id}-${index}`}
                          className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
                        >
                          <span className="font-medium text-foreground">{item.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.start_label} at midnight → {item.end_label} at midnight
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-muted-foreground">
                      Christmas Day swaps the hero headline to "Merry Christmas!" for the day. On New
                      Year's Eve a live countdown runs to midnight, and the moment it reaches zero the
                      fireworks and the new-year headline take over.
                    </p>
                  </div>
                </>
              )}

              {mode === "manual" && (
                <div className="grid sm:grid-cols-2 gap-2">
                  {stages.map((stage) => {
                    const selected = (form.theme_manual_stage || "none") === stage.id;
                    return (
                      <button
                        key={stage.id}
                        type="button"
                        onClick={() => set("theme_manual_stage", stage.id)}
                        className={cn(
                          "text-left rounded-xl border p-3 transition-colors",
                          selected
                            ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                            : "border-border hover:bg-muted/40"
                        )}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-foreground">{stage.label}</span>
                          {selected && <Check className="w-3.5 h-3.5 text-primary" />}
                        </span>
                        <span className="block text-[11px] text-muted-foreground mt-1 leading-snug">
                          {stage.description}
                        </span>
                      </button>
                    );
                  })}
                  <p className="text-[11px] text-muted-foreground sm:col-span-2">
                    The chosen stage stays on until you switch back to Automatic — use it to test a
                    stage, or to hold one on for a special occasion.
                  </p>
                </div>
              )}

              {mode === "off" && (
                <p className="text-sm text-muted-foreground">
                  Themes are off. The website keeps its normal colours all year, whatever the date.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5" /> Stage preview
              </p>
              <ThemeStagePreview stage={chosen} site={form} />
              <p className="text-[11px] text-muted-foreground">
                The home page in this stage, drawn with your real logo, hero copy, sunflower and top
                menu. Remember to save your site settings.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}