import { format } from "date-fns";
import { parseDateSmart } from "@/lib/dateUtils";
import { base44 } from "@/api/base44Client";

/**
 * Documents that can go into a board meeting package: the agenda, the previous
 * meeting's finalized minutes, the latest financial report, the Executive
 * Director's exported report, and anything attached to this meeting.
 * Each entry: { id, label, sub, available, checked, fileUrl }.
 */
export async function gatherPackageCandidates(meeting) {
  const meetingDate = parseDateSmart(meeting.meeting_date);
  const [minutesDocs, finDocs, edReports, edDocs, meetingDocs, meetings] = await Promise.all([
    base44.entities.BoardDocument.filter({ document_type: "minutes" }),
    base44.entities.BoardDocument.filter({ document_type: "financial_report" }),
    base44.entities.EDBoardReport.list("-report_month", 50),
    base44.entities.BoardDocument.filter({ document_type: "ed_report" }),
    base44.entities.BoardDocument.filter({ meeting_id: meeting.id }),
    base44.entities.Meeting.list(),
  ]);

  // Most recent earlier meeting that has finalized minutes
  const earlier = meetings
    .filter((m) => m.id !== meeting.id && parseDateSmart(m.meeting_date) < meetingDate)
    .sort((a, b) => parseDateSmart(b.meeting_date) - parseDateSmart(a.meeting_date));
  const prevMeeting = earlier.find((m) => minutesDocs.some((d) => d.meeting_id === m.id));
  const prevMinutesDoc = prevMeeting ? minutesDocs.find((d) => d.meeting_id === prevMeeting.id) : null;

  // ED's exported PDF report — prefer the one for this meeting's month
  const monthKey = format(meetingDate, "yyyy-MM");
  const edReport =
    edReports.find((r) => r.pdf_url && String(r.report_month || "").startsWith(monthKey)) ||
    edReports.find((r) => r.pdf_url);
  const edDoc = [...edDocs].sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""))[0];

  const finDoc = [...finDocs].sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""))[0];

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
      label: prevMinutesDoc ? `Minutes — ${prevMeeting.title}` : "Previous meeting's minutes",
      sub: prevMinutesDoc ? format(parseDateSmart(prevMeeting.meeting_date), "MMM d, yyyy") : "No finalized minutes found for a previous meeting",
      available: !!prevMinutesDoc,
      checked: !!prevMinutesDoc,
      fileUrl: prevMinutesDoc?.file_url || null,
    },
    {
      id: "financials",
      label: finDoc ? `Financials — ${finDoc.title}` : "Financial report",
      sub: finDoc ? "Latest uploaded financial report" : "No financial report uploaded yet",
      available: !!finDoc,
      checked: !!finDoc,
      fileUrl: finDoc?.file_url || null,
    },
    {
      id: "ed_report",
      label: edReport
        ? `ED Report — ${edReport.title}`
        : edDoc
          ? `ED Report — ${edDoc.title}`
          : "Executive Director's report",
      sub: edReport || edDoc ? "Latest exported report" : "No ED report exported to PDF yet",
      available: !!(edReport?.pdf_url || edDoc?.file_url),
      checked: !!(edReport?.pdf_url || edDoc?.file_url),
      fileUrl: edReport?.pdf_url || edDoc?.file_url || null,
    },
    ...meetingDocs
      .filter((d) => d.file_url && d.document_type !== "minutes")
      .map((d) => ({
        id: `doc-${d.id}`,
        label: d.title,
        sub: d.document_type.replace(/_/g, " "),
        available: true,
        checked: true,
        fileUrl: d.file_url,
      })),
  ];
}