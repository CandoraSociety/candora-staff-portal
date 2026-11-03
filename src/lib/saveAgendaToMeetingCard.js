import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { parseDateSmart } from "@/lib/dateUtils";
import { buildAgendaPdf } from "@/components/board/agendaPdf";

/**
 * Builds the meeting agenda as a PDF and files it on the meeting card as the
 * meeting's agenda document. Running it again refreshes that same document
 * instead of piling up copies.
 */
export async function saveAgendaToMeetingCard({ meeting, items }) {
  const pdf = await buildAgendaPdf({ meeting, items });

  const dateTag = format(parseDateSmart(meeting.meeting_date), "MMM-d-yyyy");
  const fileName = `Candora-Board-Agenda_${dateTag}.pdf`;
  const { file_url } = await base44.integrations.Core.UploadPublicFile({
    file: new File([pdf.output("blob")], fileName, { type: "application/pdf" }),
  });

  const me = await base44.auth.me().catch(() => null);
  const data = {
    title: `Agenda — ${meeting.title || "Board Meeting"}`,
    document_type: "agenda",
    meeting_id: meeting.id,
    file_url,
    file_name: fileName,
    description: `Generated from the agenda builder on ${format(new Date(), "MMMM d, yyyy")}`,
    uploaded_by: me?.full_name || me?.email || "",
    is_public_to_board: true,
  };

  const existing = await base44.entities.BoardDocument.filter({
    meeting_id: meeting.id,
    document_type: "agenda",
  });
  if (existing[0]) return await base44.entities.BoardDocument.update(existing[0].id, data);
  return await base44.entities.BoardDocument.create(data);
}