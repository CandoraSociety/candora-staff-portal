import { format } from "date-fns";
import { parseDateSmart } from "@/lib/dateUtils";
import { ArrowLeft, Printer } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { CANDORA_LOGO_URL } from "@/components/board/agendaDocumentHtml";
import { NOTES_TYPES, isCallToOrderItem, isApprovalOfAgendaItem, isApprovalOfMinutesItem, isNextMeetingItem, isAdjournMotionItem, isInvitationItem, has, fmtTime } from "@/components/board/minutesShared";
import { buildFinalMinutesHtml } from "@/components/board/finalMinutesHtml";

// Red font for all filled-in entries on the final saved PDF
const RED = "text-[#c1121f]";
const SECTION_TITLE = "text-[11px] font-bold uppercase tracking-wider text-[#1e2f4d] border-b border-[#1e2f4d] pb-1 mb-3";

function FinalEntry({ entry, minimalMotion }) {
  const isMotion = entry.type === "motion";
  const isAction = entry.type === "action_item";
  const isNotes = [...NOTES_TYPES, "resolution"].includes(entry.type);

  if (isMotion) {
    const anyVotes = !minimalMotion && [entry.votes_in_favour, entry.votes_opposed, entry.votes_abstained].some(has);
    if (!has(entry.motion_verbiage) && !has(entry.moved_by) && !has(entry.seconded_by) && !has(entry.motion_result) && !anyVotes && !has(entry.content)) return null;
    return (
      <div className={`my-3 border border-slate-300 rounded-md p-3 ${RED}`}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-bold uppercase tracking-wide">Motion</span>
          {entry.motion_id && <span className="text-[10px] font-bold font-mono">{entry.motion_id}</span>}
        </div>
        {has(entry.motion_verbiage) && (
          <p className="text-sm mt-1.5"><span className="font-bold">Motion:</span> &ldquo;{entry.motion_verbiage}&rdquo;</p>
        )}
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 mt-2 text-sm">
          {has(entry.moved_by) && <div><span className="font-bold">Moved by:</span> {entry.moved_by}</div>}
          {has(entry.seconded_by) && <div><span className="font-bold">Seconded by:</span> {entry.seconded_by}</div>}
          {has(entry.motion_result) && <div><span className="font-bold">Result:</span> {entry.motion_result}</div>}
          {anyVotes && (
            <div><span className="font-bold">Vote:</span> In favour {has(entry.votes_in_favour) ? entry.votes_in_favour : 0} · Opposed {has(entry.votes_opposed) ? entry.votes_opposed : 0} · Abstained {has(entry.votes_abstained) ? entry.votes_abstained : 0}</div>
          )}
        </div>
        {has(entry.content) && <p className="text-sm mt-2"><span className="font-bold">Notes:</span> {entry.content}</p>}
      </div>
    );
  }

  if (isAction) {
    if (!has(entry.action_assigned_to) && !has(entry.action_due_date) && !has(entry.content)) return null;
    return (
      <div className={`my-2 ${RED}`}>
        <span className="text-[10px] font-bold uppercase tracking-wide block">Action Item</span>
        {(has(entry.action_assigned_to) || has(entry.action_due_date)) && (
          <p className="text-sm">Action assigned to {entry.action_assigned_to || "—"}{has(entry.action_due_date) ? ` · Due ${format(parseDateSmart(entry.action_due_date), "MMM d, yyyy")}` : ""}</p>
        )}
        {has(entry.content) && <p className="text-sm mt-0.5"><span className="font-bold">Notes:</span> {entry.content}</p>}
      </div>
    );
  }

  if (!isNotes || !has(entry.content)) return null;
  return (
    <div className={`my-2 ${RED}`}>
      <span className="text-[10px] font-bold uppercase tracking-wide block">{entry.type.replace(/_/g, " ")}</span>
      <p className="text-sm leading-snug"><span className="font-bold">Notes:</span> {entry.content}</p>
    </div>
  );
}

