import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Lightbulb, Plus, Check } from "lucide-react";

const SECTION_LABEL = {
  business_arising: "Business Arising",
  reports: "Reports",
  new_business: "New Business",
};

// Suggests board-relevant agenda items pulled from real organizational data:
// items carried forward from the previous meeting's agenda, the ED board report
// status for this meeting's month, upcoming events, active strategic goals, and
// recently uploaded board documents.
export default function BoardAgendaSuggestions({ meeting, existingTitles, onAdd }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [meetingsRes, reportsRes, eventsRes, goalsRes, docsRes] = await Promise.allSettled([
        base44.entities.Meeting.list("-meeting_date", 50),
        base44.entities.EDBoardReport.list("-report_month", 24),
        base44.entities.Event.list("-start_date", 50),
        base44.entities.StrategicGoal.list("-created_date", 50),
        base44.entities.BoardDocument.list("-created_date", 20),
      ]);

      const results = [];

      // Business Arising — items from the last meeting's agenda worth revisiting
      if (meetingsRes.status === "fulfilled" && meeting?.id) {
        const previous = (meetingsRes.value || []).find((m) => m.id !== meeting.id);
        if (previous) {
          try {
            const prevItems = await base44.entities.AgendaItem.filter({ meeting_id: previous.id });
            const carry = (prevItems || [])
              .filter((i) => ["new_business", "business_arising", "other"].includes(i.item_type))
              .slice(0, 6);
            carry.forEach((i) =>
              results.push({
                id: `arising-${i.id}`,
                section: "business_arising",
                item_type: "business_arising",
                title: i.title,
                description: `Carried from the ${format(new Date(previous.meeting_date), "MMM d")} agenda (${previous.title}). Update the board and capture next steps.`,
                duration_minutes: 5,
              })
            );
          } catch {
            // previous agenda unavailable — skip this group
          }
        }
      }

      // Reports — ED board report status for this meeting's month
      if (reportsRes.status === "fulfilled" && meeting?.meeting_date) {
        const month = format(new Date(meeting.meeting_date), "yyyy-MM");
        const match = (reportsRes.value || []).find(
          (r) => r.report_month && format(new Date(r.report_month), "yyyy-MM") === month
        );
        if (match) {
          const statusText =
            match.status === "imported"
              ? "imported and ready to table"
              : match.status === "completed"
                ? "completed"
                : `still in ${match.status} status`;
          results.push({
            id: `edr-${match.id}`,
            section: "reports",
            item_type: "reports",
            title: `Executive Director Report — ${format(new Date(match.report_month), "MMMM yyyy")}`,
            description: `The ${format(new Date(match.report_month), "MMMM yyyy")} board report is ${statusText}. Motion to receive it into the record.`,
            duration_minutes: 15,
          });
        }
      }

      // New Business — upcoming events
      if (eventsRes.status === "fulfilled") {
        const now = new Date();
        const upcoming = (eventsRes.value || [])
          .filter((e) => e.start_date && new Date(e.start_date) >= now && !["completed", "cancelled"].includes(e.status))
          .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
          .slice(0, 3);
        upcoming.forEach((e) =>
          results.push({
            id: `ev-${e.id}`,
            section: "new_business",
            item_type: "new_business",
            title: e.name,
            description: `Upcoming ${e.event_type?.replace(/_/g, " ") || "event"} on ${format(new Date(e.start_date), "MMM d, yyyy")}${e.location ? ` at ${e.location}` : ""}. Update the board on preparations, budget and attendance targets.`,
            duration_minutes: 10,
          })
        );
      }

      // New Business — strategic goals in progress / at risk
      if (goalsRes.status === "fulfilled") {
        const goals = goalsRes.value || [];
        const active = goals.filter((g) => ["in_progress", "on_track"].includes(g.status)).slice(0, 3);
        if (active.length) {
          results.push({
            id: "sp-review",
            section: "new_business",
            item_type: "new_business",
            title: "Strategic Plan — progress review",
            description: `${active.length} strategic goal${active.length === 1 ? " is" : "s are"} active (${active.map((g) => g.goal).slice(0, 2).join("; ")}${active.length > 2 ? "…" : ""}). Review status and progress with the board.`,
            duration_minutes: 10,
          });
        }
        goals
          .filter((g) => g.status === "at_risk")
          .slice(0, 2)
          .forEach((g) =>
            results.push({
              id: `goal-${g.id}`,
              section: "new_business",
              item_type: "new_business",
              title: `At-risk strategic goal: ${g.goal}`,
              description: `This goal is flagged at risk${g.owner ? ` (owner: ${g.owner})` : ""}. Present the blockers and ask the board for guidance or support.`,
              duration_minutes: 5,
            })
          );
      }

      // Review items — recently added board documents
      if (docsRes.status === "fulfilled") {
        (docsRes.value || [])
          .filter((d) => ["financial_report", "policy", "bylaw"].includes(d.document_type))
          .slice(0, 3)
          .forEach((d) =>
            results.push({
              id: `doc-${d.id}`,
              section: d.document_type === "financial_report" ? "reports" : "new_business",
              item_type: d.document_type === "financial_report" ? "reports" : "new_business",
              title: `Review: ${d.title}`,
              description: `Board document (${d.document_type.replace(/_/g, " ")}) recently uploaded — present for the board to read and discuss.`,
              duration_minutes: 5,
            })
          );
      }

      if (!cancelled) {
        setSuggestions(results);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [meeting?.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2">
        Nothing new to suggest right now — the agenda core below covers the standing items.
      </p>
    );
  }

  const sections = ["business_arising", "reports", "new_business"].filter(
    (key) => suggestions.some((s) => s.section === key)
  );

  return (
    <div className="space-y-3">
      {sections.map((key) => (
        <div key={key}>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            For {SECTION_LABEL[key]}
          </p>
          <div className="space-y-1.5">
            {suggestions
              .filter((s) => s.section === key)
              .map((s) => {
                const added = existingTitles.has(s.title);
                return (
                  <div
                    key={s.id}
                    className="flex items-start gap-3 border border-border rounded-lg p-3 bg-background"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-snug">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.description}</p>
                    </div>
                    <button
                      onClick={() => onAdd(s)}
                      disabled={added}
                      className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                        added ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:opacity-90"
                      }`}
                    >
                      {added ? <Check size={13} /> : <Plus size={13} />}
                      {added ? "Added" : "Add"}
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}