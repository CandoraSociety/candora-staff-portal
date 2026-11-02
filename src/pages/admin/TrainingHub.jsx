import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { BarChart3, GraduationCap, Presentation } from "lucide-react";
import TrainingProgressTab from "@/components/training/hub/TrainingProgressTab";
import FacilitateTab from "@/components/training/hub/FacilitateTab";

const TABS = [
  {
    key: "progress",
    label: "Staff progress",
    icon: BarChart3,
    blurb: "Pick a module and see who has started, who is practising, and who is finished.",
  },
  {
    key: "facilitate",
    label: "Facilitate",
    icon: Presentation,
    blurb: "Run a live session: one module on its own, or a whole training day from a saved plan.",
  },
];

export default function TrainingHub() {
  const { user } = useAuth();
  const [tab, setTab] = useState("progress");
  const isAdmin = user?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-md mx-auto mt-16">
        <div className="rounded-2xl border p-8 text-center" style={{ background: "hsl(230, 70%, 10%)", borderColor: "hsl(230, 50%, 22%)" }}>
          <GraduationCap className="w-10 h-10 mx-auto mb-3" style={{ color: "hsl(45, 92%, 53%)" }} />
          <h2 className="text-lg font-bold mb-1" style={{ color: "hsl(45, 60%, 90%)" }}>Admins only</h2>
          <p className="text-sm" style={{ color: "hsl(230, 25%, 60%)" }}>
            The Training Hub shows every staff member's training progress. Ask an administrator for access.
          </p>
        </div>
      </div>
    );
  }

  const active = TABS.find(t => t.key === tab) || TABS[0];

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Training Hub</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{active.blurb}</p>
      </div>

      <div className="inline-flex rounded-xl border bg-muted/40 p-1 gap-1">
        {TABS.map(t => {
          const Icon = t.icon;
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${on ? "" : "text-muted-foreground hover:bg-accent"}`}
              style={on ? { background: "hsl(45, 92%, 53%)", color: "hsl(230, 70%, 10%)" } : undefined}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "progress" ? <TrainingProgressTab /> : <FacilitateTab />}
    </div>
  );
}