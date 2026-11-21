import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

// The phrases the AI thinks the organization should be found for, with the
// reason each one matters and the page it belongs on.
export default function KeywordIdeasCard({ keywords = [] }) {
  if (!keywords.length) return null;

  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" />
          <h2 className="font-display text-lg font-bold text-foreground">Phrases to be found for</h2>
        </div>
        <div className="space-y-2.5">
          {keywords.map((keyword) => (
            <div key={keyword.term} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-sm font-semibold text-foreground">{keyword.term}</span>
              {keyword.intent && (
                <span className="text-[11px] uppercase tracking-wide font-semibold text-primary/80">
                  {keyword.intent}
                </span>
              )}
              {keyword.note && (
                <span className="text-xs text-muted-foreground basis-full">{keyword.note}</span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}