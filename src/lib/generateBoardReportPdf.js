import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { parseDateSmart } from "@/lib/dateUtils";

// Candora brand — same logo and palette used on invoices and agendas
const CANDORA_LOGO_URL =
  "https://media.base44.com/images/public/6a249282cb496579542673b7/c6b242905_Candoracirclelogo_noanniversary.png";
const NAVY = [30, 47, 77];
const GOLD = [245, 190, 25];
const GRAY = [100, 100, 100];
const LIGHT = [214, 220, 229];
const MARGIN = 26; // ~1/3in side margins — content-forward

// Fetch the logo once and cache it (as a data URL for jsPDF); returns null if unavailable
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

// Convert section HTML (from the rich text editor) into plain-text lines,
// preserving paragraph breaks and turning list items into bullets.
function htmlToLines(html) {
  let t = html || "";
  t = t.replace(/<li[^>]*>/gi, "\n• ");
  t = t.replace(/<\/(p|li|div|h1|h2|h3|h4)>/gi, "\n");
  t = t.replace(/<br\s*\/?>/gi, "\n");
  t = t.replace(/<[^>]+>/g, "");
  t = t
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}

export async function generateBoardReportPdf(report, orgName, preparedBy) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;
  let y = MARGIN;

  const monthStr = report.report_month ? format(parseDateSmart(report.report_month), "MMMM yyyy") : "";
  const org = orgName || "Candora Society of Edmonton";

  // ── Compact navy letterhead band with gold rule ──────
  const BAND_H = 40;
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, BAND_H, "F");
  let nameX = 28;
  const logo = await getLogoDataUrl();
  if (logo) {
    try {
      doc.addImage(logo, "PNG", 28, 9, 22, 22);
      nameX = 28 + 31;
    } catch {
      nameX = 28;
    }
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, "bold");
  doc.setFontSize(12.5);
  doc.text(org, nameX, 19);
  doc.setFont(undefined, "normal");
  doc.setFontSize(7);
  doc.setTextColor(...GOLD);
  doc.text("MONTHLY BOARD REPORT", nameX, 27.5);
  if (preparedBy) {
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`Prepared by: ${preparedBy}`, pageWidth - 28, 24, { align: "right" });
  }
  doc.setFillColor(...GOLD);
  doc.rect(0, BAND_H, pageWidth, 2, "F");

  // ── Title + month ────────────────────────────────────
  y = BAND_H + 2 + 22;
  doc.setTextColor(...NAVY);
  doc.setFont(undefined, "bold");
  doc.setFontSize(15);
  doc.text(report.title || "Board Report", MARGIN, y);
  if (monthStr) {
    y += 9;
    doc.setFont(undefined, "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...GRAY);
    doc.text(monthStr, MARGIN, y);
  }
  y += 18;

  // ── Sections ─────────────────────────────────────────
  const sections = [...(report.sections || [])].sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
  );

  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - MARGIN - 20) {
      doc.addPage();
      y = MARGIN;
    }
  };

  for (const section of sections) {
    ensureSpace(30);

    // Section title — navy with gold underline accent
    doc.setTextColor(...NAVY);
    doc.setFont(undefined, "bold");
    doc.setFontSize(13);
    const titleLines = doc.splitTextToSize(section.title || "", contentWidth);
    for (const tl of titleLines) {
      ensureSpace(7.5);
      doc.text(tl, MARGIN, y);
      y += 7.5;
    }
    doc.setFillColor(...GOLD);
    doc.rect(MARGIN, y, 22, 1.8, "F");
    y += 8;

    // Section content
    const plain = htmlToLines(section.content);
    if (plain) {
      for (const para of plain.split("\n")) {
        if (!para.trim()) {
          y += 3.5;
          continue;
        }
        const isBullet = para.trimStart().startsWith("•");
        const body = isBullet ? para.trim().slice(1).trim() : para;
        const lines = doc.splitTextToSize(body, contentWidth - (isBullet ? 14 : 0));
        lines.forEach((line, i) => {
          ensureSpace(5.5);
          doc.setFont(undefined, "normal");
          doc.setFontSize(10);
          doc.setTextColor(35, 35, 35);
          if (isBullet) {
            if (i === 0) {
              doc.text("•", MARGIN + 2, y);
              doc.text(line, MARGIN + 10, y);
            } else {
              doc.text(line, MARGIN + 10, y);
            }
          } else {
            doc.text(line, MARGIN, y);
          }
          y += 5.5;
        });
        y += 2.5;
      }
    } else {
      y += 4;
    }
    y += 8;
  }

  // ── Footer (light rule + page numbers) ───────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...LIGHT);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, pageHeight - 24, pageWidth - MARGIN, pageHeight - 24);
    doc.setFontSize(8);
    doc.setFont(undefined, "normal");
    doc.setTextColor(...GRAY);
    doc.text(`${org} — Monthly Board Report`, MARGIN, pageHeight - 15);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - MARGIN, pageHeight - 15, { align: "right" });
  }

  return doc;
}