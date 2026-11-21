import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";

const SEVERITY_STYLE = {
  high: { chip: "bg-destructive/10 text-destructive", label: "Fix now" },
  medium: { chip: "bg-warning/10 text-warning", label: "Soon" },
  low: { chip: "bg-muted text-muted-foreground", label: "Polish" },
};

// What the AI found, worst first, with the exact change for each — plus the
// handful of changes worth doing before anything else.
export default function SeoFindingsList({ findings = [], quickWins = [] }) {
  if (!findings.length && !quickWins.length) return null;

  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <h2 className="font-display text-lg font-bold text-foreground">What to fix</h2>
        </div>

        {quickWins.length > 0 && (
          <div className="rounded-lg border border-primary/25 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Lightbulb className="w-3.5 h-3.5 text-primary" /> Do these first
            </div>
            <ul className="space-y-1.5">
              {quickWins.map((win) => (
                <li key={win} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-primary font-bold">·</span>
                  <span>{win}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="divide-y divide-border/60">
          {findings.map((finding, index) => {
            const style = SEVERITY_STYLE[finding.severity] || SEVERITY_STYLE.low;
            return (
              <div key={`${finding.area}-${index}`} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${style.chip}`}>
                    {style.label}
                  </span>
                  <span className="text-xs font-semibold text-foreground">{finding.area}</span>
                </div>
                <p className="text-sm text-foreground leading-snug">{finding.issue}</p>
                <p className="text-sm text-muted-foreground flex gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" />
                  <span>{finding.fix}</span>
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}