import { format } from "date-fns";
import { parseDateSmart } from "@/lib/dateUtils";
import { CANDORA_LOGO_URL } from "@/components/board/agendaDocumentHtml";
import { NOTES_TYPES, isCallToOrderItem, isApprovalOfAgendaItem, isApprovalOfMinutesItem, isNextMeetingItem, isAdjournMotionItem, isInvitationItem, has, fmtTime } from "@/components/board/minutesShared";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const entryHtml = (e, minimalMotion) => {
  if (e.type === "in_camera") return ""; // confidential — kept out of the regular minutes document
  if (e.type === "motion") {
    const anyVotes = !minimalMotion && [e.votes_in_favour, e.votes_opposed, e.votes_abstained].some(has);
    if (!has(e.motion_verbiage) && !has(e.moved_by) && !has(e.seconded_by) && !has(e.motion_result) && !anyVotes && !has(e.content)) return "";
    return `<div class="motion">
      <div class="mhead"><span>Motion</span>${e.motion_id ? `<span class="mid">${esc(e.motion_id)}</span>` : ""}</div>
      ${has(e.motion_verbiage) ? `<p><b>Motion:</b> &ldquo;${esc(e.motion_verbiage)}&rdquo;</p>` : ""}
      <div class="mgrid">
        ${has(e.moved_by) ? `<div><b>Moved by:</b> ${esc(e.moved_by)}</div>` : ""}
        ${has(e.seconded_by) ? `<div><b>Seconded by:</b> ${esc(e.seconded_by)}</div>` : ""}
        ${has(e.motion_result) ? `<div><b>Result:</b> ${esc(e.motion_result)}</div>` : ""}
        ${anyVotes ? `<div><b>Vote:</b> In favour ${has(e.votes_in_favour) ? esc(e.votes_in_favour) : 0} &middot; Opposed ${has(e.votes_opposed) ? esc(e.votes_opposed) : 0} &middot; Abstained ${has(e.votes_abstained) ? esc(e.votes_abstained) : 0}</div>` : ""}
      </div>
      ${has(e.content) ? `<p><b>Notes:</b> ${esc(e.content)}</p>` : ""}
    </div>`;
  }
  if (e.type === "action_item") {
    if (!has(e.action_assigned_to) && !has(e.action_due_date) && !has(e.content)) return "";
    return `<div class="entry"><div class="etype">Action Item</div>
      ${(has(e.action_assigned_to) || has(e.action_due_date)) ? `<p>Action assigned to ${esc(e.action_assigned_to || "—")}${has(e.action_due_date) ? ` &middot; Due ${format(parseDateSmart(e.action_due_date), "MMM d, yyyy")}` : ""}</p>` : ""}
      ${has(e.content) ? `<p><b>Notes:</b> ${esc(e.content)}</p>` : ""}
    </div>`;
  }
  if (![...NOTES_TYPES, "resolution"].includes(e.type) || !has(e.content)) return "";
  return `<div class="entry"><div class="etype">${esc(e.type.replace(/_/g, " "))}</div><p><b>Notes:</b> ${esc(e.content)}</p></div>`;
};

