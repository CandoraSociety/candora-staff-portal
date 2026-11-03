import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { parseDateSmart } from "@/lib/dateUtils";
import { AGENDA_SECTIONS, sectionOf, CANDORA_LOGO_URL } from "@/components/board/agendaDocumentHtml";

const NAVY = [30, 47, 77];
const INK = [17, 17, 17];
const MUTED = [85, 85, 85];
const RULE = [227, 230, 234];

// Logo as a data URL so jsPDF can place it; cached for the session
let logoPromise = null;
function getLogoDataUrl() {
  if (!logoPromise) {
    logoPromise = fetch(CANDORA_LOGO_URL)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error("logo unavailable"))))
      .then(
        (blob) =>
          new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result);
            fr.onerror = reject;
            fr.readAsDataURL(blob);
          })
      )
      .catch(() => null);
  }
  return logoPromise;
}

/**
 * Builds the board agenda PDF in the same document format as "Save / Print
 * Agenda" — centred logo and meeting heading, underlined section headings, then
 * numbered items with presenter and notes (no time allocations). Agenda items only:
 * nothing else is ever added to this document.
 */
export async function buildAgendaPdf({ meeting, items }) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 54;
  const contentW = pageW - M * 2;
  const bottom = pageH - M;
  let y = M;

  const newPage = () => {
    doc.addPage();
    y = M;
  };

  const sorted = [...(items || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  // ── Meeting heading ──
  const logo = await getLogoDataUrl();
  if (logo) {
    try {
      const props = doc.getImageProperties(logo);
      const h = 54;
      const w = (props.width / props.height) * h;
      doc.addImage(logo, "PNG", (pageW - w) / 2, y, w, h);
      y += h + 10;
    } catch {
      y += 4;
    }
  }

  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Candora Society of Edmonton", pageW / 2, y, { align: "center" });
  y += 18;

  doc.setFontSize(16);
  const heading = `${meeting?.title || "Board Meeting"} \u2014 Agenda`;
  doc.splitTextToSize(heading, contentW).forEach((line) => {
    doc.text(line, pageW / 2, y, { align: "center" });
    y += 19;
  });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 51, 51);
  doc.setFontSize(10.5);
  if (meeting?.meeting_date) {
    doc.text(format(parseDateSmart(meeting.meeting_date), "MMMM d, yyyy 'at' h:mm a"), pageW / 2, y, { align: "center" });
    y += 14;
  }
  if (meeting?.location) {
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(meeting.location, pageW / 2, y, { align: "center" });
    y += 13;
  }

  y += 6;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(1.6);
  doc.line(M, y, pageW - M, y);
  y += 22;

  // ── Sections ──
  const numW = 20;
  const titleW = contentW - numW;

  AGENDA_SECTIONS.filter(({ key }) => sorted.some((i) => sectionOf(i) === key)).forEach(({ key, label }) => {
    // keep a section heading with at least one row
    if (y + 46 > bottom) newPage();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...NAVY);
    doc.text(label.toUpperCase(), M, y);
    y += 4;
    doc.setDrawColor(...NAVY);
    doc.setLineWidth(0.8);
    doc.line(M, y, pageW - M, y);
    y += 14;

    sorted
      .filter((i) => sectionOf(i) === key)
      .forEach((item, idx) => {
        const titleLines = doc.splitTextToSize(item.title || "", titleW);
        const notesLines = item.description ? doc.splitTextToSize(item.description, titleW) : [];
        const rowH =
          titleLines.length * 12 +
          (item.presenter ? 11 : 0) +
          notesLines.length * 11 +
          10;

        if (y + rowH > bottom) newPage();

        // number
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.5);
        doc.setTextColor(...MUTED);
        doc.text(`${idx + 1}.`, M, y);

        // title (+ in-camera marker)
        let ty = y;
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...INK);
        const lastLine = titleLines.pop() || "";
        titleLines.forEach((line) => {
          doc.text(line, M + numW, ty);
          ty += 12;
        });
        doc.text(lastLine, M + numW, ty);
        let lastWidth = doc.getTextWidth(lastLine);
        if (item.is_in_camera) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);
          doc.setTextColor(180, 83, 9);
          doc.text("(In Camera)", M + numW + lastWidth + 5, ty);
          doc.setFontSize(10.5);
        }
        ty += 13;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...INK);
        if (item.presenter) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(9.5);
          doc.setTextColor(68, 68, 68);
          doc.text(item.presenter, M + numW, ty);
          ty += 11;
        }
        if (notesLines.length) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(51, 51, 51);
          notesLines.forEach((line) => {
            doc.text(line, M + numW, ty);
            ty += 11;
          });
        }

        y = ty + 2;
        doc.setDrawColor(...RULE);
        doc.setLineWidth(0.6);
        doc.line(M, y, pageW - M, y);
        y += 9;
      });

    y += 6;
  });

  // ── Footer ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(119, 119, 119);
    doc.text(`Generated ${format(new Date(), "MMMM d, yyyy")}`, pageW / 2, pageH - 30, { align: "center" });
  }

  return doc;
}