// Clean, flattened minutes document — only the filled-in information, entries in red,
// motions shown as labeled blocks with their auto-generated ID, in-camera entries excluded.
export default function MinutesFinalDoc({ meeting, org, sections, members, present, guests, recorder, chair, entries, data, canPersist = true, onBack }) {
  const regrets = (members || []).filter((m) => !present.includes(m.full_name)).map((m) => m.full_name);
  const dateStr = meeting?.meeting_date ? format(parseDateSmart(meeting.meeting_date), "MMMM d, yyyy 'at' h:mm a") : "";

  const itemContent = (item) => {
    const out = [];
    if (isInvitationItem(item)) return out;
    if (isCallToOrderItem(item)) {
      if (has(data.callTime)) out.push(<p key="t" className="text-sm">Called to order at {fmtTime(data.callTime)}.</p>);
      if (has(data.callNotes)) out.push(<p key="n" className="text-sm"><span className="font-bold">Notes:</span> {data.callNotes}</p>);
    } else if (isAdjournMotionItem(item)) {
      const bits = [];
      if (has(data.adjournBy)) bits.push(`Moved to adjourn by ${data.adjournBy}`);
      if (has(data.adjournTime)) bits.push(`Adjourned at ${fmtTime(data.adjournTime)}`);
      if (bits.length) out.push(<p key="a" className="text-sm">{bits.join(", ")}.</p>);
    } else if (isNextMeetingItem(item)) {
      if (has(data.nextDate)) out.push(<p key="d" className="text-sm">Next meeting: {format(parseDateSmart(data.nextDate), "MMMM d, yyyy")}.</p>);
      if (has(data.nextNotes)) out.push(<p key="n" className="text-sm"><span className="font-bold">Notes:</span> {data.nextNotes}</p>);
    } else if (isApprovalOfAgendaItem(item)) {
      if (data.agendaApproved) out.push(<p key="ap" className="text-sm">Agenda approved as presented.</p>);
    } else {
      (entries[item.id] || []).filter((e) => e.type !== "in_camera").forEach((e) => {
        out.push(<FinalEntry key={e.id} entry={e} minimalMotion={isApprovalOfMinutesItem(item)} />);
      });
    }
    return out.filter(Boolean);
  };

  const handlePrint = async () => {
    if (canPersist && meeting?.id) {
      const store = window.confirm("Store this version of the minutes in the Board Portal documents? (In-camera notes are kept out of this document and stored separately.)");
      if (store) {
        try {
          const html = buildFinalMinutesHtml({ meeting, org, sections, members, present, guests, recorder, chair, entries, data });
          const fileName = `${meeting?.title || "Board Meeting"} — Minutes.html`;
          const file = new File([html], fileName, { type: "text/html" });
          const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
          const existing = await base44.entities.BoardDocument.filter({ meeting_id: meeting.id, document_type: "minutes" });
          if (existing.length) {
            await base44.entities.BoardDocument.update(existing[0].id, { file_url, file_name: fileName, title: `${meeting.title || "Board Meeting"} — Minutes` });
          } else {
            await base44.entities.BoardDocument.create({
              title: `${meeting.title || "Board Meeting"} — Minutes`,
              document_type: "minutes",
              meeting_id: meeting.id,
              file_url,
              file_name: fileName,
              description: "Finalized board minutes",
            });
          }
          toast.success("Minutes stored in the Board Portal");
        } catch (err) {
          toast.error("Could not store the minutes in the portal", { description: err?.message || "Unknown error" });
        }
      }
    }
    window.print();
  };

  return (
    <div className="fillable-minutes-overlay fixed inset-0 z-[100] overflow-auto bg-slate-200">
      <div className="fillable-page max-w-[830px] mx-auto bg-white my-6 px-10 py-8 shadow-xl">
        <div className="no-print sticky top-0 z-10 flex items-center gap-3 -mx-4 px-4 py-2 bg-[#1e2f4d] rounded-lg text-white mb-4">
          <button type="button" onClick={handlePrint} className="flex items-center gap-1.5 bg-[#f5c116] text-[#1e2f4d] font-bold px-3 py-1.5 rounded-md text-sm">
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