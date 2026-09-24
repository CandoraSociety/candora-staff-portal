import { format } from "date-fns";
import { parseDateSmart } from "@/lib/dateUtils";
import { ArrowLeft, Printer } from "lucide-react";
import { CANDORA_LOGO_URL } from "@/components/board/agendaDocumentHtml";

// Red font for all filled-in entries on the final saved PDF
const RED = "text-[#c1121f]";
const SECTION_TITLE = "text-[11px] font-bold uppercase tracking-wider text-[#1e2f4d] border-b border-[#1e2f4d] pb-1 mb-3";

const titleMatch = (item, frag) => (item?.title || "").toLowerCase().includes(frag);
const isCallToOrderItem = (i) => i?.item_type === "call_to_order" || titleMatch(i, "call to order");
const isApprovalOfAgendaItem = (i) => i?.item_type === "approval_of_agenda" || titleMatch(i, "approval of agenda");
const isApprovalOfMinutesItem = (i) => i?.item_type === "approval_of_minutes" || titleMatch(i, "approval of minutes");
const isNextMeetingItem = (i) => titleMatch(i, "date of next meeting");
const isAdjournMotionItem = (i) => titleMatch(i, "motion to adjourn");
const isInvitationItem = (i) => titleMatch(i, "invitation to visit");

const has = (v) => String(v ?? "").trim() !== "";

