import { jsPDF } from "jspdf";
import { format } from "date-fns";

export function generateBoardReportPdf(report, orgName) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 50;
  let y = margin;

  // ── Header ────────────────────────────────────────────
  doc.setFontSize(22);
  doc.setFont(undefined, "bold");
  doc.text(orgName || "Candora", margin, y);
  y += 12;

  doc.setFontSize(13);
  doc.setFont(undefined, "normal");
  doc.text("Monthly Board Report", margin, y);
  y += 8;

  const monthStr = report.report_month ? format(new Date(report.report_month), "MMMM yyyy") : "";
  doc.setFontSize(11);
  doc.setTextColor(120);
  doc.text(`${report.title}${monthStr ? " — " + monthStr : ""}`, margin, y);
  doc.setTextColor(0);
  y += 8;

  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;

  // ── Sections ──────────────────────────────────────────
  const sections = [...(report.sections || [])].sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
  );

  for (const section of sections) {
    // Page break before section if needed
    if (y > pageHeight - margin - 30) {
      doc.addPage();
      y = margin;
    }

    // Section title
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    const titleLines = doc.splitTextToSize(section.title || "", pageWidth - margin * 2);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 7 + 4;

    // Section content (strip HTML to plain text)
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    const plainText = (section.content || "")
      .replace(/<[^>]+>/g, "\n")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (plainText) {
      const paragraphs = plainText.split("\n");
      for (const para of paragraphs) {
        if (!para.trim()) { y += 3; continue; }
        const lines = doc.splitTextToSize(para, pageWidth - margin * 2);
        for (const line of lines) {
          if (y > pageHeight - 25) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin, y);
          y += 5.5;
        }
      }
    }
    y += 10;
  }

  // ── Footer (page numbers) ────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont(undefined, "normal");
    doc.setTextColor(150);
    doc.text(`${orgName || "Candora"} — Monthly Board Report`, margin, pageHeight - 20);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 20, { align: "right" });
    doc.setTextColor(0);
  }

  return doc;
}