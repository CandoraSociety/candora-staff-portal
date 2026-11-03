const TIER_ORDER = ["executive", "director", "senior_manager", "manager", "supervisor_team_lead", "specialist", "frontline", "assistant"];
const TIER_LABELS = {
  executive: "Executive", director: "Director", senior_manager: "Senior Manager",
  manager: "Manager", supervisor_team_lead: "Supervisor / Team Lead",
  specialist: "Specialist", frontline: "Frontline", assistant: "Assistant",
};
const EXCLUDED_TIERS = new Set(["practicum_placement", "skilled_volunteer"]);
const LABEL_W = 100;
const BASE_CARD_W = 154;
const MIN_SCALE = 0.5;

function groupTiers(positions) {
  const groups = new Map();
  positions.filter(p => !p.is_inactive && !EXCLUDED_TIERS.has(p.tier)).forEach(p => {
    const key = TIER_ORDER.includes(p.tier) ? p.tier : "unassigned";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  });
  return [...TIER_ORDER, "unassigned"].filter(key => groups.has(key)).map((key, index) => {
    const people = groups.get(key);
    // Keep direct reports together without changing their order within each group.
    const parents = [...new Set(people.map(p => p.reports_to_id || ""))];
    return {
      label: TIER_LABELS[key] || "Unassigned",
      number: index + 1,
      people: parents.flatMap(id => people.filter(p => (p.reports_to_id || "") === id)),
    };
  });
}

function measureCard(doc, p, references, managers, width, showNames, scale) {
  const reference = references.get(p);
  const manager = managers.get(p.reports_to_id);
  const departments = (p.departments?.length ? p.departments : [p.department]).filter(Boolean);
  const reporting = !p.reports_to_id ? "Top-level position"
    : manager ? `Reports to ${references.get(manager)}: ${manager.title || "Untitled position"}`
    : "Reports to: not on this chart";
  const specs = [
    { text: p.title || "Untitled position", size: 9 * scale, leading: 11 * scale, font: "bold", color: "navy" },
    { text: showNames ? p.person_name : "", size: 8 * scale, leading: 9.6 * scale, font: "normal", color: "ink" },
    { text: [...new Set(departments)].join(" / "), size: 7.2 * scale, leading: 8.8 * scale, font: "italic", color: "muted" },
    { text: reporting, size: 7.2 * scale, leading: 8.8 * scale, font: "normal", color: "navy", divider: true },
  ];
  const inset = 7 * scale;
  let cursor = 22 * scale;
  const blocks = specs.filter(s => s.text).map(spec => {
    doc.setFont("helvetica", spec.font);
    doc.setFontSize(spec.size);
    const lines = doc.splitTextToSize(String(spec.text), width - inset * 2);
    if (spec.divider) cursor += 7 * scale;
    const block = { ...spec, lines, baseline: cursor };
    cursor += lines.length * spec.leading + 2.4 * scale;
    return block;
  });
  return { p, reference, blocks, width, height: Math.max(70 * scale, cursor + 6 * scale) };
}

// Builds the chart at a given scale so the fit search can compare heights.
function buildLayout(doc, positions, { showNames, margin, pageWidth, top, bottom }, scale) {
  const gap = 8 * scale;
  const pad = 9 * scale;
  const tiers = groupTiers(positions || []);
  const references = new Map(tiers.flatMap(t => t.people).map((p, i) => [p, `P${String(i + 1).padStart(2, "0")}`]));
  const managers = new Map();
  references.forEach((_, p) => managers.set(p.id, p));
  references.forEach((_, p) => { if (p.original_id && !managers.has(p.original_id)) managers.set(p.original_id, p); });

  const usable = pageWidth - margin * 2 - LABEL_W - pad * 2;
  const columns = Math.max(1, Math.floor((usable + gap) / (BASE_CARD_W * scale + gap)));
  const cardW = (usable - (columns - 1) * gap) / columns;

  let y = top;
  const bands = tiers.map(tier => {
    const cards = tier.people.map(p => measureCard(doc, p, references, managers, cardW, showNames, scale));
    const rows = [];
    for (let i = 0; i < cards.length; i += columns) {
      const rowCards = cards.slice(i, i + columns);
      rows.push({ cards: rowCards, height: Math.max(...rowCards.map(c => c.height)) });
    }
    const height = pad * 2 + rows.reduce((sum, r) => sum + r.height, 0) + gap * Math.max(rows.length - 1, 0);
    const band = { ...tier, rows, height, y, scale, pad, gap };
    y += height + gap;
    return band;
  });

  return { bands, total: references.size, height: y - gap - top, scale, pad, gap,
    bandWidth: LABEL_W + pad * 2 + columns * (cardW + gap) - gap };
}

