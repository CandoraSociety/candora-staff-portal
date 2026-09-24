// Shared helpers for the minutes components — fillable form, final document and stored HTML builder
export const NOTES_TYPES = ["note", "discussion", "information", "dissent", "abstention"];

export const titleMatch = (item, frag) => (item?.title || "").toLowerCase().includes(frag);
export const isCallToOrderItem = (i) => i?.item_type === "call_to_order" || titleMatch(i, "call to order");
export const isApprovalOfAgendaItem = (i) => i?.item_type === "approval_of_agenda" || titleMatch(i, "approval of agenda");
export const isApprovalOfMinutesItem = (i) => i?.item_type === "approval_of_minutes" || titleMatch(i, "approval of minutes");
export const isNextMeetingItem = (i) => titleMatch(i, "date of next meeting");
export const isAdjournMotionItem = (i) => titleMatch(i, "motion to adjourn");
export const isInvitationItem = (i) => titleMatch(i, "invitation to visit");

export const has = (v) => String(v ?? "").trim() !== "";

// 24h "HH:MM" → readable "h:MM AM/PM"
export const fmtTime = (t) => {
  const m = String(t || "").match(/^(\d{1,2}):(\d{2})/);
  if (!m) return t || "";
  let h = Number(m[1]);
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m[2]} ${ap}`;
};