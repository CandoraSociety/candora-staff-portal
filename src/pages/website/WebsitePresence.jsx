import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Search } from "lucide-react";
import PresenceChecklist from "@/components/website/presence/PresenceChecklist";
import { PRESENCE_ITEMS } from "@/lib/websitePresence";

// Everything that decides whether someone — or an AI assistant — can find
// Candora online, as a checklist whose state is kept in the app.
export default function WebsitePresence() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["website-presence-items"],
    queryFn: () =>
      base44.entities.WebsitePresenceItem.list({ limit: 200 }).then((res) => res.items || []),
  });

  const recordsByKey = useMemo(() => {
    const map = {};
    records.forEach((record) => {
      map[record.item_key] = record;
    });
    return map;
  }, [records]);

  const done = PRESENCE_ITEMS.filter((item) => recordsByKey[item.key]?.status === "done").length;
  const percent = Math.round((done / PRESENCE_ITEMS.length) * 100);

  const upsert = async (item, values) => {
    const existing = recordsByKey[item.key];
    const payload = {
      item_key: item.key,
      label: item.label,
      category: item.category,
      link_url: item.link || "",
      ...values,
    };
    if (existing) await base44.entities.WebsitePresenceItem.update(existing.id, payload);
    else await base44.entities.WebsitePresenceItem.create(payload);
    await queryClient.invalidateQueries({ queryKey: ["website-presence-items"] });
  };

  const changeStatus = async (item, status) => {
    try {
      await upsert(item, {
        status,
        completed_at: status === "done" ? new Date().toISOString() : null,
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Could not save", description: error.message });
    }
  };

  const saveNotes = async (item, notes) => {
    try {
      await upsert(item, { notes, status: recordsByKey[item.key]?.status || "todo" });
    } catch (error) {
      toast({ variant: "destructive", title: "Could not save the note", description: error.message });
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Website Studio</p>
          <h1 className="font-display text-3xl font-bold text-foreground mt-1">Online presence</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            The listings, profiles and technical foundations that decide whether people and AI assistants can find
            Candora — with the state of each kept here.
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2 self-start sm:self-auto">
          <Link to="/website/seo">
            <Search className="w-4 h-4" /> Search visibility
          </Link>
        </Button>
      </header>

      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">
                Presence score
              </p>
              <p className="font-display text-3xl font-extrabold text-foreground leading-none mt-1">
                {done}
                <span className="text-sm font-semibold text-muted-foreground"> / {PRESENCE_ITEMS.length} done</span>
              </p>
            </div>
            <span className="text-sm font-bold text-muted-foreground">{percent}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-success transition-all" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">
            Tick what is already in place. Anything left is a gap a stranger — or an AI assistant — will hit.
          </p>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : (
        <PresenceChecklist
          recordsByKey={recordsByKey}
          onStatusChange={changeStatus}
          onSaveNotes={saveNotes}
        />
      )}
    </div>
  );
}