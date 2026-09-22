import { format } from "date-fns";
import { parseDateSmart } from "@/lib/dateUtils";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const CANDORA_LOGO_URL = "https://media.base44.com/images/public/6a249282cb496579542673b7/c6b242905_Candoracirclelogo_noanniversary.png";

export const AGENDA_SECTIONS = [
  { key: "administration", label: "Administration" },
  { key: "business_arising", label: "Business Arising" },
  { key: "new_business", label: "New Business" },
  { key: "reports", label: "Reports" },
  { key: "adjournment", label: "Adjournment" },
  { key: "other", label: "Other" },
];

// Fallback for items created before sections existed
const TYPE_SECTION = {
  call_to_order: "administration",
  approval_of_agenda: "administration",
  approval_of_minutes: "administration",
  business_arising: "business_arising",
  new_business: "new_business",
  reports: "reports",
  adjournment: "adjournment",
};

export const sectionOf = (item) => item.section || TYPE_SECTION[item.item_type] || "other";

// File name for the saved/printed agenda PDF
export function buildAgendaFileName({ meeting, variant }) {
  const date = parseDateSmart(meeting?.meeting_date) || new Date();
  return `Candora-Agenda_${format(date, "MMM-d-yyyy")}${variant === "distribution" ? "_Distribution" : ""}`;
}

// Builds the printable agenda document HTML.
// variant "full" = working copy with notes and time allocations
// variant "distribution" = titles and presenters only — notes and durations excluded
export function buildAgendaDocumentHtml({ meeting, items, variant }) {
  const full = variant !== "distribution";
  const fileName = buildAgendaFileName({ meeting, variant });

  const sorted = [...(items || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  const sectionHtml = AGENDA_SECTIONS
    .filter(({ key }) => sorted.some((i) => sectionOf(i) === key))
    .map(({ key, label }) => {
      const rows = sorted
        .filter((i) => sectionOf(i) === key)
        .map((item, idx) => `
          <tr>
            <td class="num">${idx + 1}.</td>
            <td>
              <div class="item-title">${esc(item.title)}${item.is_in_camera ? ' <span class="in-camera">(In Camera)</span>' : ""}</div>
              ${item.presenter ? `<div class="presenter">${esc(item.presenter)}</div>` : ""}
              ${full && item.description ? `<div class="notes">${esc(item.description)}</div>` : ""}
            </td>
            ${full ? `<td class="dur">${item.duration_minutes ? `${item.duration_minutes} min` : ""}</td>` : ""}
          </tr>`)
        .join("");
      return `
        <div class="section">
          <h2>${esc(label)}</h2>
          <table><tbody>${rows}</tbody></table>
        </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <title>${esc(fileName)}</title>
  <style>
    @page { size: letter portrait; margin: 0.75in; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 11pt; margin: 0; }
    .head { text-align: center; border-bottom: 3px solid #1e2f4d; padding-bottom: 14px; }
    .head img { height: 72px; }
    .head .org { font-size: 13pt; font-weight: bold; color: #1e2f4d; letter-spacing: 0.02em; }
    .head h1 { margin: 4px 0 2px; font-size: 16pt; color: #1e2f4d; }
    .head .when { font-size: 10.5pt; color: #333; }
    .head .where { font-size: 10pt; color: #555; margin-top: 2px; }
    .section h2 { font-size: 10.5pt; text-transform: uppercase; letter-spacing: 0.05em; color: #1e2f4d; border-bottom: 1px solid #1e2f4d; padding-bottom: 3px; margin: 18px 0 6px; }
    table { width: 100%; border-collapse: collapse; }
    td { vertical-align: top; padding: 6px 4px; border-bottom: 1px solid #e3e6ea; }
    td.num { width: 26px; color: #555; }
    td.dur { width: 70px; text-align: right; color: #555; font-size: 10pt; white-space: nowrap; }
    .item-title { font-weight: bold; }
    .presenter { font-size: 9.5pt; font-style: italic; color: #444; margin-top: 1px; }
    .notes { font-size: 10pt; color: #333; margin-top: 3px; white-space: pre-wrap; }
    .in-camera { color: #b45309; font-weight: normal; font-size: 9.5pt; }
    .foot { margin-top: 28px; font-size: 8pt; color: #777; border-top: 1px solid #ddd; padding-top: 6px; text-align: center; }
  </style>
</head>
<body>
  <div class="head">
    <img src="${CANDORA_LOGO_URL}" alt="Candora" />
    <div class="org">Candora Society of Edmonton</div>
    <h1>${esc(meeting?.title || "Board Meeting")} — Agenda</h1>
    <div class="when">${meeting?.meeting_date ? format(parseDateSmart(meeting.meeting_date), "MMMM d, yyyy 'at' h:mm a") : ""}</div>
    ${meeting?.location ? `<div class="where">${esc(meeting.location)}</div>` : ""}
  </div>
  ${sectionHtml}
  <div class="foot">Generated ${format(new Date(), "MMMM d, yyyy")}</div>
  <script>window.onload = function () { setTimeout(function () { window.print(); }, 350); };</` + `script>
</body>
</html>`;
}