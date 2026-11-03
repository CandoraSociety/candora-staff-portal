import { jsPDF } from "jspdf";
import { format } from "date-fns";

// Candora palette — matches the board and agenda documents
const NAVY = [30, 47, 77];
const GOLD = [245, 190, 25];
const INK = [40, 48, 66];
const MUTED = [120, 126, 140];
const BORDER = [214, 220, 229];
const BAND = [248, 250, 252];
const CANDORA_LOGO_URL =
  "https://media.base44.com/images/public/6a249282cb496579542673b7/c6b242905_Candoracirclelogo_noanniversary.png";

const TIER_ORDER = [
  "executive", "director", "senior_manager", "manager", "supervisor_team_lead",
  "specialist", "frontline", "assistant", "practicum_placement", "skilled_volunteer", "__none__",
];
const TIER_LABELS = {
  executive: "Executive", director: "Director", senior_manager: "Senior Manager",
  manager: "Manager", supervisor_team_lead: "Supervisor / Team Lead", specialist: "Specialist",
  frontline: "Frontline", assistant: "Assistant", practicum_placement: "Practicum / Volunteer",
  skilled_volunteer: "Practicum / Volunteer", __none__: "Unassigned",
};

// Tabloid landscape: one readable page for a full org chart
const PAGE_W = 1224;
const PAGE_H = 792;
const MARGIN = 36;
const HEADER_H = 74;
const LABEL_W = 96;
const CARD_W = 150;
const CARD_H = 58;
const COL_GAP = 12;
const ROW_GAP = 12;
const FOOTER_H = 40;

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

const bandKey = (p) => p.row_number ?? ((p.tier === "skilled_volunteer" ? "practicum_placement" : p.tier) || "__none__");

// Positions grouped into the chart's tiers, top level first — inactive ones never appear
function groupIntoBands(positions) {
  const active = (positions || []).filter((p) => !p.is_inactive);
  const bands = new Map();
  active.forEach((p) => {
    const key = bandKey(p);
    if (!bands.has(key)) bands.set(key, []);
    bands.get(key).push(p);
  });
  const rank = (key) => (typeof key === "number" ? key : TIER_ORDER.indexOf(key) === -1 ? 99 : TIER_ORDER.indexOf(key));
  return [...bands.entries()]
    .sort((a, b) => {
      if (typeof a[0] === "number" && typeof b[0] === "number") return a[0] - b[0];
      if (typeof a[0] === "number") return -1;
      if (typeof b[0] === "number") return 1;
      return rank(a[0]) - rank(b[0]);
    })
    .map(([key, people]) => ({
      key,
      label: typeof key === "number" ? `Tier ${key}` : TIER_LABELS[key] || "Unassigned",
      people,
    }));
}

const bandLabel = (key) => (typeof key === "number" ? `Tier ${key}` : (TIER_LABELS[key] || "Unassigned"));

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
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.2);

  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  const labelText = String(label || "Org Chart");
  doc.text(labelText, PAGE_W - MARGIN, 34, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(200, 210, 228);
  doc.text(`${count} position${count === 1 ? "" : "s"} · generated ${format(new Date(), "MMMM d, yyyy")}`, PAGE_W - MARGIN, 50, { align: "right" });
}

function drawFooter(doc, count) {
  const y = PAGE_H - FOOTER_H + 8;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text("Inactive positions are excluded from this chart.", MARGIN, y + 14);
  doc.text(`${count} position${count === 1 ? "" : "s"} shown`, PAGE_W - MARGIN, y + 14, { align: "right" });
}

function drawCard(doc, x, y, position, showNames) {
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.8);
  if (position.is_vacant) doc.setLineDashPattern([3, 2], 0);
  doc.roundedRect(x, y, CARD_W, CARD_H, 4, 4, "FD");
  doc.setLineDashPattern([], 0);

  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  const titleLines = doc.splitTextToSize(position.title || "Untitled position", CARD_W - 16).slice(0, 2);
  let textY = y + 15;
  titleLines.forEach((line) => {
    doc.text(line, x + CARD_W / 2, textY, { align: "center" });
    textY += 9.5;
  });

  if (showNames && position.person_name) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...INK);
    doc.text(doc.splitTextToSize(position.person_name, CARD_W - 16)[0], x + CARD_W / 2, textY + 1, { align: "center" });
    textY += 9.5;
  }

  const dept = (position.departments && position.departments.length > 0 ? position.departments[0] : position.department) ||
    (position.is_vacant ? "Vacant" : "");
  if (dept) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.5);
    doc.setTextColor(...MUTED);
    doc.text(doc.splitTextToSize(dept, CARD_W - 16)[0], x + CARD_W / 2, textY + 1, { align: "center" });
  }
}

/**
 * Builds a clean, printable org chart PDF for one chart version — every active
 * position laid out tier by tier, inactive positions left out entirely.
 * Returns the saved file name.
 */
export async function generateOrgChartPdf({ positions, label, showNames = true }) {
  const bands = groupIntoBands(positions);
  const total = bands.reduce((sum, b) => sum + b.people.length, 0);

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: [PAGE_W, PAGE_H] });
  doc.__candoraLogo = await getLogoDataUrl();

  const cardsPerRow = Math.max(1, Math.floor((PAGE_W - MARGIN * 2 - LABEL_W) / (CARD_W + COL_GAP)));
  const contentBottom = PAGE_H - FOOTER_H;

  let page = 1;
  drawHeader(doc, label, total);
  let y = HEADER_H + 26;

  const newPage = () => {
    drawFooter(doc, total);
    doc.addPage([PAGE_W, PAGE_H], "landscape");
    page += 1;
    drawHeader(doc, `${label} (continued)`, total);
    y = HEADER_H + 26;
  };

  bands.forEach((band) => {
    const rows = Math.ceil(band.people.length / cardsPerRow);
    const blockH = rows * (CARD_H + ROW_GAP) - ROW_GAP;

    if (y + blockH > contentBottom) newPage();

    // Tier gutter label
    const labelY = y + Math.min(blockH / 2, 26);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...NAVY);
    doc.text(band.label.toUpperCase(), MARGIN, labelY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(`${band.people.length}`, MARGIN, labelY + 10);

    band.people.forEach((position, index) => {
      const col = index % cardsPerRow;
      const row = Math.floor(index / cardsPerRow);
      const cx = MARGIN + LABEL_W + col * (CARD_W + COL_GAP);
      const cy = y + row * (CARD_H + ROW_GAP);
      drawCard(doc, cx, cy, position, showNames);
    });

    y += blockH + 22;
  });

  if (total === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    doc.setTextColor(...MUTED);
    doc.text("No active positions on this chart.", MARGIN, y);
  }

  drawFooter(doc, total);

  const fileName = `Candora-Org-Chart_${String(label || "chart").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}.pdf`;
  doc.save(fileName);
  return fileName;
}