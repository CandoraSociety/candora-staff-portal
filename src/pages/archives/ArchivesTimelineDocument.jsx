import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

const ERA_LABELS = {
  founding: "The Founding Era",
  growth: "The Growth Years",
  expansion: "Era of Expansion",
  milestone: "Milestones",
  modern: "The Modern Era",
};

export default function ArchivesTimelineDocument() {
  const { data: items } = useQuery({
    queryKey: ["archiveTimelineItems"],
    queryFn: () => base44.entities.ArchiveTimelineItem.list("-year", 500),
  });

  // Sort chronologically (oldest first)
  const sorted = (items || []).slice().sort((a, b) => {
    const aDate = (a.year || 0) * 100 + (a.month || 0);
    const bDate = (b.year || 0) * 100 + (b.month || 0);
    return aDate - bDate;
  });

  // Group by era
  const eraOrder = ["founding", "growth", "expansion", "milestone", "modern"];
  const grouped = {};
  sorted.forEach(item => {
    const era = item.era || "milestone";
    if (!grouped[era]) grouped[era] = [];
    grouped[era].push(item);
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-3xl font-display font-bold">The Candora Chronicle</h1>
          <p className="text-muted-foreground">The complete history, told in sequence.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print
        </Button>
      </div>

      {/* Title page */}
      <div className="text-center py-12 border-y">
        <h2 className="text-4xl font-display font-bold text-primary">The Candora Chronicle</h2>
        <p className="text-muted-foreground mt-2">A Living History</p>
        {sorted.length > 0 && (
          <p className="text-sm text-muted-foreground mt-4">{sorted[0].year} — {sorted[sorted.length - 1].year}</p>
        )}
      </div>

      {eraOrder.map(era => {
        const eraItems = grouped[era];
        if (!eraItems || eraItems.length === 0) return null;
        return (
          <div key={era} className="space-y-6">
            <div className="border-b pb-2">
              <h3 className="text-2xl font-display font-bold text-accent">{ERA_LABELS[era] || era}</h3>
            </div>
            {eraItems.map(item => {
              const monthName = item.month ? ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][item.month] : "";
              return (
                <div key={item.id} className="space-y-3 print-break">
                  <div className="flex items-baseline gap-3">
                    <span className="text-xl font-display font-bold text-primary flex-shrink-0">{item.year}</span>
                    {monthName && <span className="text-sm text-muted-foreground">{monthName}{item.day ? ` ${item.day}` : ""}</span>}
                    <h4 className="text-lg font-semibold">{item.title}</h4>
                  </div>
                  {item.summary && <p className="text-sm text-muted-foreground italic">{item.summary}</p>}
                  {item.detailed_content && (
                    <div className="prose prose-sm max-w-none text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: item.detailed_content }} />
                  )}
                  {item.media && item.media.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {item.media.filter(m => m.type === "photo").map((m, i) => (
                        <figure key={i} className="space-y-1">
                          <img src={m.url} alt={m.caption || ""} className="rounded-lg w-full max-h-64 object-cover" />
                          {m.caption && <figcaption className="text-xs text-muted-foreground text-center">{m.caption}</figcaption>}
                        </figure>
                      ))}
                    </div>
                  )}
                  <div className="border-b border-dashed border-border" />
                </div>
              );
            })}
          </div>
        );
      })}

      {sorted.length === 0 && (
        <p className="text-muted-foreground text-center py-12">No timeline items have been added yet.</p>
      )}
    </div>
  );
}