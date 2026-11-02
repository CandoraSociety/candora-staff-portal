import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Search, UserPlus, X } from "lucide-react";

// Who is in the room. Attendees are picked from the staff directory and saved on
// the training-day plan, so shared handouts know exactly who to reach.
export default function PlanAttendeesDialog({ open, plan, onClose, onSaved }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(plan?.attendees || []);
    setQuery("");
    setLoading(true);
    base44.entities.Employee.list("last_name", 500)
      .then(list => setStaff(
        (list || [])
          .filter(e => e.email && e.status !== "terminated")
          .map(e => ({ name: `${e.first_name || ""} ${e.last_name || ""}`.trim(), email: e.email, position: e.position || "", department: e.department || "" }))
          .sort((a, b) => a.name.localeCompare(b.name))
      ))
      .finally(() => setLoading(false));
  }, [open, plan?.id]);

  const chosen = useMemo(() => new Set(selected.map(s => s.email.toLowerCase())), [selected]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter(s => `${s.name} ${s.email} ${s.position} ${s.department}`.toLowerCase().includes(q));
  }, [staff, query]);

  const toggle = (person) => {
    setSelected(prev => prev.some(s => s.email.toLowerCase() === person.email.toLowerCase())
      ? prev.filter(s => s.email.toLowerCase() !== person.email.toLowerCase())
      : [...prev, { name: person.name, email: person.email }]);
  };

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.TrainingDayPlan.update(plan.id, { attendees: selected });
      onSaved?.(selected);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[88vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Participants — {plan?.title || "training day"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 flex-1 min-h-0 flex flex-col">
          <div className="flex flex-wrap gap-1.5">
            {selected.length === 0 && (
              <p className="text-xs text-muted-foreground">Nobody added yet. Pick staff from the list below.</p>
            )}
            {selected.map(s => (
              <span key={s.email} className="inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-xs font-medium">
                {s.name || s.email}
                <button
                  onClick={() => setSelected(prev => prev.filter(x => x.email !== s.email))}
                  className="text-muted-foreground hover:text-destructive"
                  title={`Remove ${s.name || s.email}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search staff by name, email, position or department"
              className="w-full rounded-lg border bg-background pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border divide-y">
            {loading && (
              <p className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading staff…
              </p>
            )}
            {!loading && matches.length === 0 && (
              <p className="px-3 py-4 text-sm text-muted-foreground">No staff match that search.</p>
            )}
            {matches.map(person => {
              const on = chosen.has(person.email.toLowerCase());
              return (
                <button
                  key={person.email}
                  onClick={() => toggle(person)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/60 ${on ? "bg-primary/5" : ""}`}
                >
                  <span
                    className="flex items-center justify-center w-4 h-4 rounded shrink-0 border"
                    style={on ? { background: "hsl(var(--primary))", borderColor: "hsl(var(--primary))" } : undefined}
                  >
                    {on && <Check className="w-3 h-3 text-primary-foreground" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium truncate">{person.name || person.email}</span>
                    <span className="block text-[11px] text-muted-foreground truncate">
                      {[person.position, person.department].filter(Boolean).join(" · ") || person.email}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <span className="text-xs text-muted-foreground mr-auto">
            {selected.length} participant{selected.length === 1 ? "" : "s"} added
          </span>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null} Save participants
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}