import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { layoutTieredChart, drawTieredChart } from "@/lib/orgChartPdfTiers";

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
const TOP = HEADER_H + 22;

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

function drawFooter(doc, count) {
  const y = PAGE_H - FOOTER_H + 8;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text("Inactive positions and placements excluded. Each card names its direct manager; advisory relationships omitted.", MARGIN, y + 14);
  doc.text(`${count} position${count === 1 ? "" : "s"} shown`, PAGE_W - MARGIN, y + 14, { align: "right" });
}

/**
 * Exports named seniority tiers as card bands on a single page. Rows are
 * left-aligned, and the layout scales down just enough for every active
 * position to fit on that one page. Direct reporting is identified explicitly
 * on each card, so no connector can cross a card or another line.
 */
export async function generateOrgChartPdf({ positions, label, showNames = true }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: [PAGE_W, PAGE_H] });
  doc.__candoraLogo = await getLogoDataUrl();
  const layout = layoutTieredChart(doc, positions, {
    showNames, margin: MARGIN, pageWidth: PAGE_W, top: TOP, bottom: PAGE_H - FOOTER_H - 12,
  });
  drawHeader(doc, label, layout.total);
  doc.setFont("helvetica", "normal");
  drawTieredChart(doc, layout, { margin: MARGIN, palette: PALETTE });
  if (layout.total === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    doc.text("No active positions on this chart.", MARGIN, TOP + 10);
  }
  drawFooter(doc, layout.total);
  const fileTag = String(label || "chart").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "chart";
  const fileName = `Candora-Org-Chart_${fileTag}.pdf`;
  doc.save(fileName);
  return fileName;
}