const fmtTime = (t) => {
  const m = String(t || "").match(/^(\d{1,2}):(\d{2})/);
  if (!m) return t || "";
  let h = Number(m[1]);
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m[2]} ${ap}`;
};

function FinalEntry({ entry, minimalMotion }) {
  const isMotion = ["motion", "resolution"].includes(entry.type);
  const lines = [];
  if (isMotion && has(entry.motion_verbiage)) lines.push(`"${entry.motion_verbiage}"`);
  const who = [];
  if (has(entry.moved_by)) who.push(`Moved by ${entry.moved_by}`);
  if (has(entry.seconded_by)) who.push(`Seconded by ${entry.seconded_by}`);
  if (who.length) lines.push(who.join(", ") + ".");
  if (isMotion && has(entry.motion_result)) lines.push(`Motion ${entry.motion_result.toLowerCase()}.`);
  if (!minimalMotion && [entry.votes_in_favour, entry.votes_opposed, entry.votes_abstained].some(has)) {
    lines.push(`In favour: ${has(entry.votes_in_favour) ? entry.votes_in_favour : 0} · Opposed: ${has(entry.votes_opposed) ? entry.votes_opposed : 0} · Abstained: ${has(entry.votes_abstained) ? entry.votes_abstained : 0}`);
  }
  if (entry.type === "action_item" && (has(entry.action_assigned_to) || has(entry.action_due_date))) {
    lines.push(`Action assigned to ${entry.action_assigned_to || "—"}${has(entry.action_due_date) ? ` · Due ${format(parseDateSmart(entry.action_due_date), "MMM d, yyyy")}` : ""}`);
  }
  if (entry.type === "in_camera") lines.push("Confidential — recorded in the separate In-Camera Minutes.");
  if (has(entry.content)) lines.push(entry.content);
  if (!lines.length) return null;
  return (
    <div className={`my-2 ${RED}`}>
      <span className="text-[10px] font-bold uppercase tracking-wide block">{entry.type.replace(/_/g, " ")}</span>
      {lines.map((l, i) => <p key={i} className="text-sm leading-snug">{l}</p>)}
    </div>
  );
}

// Clean, flattened minutes document — only the information that was filled in.
// Replaces the form when the user clicks "Generate Final PDF"; print shows just this page.
export default function MinutesFinalDoc({ meeting, org, sections, members, present, guests, recorder, chair, entries, data, onBack }) {
  const regrets = (members || []).filter((m) => !present.includes(m.full_name)).map((m) => m.full_name);
  const dateStr = meeting?.meeting_date ? format(parseDateSmart(meeting.meeting_date), "MMMM d, yyyy 'at' h:mm a") : "";

  const itemContent = (item) => {
    const out = [];
    if (isInvitationItem(item)) return out;
    if (isCallToOrderItem(item)) {
      if (has(data.callTime)) out.push(`Called to order at ${fmtTime(data.callTime)}.`);
      if (has(data.callNotes)) out.push(data.callNotes);
    } else if (isAdjournMotionItem(item)) {
      const parts = [];
      if (has(data.adjournBy)) parts.push(`Moved to adjourn by ${data.adjournBy}`);
      if (has(data.adjournTime)) parts.push(`Adjourned at ${fmtTime(data.adjournTime)}`);
      if (parts.length) out.push(parts.join(", ") + ".");
    } else if (isNextMeetingItem(item)) {
      if (has(data.nextDate)) out.push(`Next meeting: ${format(parseDateSmart(data.nextDate), "MMMM d, yyyy")}.`);
      if (has(data.nextNotes)) out.push(data.nextNotes);
    } else if (isApprovalOfAgendaItem(item)) {
      if (data.agendaApproved) out.push("Agenda approved as presented.");
    } else {
      (entries[item.id] || []).forEach((e) => {
        out.push(<FinalEntry key={e.id} entry={e} minimalMotion={isApprovalOfMinutesItem(item)} />);
      });
    }
    return out.filter(Boolean);
  };

  return (
    <div className="fillable-minutes-overlay fixed inset-0 z-[100] overflow-auto bg-slate-200">
      <div className="fillable-page max-w-[830px] mx-auto bg-white my-6 px-10 py-8 shadow-xl">
        <div className="no-print sticky top-0 z-10 flex items-center gap-3 -mx-4 px-4 py-2 bg-[#1e2f4d] rounded-lg text-white mb-4">
          <button type="button" onClick={() => window.print()} className="flex items-center gap-1.5 bg-[#f5c116] text-[#1e2f4d] font-bold px-3 py-1.5 rounded-md text-sm">
            <Printer size={14} /> Print / Save as PDF
          </button>
          <span className="text-xs text-slate-200">Final minutes — only the filled-in information is shown.</span>
          <button type="button" onClick={onBack} className="ml-auto flex items-center gap-1 text-sm text-slate-300 hover:text-white">
            <ArrowLeft size={14} /> Back to edit
          </button>
        </div>

        <div className="text-center border-b-[3px] border-[#1e2f4d] pb-3">
          <img src={CANDORA_LOGO_URL} alt="Candora" className="h-16 mx-auto" />
          <div className="font-bold text-[#1e2f4d] mt-1">{org}</div>
          <h1 className="text-xl font-bold text-[#1e2f4d] mt-1">{meeting?.title || "Board Meeting"} — Minutes</h1>
          <div className="text-sm text-slate-700">{dateStr}</div>
          {meeting?.location && <div className="text-xs text-slate-500">{meeting.location}</div>}
        </div>

        {(has(recorder) || has(chair)) && (
          <div className="flex flex-wrap gap-x-8 mt-3 text-sm">
            {has(recorder) && <span><span className="text-slate-500">Minutes recorded by: </span>{recorder}</span>}
            {has(chair) && <span><span className="text-slate-500">Meeting Chair: </span>{chair}</span>}
          </div>
        )}

        {(present.length + guests.length > 0) && (
          <div className="mt-5">
            <h2 className={SECTION_TITLE}>Attendance</h2>
            <p className="text-sm leading-relaxed">{[...present, ...guests].join(", ")}</p>
          </div>
        )}
        {regrets.length > 0 && (
          <div className="mt-4">
            <h2 className={SECTION_TITLE}>Regrets</h2>
            <p className="text-sm leading-relaxed">{regrets.join(", ")}</p>
          </div>
        )}

        {sections.map(({ key, label, items }) => {
          const rendered = items
            .map((item) => ({ item, content: itemContent(item) }))
            .filter(({ content }) => content.length > 0);
          if (rendered.length === 0) return null;
          return (
            <div key={key} className="mt-6">
              <h2 className={SECTION_TITLE}>{label}</h2>
              {rendered.map(({ item, content }, idx) => (
                <div key={item.id} className="my-3">
                  <div className="font-bold text-sm text-slate-900">
                    {idx + 1}. {item.title}
                    {item.is_in_camera && <span className="ml-2 text-amber-700 font-normal text-xs">(In Camera)</span>}
                  </div>
                  <div className={RED}>{content}</div>
                </div>
              ))}
            </div>
          );
        })}

        {has(data.additionalNotes) && (
          <div className="mt-6">
            <h2 className={SECTION_TITLE}>Additional Notes</h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.additionalNotes}</p>
          </div>
        )}
      </div>
    </div>
  );
}