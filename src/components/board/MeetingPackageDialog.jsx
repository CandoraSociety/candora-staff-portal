import { useEffect, useState } from "react";
import { format } from "date-fns";
import { parseDateSmart } from "@/lib/dateUtils";
import { toast } from "sonner";
import { CheckCircle2, Package, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { buildPackageBasePdf } from "@/components/board/meetingPackagePdf";
import { buildMeetingPackageZip } from "@/components/board/meetingPackageZip";

const isPdfUrl = (url) => /\.pdf($|\?)/i.test(String(url || ""));

/**
 * "Create Meeting Package" — gathers the previous meeting's finalized minutes,
 * the latest financial report, the Executive Director's exported report, and
 * any documents attached to this meeting, then compiles everything with the
 * agenda into a single PDF saved to the Board Documents library.
 */
export default function MeetingPackageDialog({ meeting, items, onClose }) {
  const [parts, setParts] = useState(null); // null = still gathering
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
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

        const next = [
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
        if (!cancelled) setParts(next);
      } catch (err) {
        if (!cancelled) {
          toast.error("Could not gather the meeting documents", { description: err?.message || "Unknown error" });
          onClose();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [meeting.id]);

  const toggle = (id) =>
    setParts((prev) => prev.map((p) => (p.id === id && p.available ? { ...p, checked: !p.checked } : p)));

  const handleGenerate = async () => {
    const selected = (parts || []).filter((p) => p.checked && p.available);
    if (selected.length === 0) return;
    setGenerating(true);
    try {
      const agendaPart = selected.find((p) => p.id === "agenda");
      const minutesPart = selected.find((p) => p.id === "prev_minutes");
      let minutes = null;
      const files = [];
      if (minutesPart) {
        if (isPdfUrl(minutesPart.fileUrl)) {
          files.push({ label: `Minutes - ${minutesPart.sub}`, fileUrl: minutesPart.fileUrl });
        } else {
          try {
            const res = await fetch(minutesPart.fileUrl);
            if (!res.ok) throw new Error("not readable");
            minutes = { label: minutesPart.sub, html: await res.text() };
          } catch {
            toast.error("The previous meeting's minutes couldn't be read — the package was created without them.");
          }
        }
      }
      selected
        .filter((p) => p.id !== "agenda" && p.id !== "prev_minutes")
        .forEach((p) => files.push({ label: p.label, fileUrl: p.fileUrl }));

      const basePdf = await buildPackageBasePdf({
        meeting,
        contents: selected.map((p) => p.label),
        agendaItems: agendaPart ? items : null,
        minutes,
      });

      // The agenda (plus any HTML minutes) is the one generated PDF; every other
      // document is bundled untouched, so a zip keeps Word and Excel files intact.
      const baseBytes = basePdf.output("arraybuffer");
      const basePdfName = minutes ? "Agenda & Minutes" : "Agenda";
      const { blob, skipped, included } = await buildMeetingPackageZip({
        basePdfBuffer: baseBytes,
        basePdfName,
        files,
      });
      if (skipped.length > 0) {
        toast.warning(`${skipped.length} document${skipped.length === 1 ? "" : "s"} couldn't be added to the package.`, {
          description: skipped.join(", "),
        });
      }

      const dateTag = format(parseDateSmart(meeting.meeting_date), "MMM-d-yyyy");
      // The generated agenda PDF is also kept on its own, so the meeting card can
      // link to it directly instead of forcing a download of the whole zip.
      const agendaFileName = `Candora-${basePdfName.replace(" & ", "-and-")}_${dateTag}.pdf`;
      const agendaUpload = await base44.integrations.Core.UploadPublicFile({
        file: new File([baseBytes], agendaFileName, { type: "application/pdf" }),
      });

      const fileName = `Candora-Meeting-Package_${dateTag}.zip`;
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file: new File([blob], fileName, { type: "application/zip" }) });
      await base44.entities.BoardDocument.create({
        title: `${meeting.title || "Board Meeting"} — Meeting Package`,
        document_type: "corporate_doc",
        meeting_id: meeting.id,
        file_url,
        file_name: fileName,
        description: "Board meeting package zip — agenda plus the attached board documents (minutes, financials, reports)",
        package_files: [
          { label: basePdfName, file_name: agendaFileName, file_url: agendaUpload.file_url },
          ...included,
        ],
      });
      setResultUrl(file_url);
    } catch (err) {
      toast.error("Could not create the meeting package", { description: err?.message || "Unknown error" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-auto bg-black/40 flex items-start sm:items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl max-w-lg w-full p-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="w-9 h-9 rounded-lg bg-[#1e2f4d] text-white flex items-center justify-center"><Package size={18} /></span>
          <div className="flex-1">
            <h2 className="font-heading text-lg font-semibold">Meeting Package</h2>
            <p className="text-xs text-muted-foreground">{meeting?.title || "Board Meeting"}</p>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        {resultUrl ? (
          <div className="mt-5">
            <div className="flex items-start gap-3 bg-muted/60 border border-border rounded-lg p-4">
              <CheckCircle2 size={20} className="text-success mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Package created.</p>
                <p className="text-xs text-muted-foreground mt-0.5">It's a zip file saved in the Board Portal's Documents library under Corporate Docs — unzip it to find the agenda and each document as its own file.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={onClose} className="flex-1 border border-border rounded-lg py-2 text-sm hover:bg-muted transition">Done</button>
              <button type="button" onClick={() => window.open(resultUrl, "_blank")} className="flex-1 bg-[#1e2f4d] text-white rounded-lg py-2 text-sm font-medium hover:opacity-90 transition">Open Package</button>
            </div>
          </div>
        ) : parts === null ? (
          <div className="flex items-center gap-3 py-8 justify-center">
            <span className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Gathering meeting documents…</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mt-3">Everything below is bundled into one zip file — each document stays in its own format. Uncheck anything you don't want included.</p>
            <div className="mt-4 space-y-1.5 max-h-[46vh] overflow-auto pr-1">
              {parts.map((p) => (
                <label key={p.id} className={`flex items-start gap-3 border border-border rounded-lg px-3 py-2.5 ${p.available ? "cursor-pointer hover:bg-muted/50" : "opacity-60"}`}>
                  <input
                    type="checkbox"
                    checked={p.checked}
                    disabled={!p.available}
                    onChange={() => toggle(p.id)}
                    className="mt-0.5 w-4 h-4"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium truncate">{p.label}</span>
                    <span className="block text-xs text-muted-foreground">{p.sub}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={onClose} className="flex-1 border border-border rounded-lg py-2 text-sm hover:bg-muted transition">Cancel</button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || !parts.some((p) => p.checked && p.available)}
                className="flex-1 bg-[#1e2f4d] text-white rounded-lg py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {generating && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {generating ? "Creating…" : "Create Package"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}