import { useState } from "react";
import { FileText, Printer } from "lucide-react";
import { PATHWAYS_HANDOUTS } from "@/lib/training/pathwaysHandouts";
import HandoutPrintDialog from "./HandoutPrintDialog";

// The printable material that goes with the room: the room's own agenda, a
// desk card, the practice worksheet and the sign-off sheet. Each one is built
// from the current plan, so times and dates match what is being taught.
export default function PlanMaterials({ plan }) {
  const [active, setActive] = useState(null);

  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="mb-3">
        <h2 className="font-bold">Materials for the room</h2>
        <p className="text-xs text-muted-foreground">
          Print these for the day. Each one follows this plan's dates, times and follow-up list.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {PATHWAYS_HANDOUTS.map((h) => (
          <button
            key={h.id}
            onClick={() => setActive(h)}
            className="flex items-start gap-3 rounded-xl border bg-background p-3 text-left hover:bg-accent print:hidden"
          >
            <FileText className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{h.title}</span>
              <span className="block text-xs text-muted-foreground">{h.blurb}</span>
            </span>
            <Printer className="w-3.5 h-3.5 ml-auto mt-1 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>

      <HandoutPrintDialog
        open={!!active}
        handout={active}
        plan={plan}
        onClose={() => setActive(null)}
      />
    </div>
  );
}