// Builds the standalone, stored copy of the finalized minutes (same content as the on-screen final document).
// In-camera entries are excluded — they live in the separate In-Camera Notes tab.
export function buildFinalMinutesHtml({ meeting, org, sections, members, present, guests, recorder, chair, entries, data }) {
  const regrets = (members || []).filter((m) => !present.includes(m.full_name)).map((m) => m.full_name);
  const dateStr = meeting?.meeting_date ? format(parseDateSmart(meeting.meeting_date), "MMMM d, yyyy 'at' h:mm a") : "";

  const itemHtml = (item, idx) => {
    const parts = [];
    if (!isInvitationItem(item)) {
      if (isCallToOrderItem(item)) {
        if (has(data.callTime)) parts.push(`<p>Called to order at ${esc(fmtTime(data.callTime))}.</p>`);
        if (has(data.callNotes)) parts.push(`<p><b>Notes:</b> ${esc(data.callNotes)}</p>`);
      } else if (isAdjournMotionItem(item)) {
        const bits = [];
        if (has(data.adjournBy)) bits.push(`Moved to adjourn by ${esc(data.adjournBy)}`);
        if (has(data.adjournTime)) bits.push(`Adjourned at ${esc(fmtTime(data.adjournTime))}`);
        if (bits.length) parts.push(`<p>${bits.join(", ")}.</p>`);
      } else if (isNextMeetingItem(item)) {
        if (has(data.nextDate)) parts.push(`<p>Next meeting: ${format(parseDateSmart(data.nextDate), "MMMM d, yyyy")}.</p>`);
        if (has(data.nextNotes)) parts.push(`<p><b>Notes:</b> ${esc(data.nextNotes)}</p>`);
      } else if (isApprovalOfAgendaItem(item)) {
        if (data.agendaApproved) parts.push("<p>Agenda approved as presented.</p>");
      } else {
        (entries[item.id] || []).filter((e) => e.type !== "in_camera").forEach((e) => parts.push(entryHtml(e, isApprovalOfMinutesItem(item))));
      }
    }
    const body = parts.filter(Boolean).join("\n");
    if (!body) return "";
    return `<div class="item"><div class="ititle">${idx + 1}. ${esc(item.title)}</div>${body}</div>`;
  };

  const sectionHtml = (sections || []).map(({ label, items }) => {
    const rendered = items.map((item, idx) => ({ html: itemHtml(item, idx), idx })).filter((r) => r.html);
    if (!rendered.length) return "";
    return `<div class="section"><h2>${esc(label)}</h2>${rendered.map((r) => r.html).join("\n")}</div>`;
  }).filter(Boolean).join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <title>${esc(meeting?.title || "Board Meeting")} — Minutes</title>
  <style>
    @page { size: letter portrait; margin: 0.75in; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 11pt; margin: 0; }
    .head { text-align: center; border-bottom: 3px solid #1e2f4d; padding-bottom: 14px; }
    .head img { height: 72px; }
    .head .org { font-size: 13pt; font-weight: bold; color: #1e2f4d; }
    .head h1 { margin: 4px 0 2px; font-size: 16pt; color: #1e2f4d; }
    .head .when { font-size: 10.5pt; color: #333; }
    .head .where { font-size: 10pt; color: #555; margin-top: 2px; }
    .roles { margin-top: 10px; font-size: 10pt; }
    .roles span { margin-right: 28px; }
    .roles .lbl { color: #666; }
    h2 { font-size: 10.5pt; text-transform: uppercase; letter-spacing: 0.05em; color: #1e2f4d; border-bottom: 1px solid #1e2f4d; padding-bottom: 3px; margin: 18px 0 8px; }
    p { margin: 4px 0; font-size: 10.5pt; }
    .item { margin: 12px 0; }
    .ititle { font-weight: bold; font-size: 11pt; color: #111; }
    .item > div > p, .item > div > div, .ibody { color: #c1121f; }
    .etype, .mhead span:first-child { display: block; font-size: 8pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.04em; }
    .mhead { display: flex; justify-content: space-between; align-items: baseline; }
    .mid { font-family: monospace; font-size: 9pt; font-weight: bold; }
    .motion { border: 1px solid #c9ccd2; border-radius: 4px; padding: 8px 10px; margin: 10px 0; color: #c1121f; }
    .motion .mgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 20px; margin-top: 6px; }
    .motion .mgrid div { font-size: 10pt; }
    .foot { margin-top: 28px; font-size: 8pt; color: #777; border-top: 1px solid #ddd; padding-top: 6px; text-align: center; }
  </style>
</head>
<body>
  <div class="head">
    <img src="${CANDORA_LOGO_URL}" alt="Candora" />
    <div class="org">${esc(org)}</div>
    <h1>${esc(meeting?.title || "Board Meeting")} — Minutes</h1>
    <div class="when">${esc(dateStr)}</div>
    ${meeting?.location ? `<div class="where">${esc(meeting.location)}</div>` : ""}
  </div>
  ${(has(recorder) || has(chair)) ? `<div class="roles">${has(recorder) ? `<span><span class="lbl">Minutes recorded by:</span> ${esc(recorder)}</span>` : ""}${has(chair) ? `<span><span class="lbl">Meeting Chair:</span> ${esc(chair)}</span>` : ""}</div>` : ""}
  ${(present.length + guests.length) ? `<h2>Attendance</h2><p>${esc([...present, ...guests].join(", "))}</p>` : ""}
  ${regrets.length ? `<h2>Regrets</h2><p>${esc(regrets.join(", "))}</p>` : ""}
  ${sectionHtml}
  ${has(data.additionalNotes) ? `<h2>Additional Notes</h2><p>${esc(data.additionalNotes)}</p>` : ""}
  <div class="foot">Generated ${format(new Date(), "MMMM d, yyyy")}</div>
</body>
</html>`;
}