/**
 * Fits every active position on a single page. Rows start at the left edge of
 * the chart, and the largest scale that still fits inside the page is used, so
 * cards stay as large as possible without spilling onto a second page.
 */
export function layoutTieredChart(doc, positions, options) {
  const { top, bottom } = options;
  let scale = 1;
  let layout = buildLayout(doc, positions, options, scale);
  if (layout.height > bottom - top) {
    let low = MIN_SCALE;
    let high = 1;
    for (let i = 0; i < 12; i++) {
      const mid = (low + high) / 2;
      if (buildLayout(doc, positions, options, mid).height > bottom - top) high = mid;
      else low = mid;
    }
    scale = low;
    layout = buildLayout(doc, positions, options, scale);
  }
  return layout;
}

function drawCard(doc, card, x, y, palette, scale) {
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...palette.border);
  doc.setLineWidth(0.7);
  if (card.p.is_vacant) doc.setLineDashPattern([3, 2], 0);
  doc.roundedRect(x, y, card.width, card.height, 3, 3, "FD");
  doc.setLineDashPattern([], 0);

  const inset = 7 * scale;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.4 * scale);
  doc.setTextColor(...palette.muted);
  doc.text(card.reference, x + inset, y + 10 * scale);
  if (card.p.is_vacant) doc.text("VACANT", x + card.width - inset, y + 10 * scale, { align: "right" });

  card.blocks.forEach(block => {
    if (block.divider) {
      doc.setDrawColor(...palette.border);
      doc.setLineWidth(0.4);
      doc.line(x + inset, y + block.baseline - 6 * scale, x + card.width - inset, y + block.baseline - 6 * scale);
    }
    doc.setFont("helvetica", block.font);
    doc.setFontSize(block.size);
    doc.setTextColor(...palette[block.color]);
    block.lines.forEach((line, i) => doc.text(line, x + inset, y + block.baseline + i * block.leading));
  });
}

export function drawTieredChart(doc, layout, { margin, palette }) {
  const { bands, scale } = layout;
  bands.forEach(band => {
    doc.setFillColor(247, 249, 252);
    doc.setDrawColor(...palette.border);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, band.y, layout.bandWidth, band.height, 4, 4, "FD");

    doc.setFillColor(...palette.navy);
    doc.rect(margin, band.y, LABEL_W, band.height, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7 * scale);
    doc.setTextColor(...palette.gold);
    doc.text(`TIER ${band.number}`, margin + band.pad, band.y + band.pad + 7 * scale);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9 * scale);
    const labels = doc.splitTextToSize(band.label, LABEL_W - band.pad * 2);
    labels.forEach((line, i) => doc.text(line, margin + band.pad, band.y + band.pad + 18 * scale + i * 10.5 * scale));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7 * scale);
    doc.text(`${band.people.length} position${band.people.length === 1 ? "" : "s"}`, margin + band.pad,
      band.y + band.pad + 22 * scale + labels.length * 10.5 * scale);

    // Rows are left-aligned so every tier starts on the same line.
    let rowY = band.y + band.pad;
    band.rows.forEach(row => {
      let x = margin + LABEL_W + band.pad;
      row.cards.forEach(card => {
        drawCard(doc, card, x, rowY, palette, scale);
        x += card.width + band.gap;
      });
      rowY += row.height + band.gap;
    });
  });
}