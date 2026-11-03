import { format } from "date-fns";
import { parseDateSmart } from "@/lib/dateUtils";
import { base44 } from "@/api/base44Client";

// Friendly names for the document types a meeting card can hold. Any uploaded
// document is offered in the package, whatever its type.
const DOC_LABELS = {
  minutes: "minutes",
  financial_report: "financials",
  ed_report: "ED report",
  committee_report: "committee report",
  policy: "policy",
  bylaw: "bylaw",
  strategic_plan: "strategic plan",
  training: "training",
  corporate_doc: "corporate document",
  other: "document",
};

/**
 * Documents a meeting package can include — exactly what the meeting card shows:
 * the agenda built for this meeting, the last meeting's finalized minutes, and
 * the paperwork attached to this meeting itself (minutes, financials, ED report).
 * Each entry: { id, label, sub, available, checked, fileUrl }.
 */
export async function gatherPackageCandidates(meeting) {
  const meetingDate = parseDateSmart(meeting.meeting_date);
  const [meetingDocs, minutesDocs, meetings] = await Promise.all([
    base44.entities.BoardDocument.filter({ meeting_id: meeting.id }),
    base44.entities.BoardDocument.filter({ document_type: "minutes" }),
    base44.entities.Meeting.list(),
  ]);

  // Same rule as the meeting card: most recent earlier meeting with minutes
  const earlier = meetings
    .filter((m) => m.id !== meeting.id && parseDateSmart(m.meeting_date) < meetingDate)
    .sort((a, b) => parseDateSmart(b.meeting_date) - parseDateSmart(a.meeting_date));
  const prevMeeting = earlier.find((m) => minutesDocs.some((d) => d.meeting_id === m.id));
  const prevMinutesDoc = prevMeeting ? minutesDocs.find((d) => d.meeting_id === prevMeeting.id) : null;

  return [
    {
      id: "agenda",
      label: "Agenda",
      sub: meeting.title || "Board Meeting",
      available: true,
      checked: true,
      fileUrl: null,
    },
    {
      id: "prev_minutes",
      label: prevMinutesDoc ? `Minutes — ${prevMeeting.title}` : "Last meeting's minutes",
      sub: prevMinutesDoc ? format(parseDateSmart(prevMeeting.meeting_date), "MMM d, yyyy") : "No finalized minutes on a previous meeting",
      available: !!prevMinutesDoc,
      checked: !!prevMinutesDoc,
      fileUrl: prevMinutesDoc?.file_url || null,
    },
    // Every file uploaded to the meeting card, whatever its type. Only the
    // agenda is left out (it is generated as its own candidate) and packages
    // themselves, so a package never nests inside another.
    ...meetingDocs
      .filter((d) => d.file_url && d.document_type !== "agenda" && !(d.package_files || []).length)
      .filter((d, i, all) => all.findIndex((x) => x.file_url === d.file_url) === i)
      .map((d) => ({
        id: `doc-${d.id}`,
        label: d.title,
        sub: DOC_LABELS[d.document_type] || "document",
        available: true,
        checked: true,
        fileUrl: d.file_url,
      })),
  ];
}