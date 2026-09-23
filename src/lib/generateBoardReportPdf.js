import { jsPDF } from "jspdf";
import { format } from "date-fns";

// Candora brand — same logo and palette used on invoices and agendas
const CANDORA_LOGO_URL =
  "https://media.base44.com/images/public/6a249282cb496579542673b7/c6b242905_Candoracirclelogo_noanniversary.png";
const NAVY = [30, 47, 77];
const GOLD = [245, 190, 25];
const GRAY = [100, 100, 100];
const LIGHT = [214, 220, 229];
const MARGIN = 36; // ~0.5in — content-first, no huge margins

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

function fitText(doc, text, maxWidth, startSize, minSize = 8) {
  let size = startSize;
  doc.setFontSize(size);
  while (size > minSize && doc.getTextWidth(text) > maxWidth) {
    size -= 0.5;
    doc.setFontSize(size);
  }
}

export async function generateBoardReportPdf(report, orgName) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;
  let y = MARGIN;

  const monthStr = report.report_month ? format(new Date(report.report_month), "MMMM yyyy") : "";
  const org = orgName || "Candora Society of Edmonton";

  // ── Letterhead ────────────────────────────────────────
  let textX = MARGIN;
  const logo = await getLogoDataUrl();
  if (logo) {
    try {
      doc.addImage(logo, "PNG", MARGIN, MARGIN - 4, 44, 44);
      textX = MARGIN + 54;
    } catch {
      textX = MARGIN;
    }
  }
  doc.setTextColor(...NAVY);
  doc.setFont(undefined, "bold");
  doc.setFontSize(19);
  doc.text(org, textX, MARGIN + 12);
  doc.setFont(undefined, "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...GRAY);
  doc.text("Monthly Board Report", textX, MARGIN + 22);

  y = MARGIN + 32;

  // ── Navy title band with gold rule ───────────────────
  doc.setFillColor(...NAVY);
  doc.rect(0, y, pageWidth, 26, "F");
  doc.setTextColor(255, 255, 255);
  const monthLabel = monthStr || "";
  const monthW = monthLabel ? doc.getTextWidth(monthLabel) + 4 : 0;
  doc.setFont(undefined, "bold");
  fitText(doc, report.title || "Board Report", contentWidth - monthW - 10, 11);
  doc.text(report.title || "Board Report", MARGIN, y + 16.5);
  if (monthLabel) {
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(monthLabel, pageWidth - MARGIN, y + 16.5, { align: "right" });
  }
  doc.setFillColor(...GOLD);
  doc.rect(0, y + 26, pageWidth, 2.5, "F");
  y += 28.5 + 16;

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