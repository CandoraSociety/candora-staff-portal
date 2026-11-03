const TIER_ORDER = ["executive", "director", "senior_manager", "manager", "supervisor_team_lead", "specialist", "frontline", "assistant"];
const TIER_LABELS = {
  executive: "Executive", director: "Director", senior_manager: "Senior Manager",
  manager: "Manager", supervisor_team_lead: "Supervisor / Team Lead",
  specialist: "Specialist", frontline: "Frontline", assistant: "Assistant",
};
const EXCLUDED_TIERS = new Set(["practicum_placement", "skilled_volunteer"]);
const LABEL_W = 112;
const GAP = 10;
const PAD = 12;

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
    return { label: TIER_LABELS[key] || "Unassigned", number: index + 1,
      people: parents.flatMap(id => people.filter(p => (p.reports_to_id || "") === id)) };
  });
}

function measureCard(doc, p, references, managers, width, showNames) {
  const reference = references.get(p);
  const manager = managers.get(p.reports_to_id);
  const departments = (p.departments?.length ? p.departments : [p.department]).filter(Boolean);
  const reporting = !p.reports_to_id ? "Top-level position"
    : manager ? `Reports to ${references.get(manager)}: ${manager.title || "Untitled position"}`
    : "Reports to: position not on this chart";
  const specs = [
    { text: p.title || "Untitled position", size: 9, leading: 11, font: "bold", color: "navy" },
    { text: showNames ? p.person_name : "", size: 8, leading: 10, font: "normal", color: "ink" },
    { text: [...new Set(departments)].join(" / "), size: 7.5, leading: 9, font: "italic", color: "muted" },
    { text: reporting, size: 7.5, leading: 9, font: "normal", color: "navy", divider: true },
  ];
  let cursor = 28;
  const blocks = specs.filter(s => s.text).map(spec => {
    doc.setFont("helvetica", spec.font);
    doc.setFontSize(spec.size);
    const lines = doc.splitTextToSize(String(spec.text), width - 20);
    if (spec.divider) cursor += 9;
    const block = { ...spec, lines, baseline: cursor };
    cursor += lines.length * spec.leading + 3;
    return block;
  });
  return { p, reference, blocks, width, height: Math.max(82, cursor + 7) };
}

// A tier is a band of readable cards, not a single row squeezed to page width.
// Manual tree row numbers do not replace a position's actual seniority tier.
export function layoutTieredPages(doc, positions, { showNames, margin, top, bottom }) {
  const tiers = groupTiers(positions || []);
  const references = new Map(tiers.flatMap(t => t.people).map((p, i) => [p, `P${String(i + 1).padStart(2, "0")}`]));
  const managers = new Map();
  references.forEach((_, p) => managers.set(p.id, p));
  references.forEach((_, p) => { if (p.original_id && !managers.has(p.original_id)) managers.set(p.original_id, p); });
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  const cardArea = width - LABEL_W - PAD * 2;
  const columns = Math.max(1, Math.floor((cardArea + GAP) / (156 + GAP)));
  const cardWidth = (cardArea - (columns - 1) * GAP) / columns;
  const pages = [[]];
  let y = top;
  tiers.forEach(tier => {
    const cards = tier.people.map(p => measureCard(doc, p, references, managers, cardWidth, showNames));
    const rows = [];
    for (let i = 0; i < cards.length; i += columns) {
      const rowCards = cards.slice(i, i + columns);
      rows.push({ cards: rowCards, height: Math.max(...rowCards.map(c => c.height)) });
    }
    let offset = 0;
    while (offset < rows.length) {
      if (y + PAD * 2 + rows[offset].height > bottom && pages[pages.length - 1].length) {
        pages.push([]);
        y = top;
      }
      const segmentRows = [rows[offset]];
      let height = PAD * 2 + rows[offset].height;
      while (offset + segmentRows.length < rows.length) {
        const next = rows[offset + segmentRows.length];
        if (y + height + GAP + next.height > bottom) break;
        height += GAP + next.height;
        segmentRows.push(next);
      }
      pages[pages.length - 1].push({ ...tier, rows: segmentRows, y, height, width, continued: offset > 0 });
      offset += segmentRows.length;
      y += height + GAP;
    }
  });
  return { pages, total: references.size };
}

function drawCard(doc, card, x, y, height, palette) {
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...palette.border);
  doc.setLineWidth(0.7);
  if (card.p.is_vacant) doc.setLineDashPattern([3, 2], 0);
  doc.roundedRect(x, y, card.width, height, 4, 4, "FD");
  doc.setLineDashPattern([], 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...palette.muted);
  doc.text(card.reference, x + 10, y + 13);
  if (card.p.is_vacant) doc.text("VACANT", x + card.width - 10, y + 13, { align: "right" });
  card.blocks.forEach(block => {
    if (block.divider) {
      doc.setDrawColor(...palette.border);
      doc.setLineWidth(0.4);
      doc.line(x + 10, y + block.baseline - 9, x + card.width - 10, y + block.baseline - 9);
    }
    doc.setFont("helvetica", block.font);
    doc.setFontSize(block.size);
    doc.setTextColor(...palette[block.color]);
    block.lines.forEach((line, i) => doc.text(line, x + 10, y + block.baseline + i * block.leading));
  });
}

export function drawTieredPage(doc, bands, { margin, palette }) {
  bands.forEach(band => {
    doc.setFillColor(247, 249, 252);
    doc.setDrawColor(...palette.border);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, band.y, band.width, band.height, 5, 5, "FD");
    doc.setFillColor(...palette.navy);
    doc.rect(margin, band.y, LABEL_W, band.height, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...palette.gold);
    doc.text(`TIER ${band.number}`, margin + PAD, band.y + 21);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    const labels = doc.splitTextToSize(band.label, LABEL_W - PAD * 2);
    labels.forEach((line, i) => doc.text(line, margin + PAD, band.y + 39 + i * 12));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    const captionY = band.y + 46 + labels.length * 12;
    doc.text(`${band.people.length} position${band.people.length === 1 ? "" : "s"}`, margin + PAD, captionY);
    if (band.continued) doc.text("Continued", margin + PAD, captionY + 12);
    let rowY = band.y + PAD;
    band.rows.forEach(row => {
      const rowWidth = row.cards.length * (row.cards[0].width + GAP) - GAP;
      let x = margin + LABEL_W + (band.width - LABEL_W - rowWidth) / 2;
      row.cards.forEach(card => {
        drawCard(doc, card, x, rowY, row.height, palette);
        x += card.width + GAP;
      });
      rowY += row.height + GAP;
    });
  });
}