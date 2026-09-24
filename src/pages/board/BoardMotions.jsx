import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { parseDateSmart } from "@/lib/dateUtils";
import { Gavel, ScrollText } from "lucide-react";

const RESULT_STYLES = {
  Carried: "bg-green-100 text-green-700",
  Defeated: "bg-red-100 text-red-700",
  Tabled: "bg-amber-100 text-amber-700",
  Withdrawn: "bg-slate-100 text-slate-600",
};

export default function BoardMotions() {
  const [motions, setMotions] = useState(null);

  useEffect(() => {
    base44.entities.BoardMotion.list("-seq", 500).then((list) => setMotions([...list].reverse()));
  }, []);

  if (!motions) {
    return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <Gavel size={20} className="text-primary" />
        <h1 className="font-heading text-2xl font-semibold">Motions</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-6">
        All recorded board motions, in chronological order. Motion IDs and records are captured automatically when final minutes are generated.
      </p>

      {motions.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <ScrollText size={28} className="mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">No motions recorded yet. Motions are saved when you generate a final PDF of a meeting's minutes.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-xl bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Motion ID</th>
                <th className="px-4 py-3">Meeting</th>
                <th className="px-4 py-3">Motion</th>
                <th className="px-4 py-3">Moved / Seconded</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3">Vote</th>
              </tr>
            </thead>
            <tbody>
              {motions.map((m) => (
                <tr key={m.id} className="border-b border-border last:border-0 align-top">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground whitespace-nowrap">{m.motion_id}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-foreground">{m.meeting_date ? format(parseDateSmart(m.meeting_date), "MMM d, yyyy") : "—"}</div>
                    {m.meeting_title && <div className="text-xs text-muted-foreground">{m.meeting_title}</div>}
                    {m.agenda_item_title && <div className="text-[10px] text-muted-foreground/70">{m.agenda_item_title}</div>}
                  </td>
                  <td className="px-4 py-3 min-w-[220px]">
                    {m.motion_verbiage && <p className="italic">&ldquo;{m.motion_verbiage}&rdquo;</p>}
                    {m.content && <p className="text-xs text-muted-foreground mt-1">{m.content}</p>}
                    {!m.motion_verbiage && !m.content && <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div>{m.moved_by ? `Moved: ${m.moved_by}` : "—"}</div>
                    {m.seconded_by && <div className="text-muted-foreground">Seconded: {m.seconded_by}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {m.motion_result ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RESULT_STYLES[m.motion_result] || "bg-muted text-muted-foreground"}`}>{m.motion_result}</span>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {(m.votes_in_favour != null || m.votes_opposed != null || m.votes_abstained != null) ? (
                      <span>{m.votes_in_favour ?? 0} · {m.votes_opposed ?? 0} · {m.votes_abstained ?? 0}</span>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}