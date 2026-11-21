import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Gauge } from "lucide-react";

const toneFor = (score) =>
  score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive";

const barFor = (score) =>
  score >= 80 ? "bg-success" : score >= 60 ? "bg-warning" : "bg-destructive";

// The site's search and AI-discovery score, with the AI review that produces it.
export default function SeoScoreCard({ audit, stats, isRunning, onRun }) {
  const score = audit?.score ?? 0;
  const hasAudit = !!audit;

  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">
              Search &amp; AI visibility
            </p>
            <div className="flex items-end gap-2 mt-2">
              <span className={`font-display text-4xl font-extrabold leading-none ${toneFor(score)}`}>
                {hasAudit ? score : "—"}
              </span>
              <span className="text-xs text-muted-foreground mb-1">/ 100</span>
            </div>
          </div>
          <Button onClick={onRun} disabled={isRunning} className="gap-2">
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {hasAudit ? "Review again" : "Run AI review"}
          </Button>
        </div>

        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barFor(score)}`}
            style={{ width: `${hasAudit ? Math.max(4, score) : 0}%` }}
          />
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {hasAudit
            ? audit.summary
            : "Run a review and the AI reads every page of the site the way a search engine and an AI assistant would, then tells you what to change."}
        </p>

        <div className="grid grid-cols-3 gap-3 pt-1">
          {[
            { label: "Pages titled", value: `${stats.titled}/${stats.total}` },
            { label: "Pages described", value: `${stats.described}/${stats.total}` },
            { label: "Phrases found", value: stats.keywords },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                {item.label}
              </p>
              <p className="text-sm font-bold text-foreground mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>

        {hasAudit && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1 border-t border-border/60">
            <Gauge className="w-3.5 h-3.5" />
            Reviewed by {audit.generated_by_name || "staff"} on{" "}
            {new Date(audit.created_date).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}