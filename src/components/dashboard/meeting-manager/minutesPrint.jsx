import { format } from "date-fns";

const ENTRY_TYPE_LABELS = {
  motion: "Motion",
  resolution: "Resolution",
  action_item: "Action Item",
  discussion: "Discussion",
  information: "Information",
  dissent: "Dissent",
  abstention: "Abstention",
  in_camera: "In Camera",
  note: "Note",
};

/**
 * Generates a printable HTML document for meeting minutes.
 * @param {Object} meeting - The meeting object
 * @param {Array} agendaItems - Sorted agenda items
 * @param {Object} entriesByItem - Entries grouped by agenda_item_id
 * @param {boolean} isOfficial - true = official minutes (no notes, in camera redacted), false = unofficial (full)
 */
export function generateMinutesHTML(meeting, agendaItems, entriesByItem, isOfficial) {
  const title = meeting?.title || "Meeting";
  const dateStr = meeting?.meeting_date
    ? format(new Date(meeting.meeting_date), "MMMM d, yyyy 'at' h:mm a")
    : "";
  const meta = [
    dateStr,
    meeting?.location ? `Location: ${meeting.location}` : "",
    meeting?.facilitator ? `Facilitator: ${meeting.facilitator}` : "",
  ].filter(Boolean).join(" · ");

  const itemsHtml = agendaItems.map((item, idx) => {
    const allEntries = entriesByItem[item.id] || [];
    const visibleEntries = isOfficial
      ? allEntries.filter((e) => e.entry_type !== "note")
      : allEntries;

    if (visibleEntries.length === 0) return "";

    const entriesHtml = visibleEntries
      .map((entry) => {
        // Official: in camera entries just say "In camera discussion"
        if (isOfficial && entry.entry_type === "in_camera") {
          return `<div class="entry"><span class="in-camera-label">In camera discussion</span></div>`;
        }

        const isMotion = entry.entry_type === "motion" || entry.entry_type === "resolution";
        const isNote = entry.entry_type === "note";
        const resultClass =
          entry.motion_result === "carried"
            ? "carried"
            : entry.motion_result === "defeated"
              ? "defeated"
              : "";
        const contentClass = [
          isMotion ? "motion" : "",
          isMotion ? resultClass : "",
          isNote ? "notes" : "",
        ]
          .filter(Boolean)
          .join(" ");

        const label = isOfficial
          ? ENTRY_TYPE_LABELS[entry.entry_type] || entry.entry_type
          : `${ENTRY_TYPE_LABELS[entry.entry_type] || entry.entry_type}${isNote ? " (unofficial)" : ""}`;

        let meta = "";
        if (isMotion) {
          meta = [
            entry.moved_by ? `Moved: ${entry.moved_by}` : "",
            entry.seconded_by ? `Seconded: ${entry.seconded_by}` : "",
            entry.motion_result
              ? `<span class="${resultClass}">${entry.motion_result.charAt(0).toUpperCase() + entry.motion_result.slice(1)}</span>`
              : "",
          ]
            .filter(Boolean)
            .join(" · ");
        }
        if (entry.entry_type === "action_item") {
          meta = [
            entry.action_assigned_to ? `Assigned: ${entry.action_assigned_to}` : "",
            entry.action_due_date ? `Due: ${format(new Date(entry.action_due_date), "MMM d, yyyy")}` : "",
          ]
            .filter(Boolean)
            .join(" · ");
        }

        return `
          <div class="entry">
            <span class="entry-type">${label}</span>
            ${entry.content ? `<p class="${contentClass}">${escapeHtml(entry.content)}</p>` : ""}
            ${meta ? `<div class="entry-meta">${meta}</div>` : ""}
          </div>`;
      })
      .join("");

    return `
      <div class="agenda-item">
        <h2>${idx + 1}. ${escapeHtml(item.title)}</h2>
        ${entriesHtml}
      </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)} — ${isOfficial ? "Official" : "Unofficial"} Minutes</title>
  <style>
    @page { margin: 1in; }
    body { font-family: 'Inter', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #1a2744; }
    h1 { font-size: 22px; margin: 0 0 4px 0; }
    h2 { font-size: 15px; margin: 24px 0 8px 0; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }
    .meta { color: #64748b; font-size: 13px; margin-bottom: 8px; }
    .banner { padding: 10px 16px; border-radius: 6px; margin-bottom: 24px; font-size: 13px; }
    .banner.official { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; }
    .banner.unofficial { background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; }
    .agenda-item { margin-bottom: 16px; }
    .entry { margin-bottom: 10px; padding-left: 16px; }
    .entry-type { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #0f1f6b; }
    .entry p { margin: 2px 0; font-size: 13px; line-height: 1.5; }
    .entry p.motion { font-weight: bold; font-style: italic; }
    .entry p.carried { color: #16a34a; }
    .entry p.defeated { color: #dc2626; }
    .entry p.notes { color: #dc2626; }
    .in-camera-label { font-style: italic; color: #64748b; font-size: 13px; }
    .entry-meta { font-size: 12px; color: #64748b; margin-top: 2px; }
    .carried { color: #16a34a; font-weight: 600; }
    .defeated { color: #dc2626; font-weight: 600; }
  </style>
</head>
<body>
  ${isOfficial
    ? '<div class="banner official"><strong>OFFICIAL MINUTES</strong></div>'
    : '<div class="banner unofficial"><strong>UNOFFICIAL MINUTES</strong> — For Board Chair and Executive Director only. Contains private notes and in camera details.</div>'}
  <h1>${escapeHtml(title)}</h1>
  <div class="meta">${meta}</div>
  ${itemsHtml || '<p style="color:#94a3b8;font-style:italic;">No minutes recorded yet.</p>'}
</body>
</html>`;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function printMinutes(meeting, agendaItems, entriesByItem, isOfficial) {
  const html = generateMinutesHTML(meeting, agendaItems, entriesByItem, isOfficial);
  const printWindow = window.open("", "_blank");
  if (!printWindow) return false;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 500);
  return true;
}