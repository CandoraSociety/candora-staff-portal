import { jsPDF } from "jspdf";
import { format } from "date-fns";

// Candora palette — matches the board and agenda documents
const NAVY = [30, 47, 77];
const GOLD = [245, 190, 25];
const INK = [40, 48, 66];
const MUTED = [120, 126, 140];
const BORDER = [214, 220, 229];
const LINE = [184, 194, 209];
const CANDORA_LOGO_URL =
  "https://media.base44.com/images/public/6a249282cb496579542673b7/c6b242905_Candoracirclelogo_noanniversary.png";

const TIER_ORDER = [
  "executive", "director", "senior_manager", "manager", "supervisor_team_lead",
  "specialist", "frontline", "assistant", "__none__",
];
const TIER_LABELS = {
  executive: "Executive", director: "Director", senior_manager: "Senior Manager",
  manager: "Manager", supervisor_team_lead: "Supervisor / Team Lead", specialist: "Specialist",
  frontline: "Frontline", assistant: "Assistant", __none__: "Unassigned",
};
// Placements are never part of the board's org chart
const EXCLUDED_TIERS = new Set(["practicum_placement", "skilled_volunteer"]);

// Tabloid landscape
const PAGE_W = 1224;
const PAGE_H = 792;
const MARGIN = 36;
const HEADER_H = 74;
const LABEL_W = 96;
const CHART_W = PAGE_W - MARGIN * 2 - LABEL_W;
const CARD_H = 58;
const CARD_GAP = 10;
const BAND_GAP = 46;
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

const bandKey = (p) => p.row_number ?? ((p.tier === "skilled_volunteer" ? "practicum_placement" : p.tier) || "__none__");

// Positions grouped into the chart's tiers, top level first — inactive positions
// and practicum / skilled volunteer placements never appear
function groupIntoBands(positions) {
  const included = (positions || []).filter((p) => !p.is_inactive && !EXCLUDED_TIERS.has(p.tier));
  const bands = new Map();
  included.forEach((p) => {
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

// One row per tier: cards sit left to right under their manager so the reporting
// lines stay straight and short. Narrower cards where a tier has many positions.
function layoutBands(bands) {
  const centerById = new Map();
  return bands.map((band) => {
    const n = band.people.length;
    const cardW = Math.min(150, (CHART_W - (n - 1) * CARD_GAP) / n);

    const indexed = band.people.map((p, i) => ({ p, i }));
    indexed.sort((a, b) => {
      const ax = centerById.get(a.p.reports_to_id);
      const bx = centerById.get(b.p.reports_to_id);
      if (ax == null && bx == null) return a.i - b.i;
      if (ax == null) return 1;
      if (bx == null) return -1;
      return ax - bx || a.i - b.i;
    });

    const totalW = n * cardW + (n - 1) * CARD_GAP;
    const startX = MARGIN + LABEL_W + (CHART_W - totalW) / 2;
    const cards = indexed.map(({ p }, i) => ({
      p,
      w: cardW,
      x: startX + i * (cardW + CARD_GAP),
    }));
    cards.forEach((c) => centerById.set(c.p.id, c.x + c.w / 2));
    return { ...band, cardW, cards };
  });
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
  doc.text("Inactive positions and practicum / skilled volunteer placements are excluded from this chart.", MARGIN, y + 14);
  doc.text(`${count} position${count === 1 ? "" : "s"} shown`, PAGE_W - MARGIN, y + 14, { align: "right" });
}

function drawCard(doc, card, showNames) {
  const { p, x, w, y } = card;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.8);
  if (p.is_vacant) doc.setLineDashPattern([3, 2], 0);
  doc.roundedRect(x, y, w, CARD_H, 4, 4, "FD");
  doc.setLineDashPattern([], 0);

  const inner = w - 13;
  const titleSize = w < 110 ? 7.2 : 8;
  const maxTitleLines = w < 110 ? 3 : 2;

  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(titleSize);
  const titleLines = doc.splitTextToSize(p.title || "Untitled position", inner).slice(0, maxTitleLines);
  const lineH = titleSize + 1.6;
  let textY = y + 14;
  titleLines.forEach((line) => {
    doc.text(line, x + w / 2, textY, { align: "center" });
    textY += lineH;
  });

  if (showNames && p.person_name) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(...INK);
    doc.text(doc.splitTextToSize(p.person_name, inner)[0], x + w / 2, textY + 0.5, { align: "center" });
    textY += 9;
  }

  const dept =
    (p.departments && p.departments.length > 0 ? p.departments[0] : p.department) || (p.is_vacant ? "Vacant" : "");
  if (dept) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.4);
    doc.setTextColor(...MUTED);
    doc.text(doc.splitTextToSize(dept, inner)[0], x + w / 2, textY + 0.5, { align: "center" });
  }
}

