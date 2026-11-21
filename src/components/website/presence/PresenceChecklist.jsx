import { Card, CardContent } from "@/components/ui/card";
import PresenceItemRow from "@/components/website/presence/PresenceItemRow";
import { PRESENCE_CATEGORIES, itemsForCategory } from "@/lib/websitePresence";

// The presence checklist, grouped by what it is for, with each group's progress
// so the weak spots stand out.
export default function PresenceChecklist({ recordsByKey, onStatusChange, onSaveNotes }) {
  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      {PRESENCE_CATEGORIES.map((category) => {
        const items = itemsForCategory(category.id);
        const done = items.filter((item) => recordsByKey[item.key]?.status === "done").length;
        return (
          <Card key={category.id} className="border-border/70 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3 pb-2">
                <div>
                  <h2 className="font-display text-base font-bold text-foreground">{category.label}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{category.blurb}</p>
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground flex-shrink-0">
                  {done}/{items.length}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-1">
                <div
                  className="h-full rounded-full bg-success transition-all"
                  style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }}
                />
              </div>
              {items.map((item) => (
                <PresenceItemRow
                  key={item.key}
                  item={item}
                  record={recordsByKey[item.key]}
                  onStatusChange={onStatusChange}
                  onSaveNotes={onSaveNotes}
                />
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}