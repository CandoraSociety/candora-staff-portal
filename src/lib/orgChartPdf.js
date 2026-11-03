import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { layoutTieredPages, drawTieredPage } from "@/lib/orgChartPdfTiers";

// Candora palette — matches the board and agenda documents
const NAVY = [30, 47, 77];
const GOLD = [245, 190, 25];
const INK = [40, 48, 66];
const MUTED = [120, 126, 140];
const BORDER = [214, 220, 229];
const PALETTE = { navy: NAVY, gold: GOLD, ink: INK, muted: MUTED, border: BORDER };
const CANDORA_LOGO_URL =
  "https://media.base44.com/images/public/6a249282cb496579542673b7/c6b242905_Candoracirclelogo_noanniversary.png";

// Tabloid landscape, with full-card pagination rather than shrinking tiers.
const PAGE_W = 1224;
const PAGE_H = 792;
const MARGIN = 36;
const HEADER_H = 74;
const FOOTER_H = 40;
const TOP = HEADER_H + 30;

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

function drawHeader(doc, label, count) {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PAGE_W, HEADER_H, "F");

  let textX = MARGIN;
  const logo = doc.__candoraLogo;
  if (logo) {
    try {
      doc.addImage(logo, "PNG", MARGIN, 12, 50, 50);
      textX = MARGIN + 64;
    } catch {
      // logo is optional — the header still reads without it
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("Organizational Chart", textX, 34);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(200, 210, 228);
  doc.text("Candora Society of Edmonton", textX, 50);

  // Chart version label — the sheet name, e.g. "Oct 7"
  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(String(label || "Org Chart"), PAGE_W - MARGIN, 34, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(200, 210, 228);
  doc.text(
    `${count} position${count === 1 ? "" : "s"} · generated ${format(new Date(), "MMMM d, yyyy")}`,
    PAGE_W - MARGIN,
    50,
    { align: "right" }
  );
}

function drawFooter(doc, count, page, pageCount) {
  const y = PAGE_H - FOOTER_H + 8;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text("Inactive positions and practicum / skilled volunteer placements are excluded from this chart.", MARGIN, y + 14);
  doc.text(`${count} positions · Page ${page} of ${pageCount}`, PAGE_W - MARGIN, y + 14, { align: "right" });
}

/**
 * Exports named seniority tiers as card bands. Direct reporting is identified
 * explicitly on each card, so no connector can cross a card or another line.
 * Full rows move to the next page; inactive positions and placements stay out.
 */
export async function generateOrgChartPdf({ positions, label, showNames = true }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: [PAGE_W, PAGE_H] });
  doc.__candoraLogo = await getLogoDataUrl();
  const { pages, total } = layoutTieredPages(doc, positions, {
    showNames, margin: MARGIN, top: TOP, bottom: PAGE_H - FOOTER_H - 12,
  });
  pages.forEach((bands, index) => {
    if (index > 0) doc.addPage();
    drawHeader(doc, label, total);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("Tiered chart · Each card identifies its direct manager by position code and title. Advisory relationships are omitted.", MARGIN, HEADER_H + 17);
    drawTieredPage(doc, bands, { margin: MARGIN, palette: PALETTE });
    if (total === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(11);
      doc.text("No active positions on this chart.", MARGIN, TOP + 10);
    }
    drawFooter(doc, total, index + 1, pages.length);
  });
  const fileTag = String(label || "chart").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "chart";
  const fileName = `Candora-Org-Chart_${fileTag}.pdf`;
  doc.save(fileName);
  return fileName;
}