// Solid reporting lines: down out of the manager, across the gap, then into each report
function drawReportingLines(doc, cards, cardsById) {
  const groups = new Map();
  cards.forEach((card) => {
    const parent = cardsById.get(card.p.reports_to_id);
    if (!parent) return;
    if (!groups.has(parent.p.id)) groups.set(parent.p.id, { parent, cards: [] });
    groups.get(parent.p.id).cards.push(card);
  });

  let i = 0;
  groups.forEach(({ parent, cards: reports }) => {
    const parentBottom = parent.y + CARD_H;
    const childTop = Math.min(...reports.map((c) => c.y));
    const span = Math.max(childTop - parentBottom, 14);
    const busY = parentBottom + Math.min(span * 0.5 + (i % 3) * 4, span - 6);
    i += 1;

    const parentX = parent.x + parent.w / 2;
    const xs = reports.map((c) => c.x + c.w / 2);

    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.8);
    doc.line(parentX, parentBottom, parentX, busY);
    doc.line(Math.min(parentX, ...xs), busY, Math.max(parentX, ...xs), busY);
    xs.forEach((cx) => doc.line(cx, busY, cx, childTop));
  });
}

/**
 * Builds a clean, printable org chart PDF for one chart version — every active
 * position in reporting order, with its manager-to-report lines drawn in.
 * Inactive positions and practicum / skilled volunteer placements are left out.
 */
export async function generateOrgChartPdf({ positions, label, showNames = true }) {
  const bands = layoutBands(groupIntoBands(positions));
  const total = bands.reduce((sum, b) => sum + b.people.length, 0);

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: [PAGE_W, PAGE_H] });
  doc.__candoraLogo = await getLogoDataUrl();

  // Give every tier its y position, then spread the extra room across the gaps
  const contentBottom = PAGE_H - FOOTER_H;
  const needed = bands.length * CARD_H + Math.max(bands.length - 1, 0) * BAND_GAP;
  const slack = Math.max(contentBottom - TOP - 12 - needed, 0);
  const gap = BAND_GAP + (bands.length > 1 ? Math.min(slack / (bands.length - 1), 24) : 0);

  let y = TOP;
  const placed = bands.map((band) => {
    const entry = { ...band, cards: band.cards.map((c) => ({ ...c, y })) };
    y += CARD_H + gap;
    return entry;
  });

  drawHeader(doc, label, total);

  const cardsById = new Map();
  placed.forEach((band) => {
    // Tier gutter label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...NAVY);
    doc.text(band.label.toUpperCase(), MARGIN, band.cards[0].y + 24);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(String(band.people.length), MARGIN, band.cards[0].y + 35);

    drawReportingLines(doc, band.cards, cardsById);
    band.cards.forEach((card) => drawCard(doc, card, showNames));
    band.cards.forEach((card) => cardsById.set(card.p.id, card));
  });

  if (total === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    doc.setTextColor(...MUTED);
    doc.text("No active positions on this chart.", MARGIN, TOP + 10);
  }

  drawFooter(doc, total);

  const fileName = `Candora-Org-Chart_${String(label || "chart").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}.pdf`;
  doc.save(fileName);
  return fileName;
}