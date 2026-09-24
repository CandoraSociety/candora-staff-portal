import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { format } from "date-fns";
import { parseDateSmart } from "@/lib/dateUtils";
import { AGENDA_SECTIONS, sectionOf } from "@/components/board/agendaDocumentHtml";

const W = 612, H = 792, M = 50;
const NAVY = rgb(0.07, 0.15, 0.36);
const GOLD = rgb(0.96, 0.75, 0.1);
const GRAY = rgb(0.45, 0.47, 0.51);
const LINE = rgb(0.75, 0.77, 0.8);
const FIELD_BG = rgb(0.985, 0.985, 0.995);

/**
 * Builds a fillable AcroForm PDF for taking board meeting minutes.
 * One set of fillable fields per agenda item: minutes/discussion notes,
 * motion verbiage, moved/seconded/result, and action-item assignee/due date.
 */
export async function generateMinutesTemplatePdf(meeting, orgName, agendaItems) {
  const doc = await PDFDocument.create();
  const form = doc.getForm();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const org = orgName || "Candora Society of Edmonton";
  let page = doc.addPage([W, H]);
  let y = 0;
  let fieldIdx = 0;

  const newPage = () => {
    page = doc.addPage([W, H]);
    y = H - 56;
    page.drawText("Board Meeting Minutes (continued)", { x: M, y: y - 10, size: 8, font: bold, color: NAVY });
    y -= 26;
  };

  const ensureSpace = (h) => { if (y - h < 60) newPage(); };

  const textField = (name, x, fy, w, h, multiline = false) => {
    const f = form.createTextField(name);
    if (multiline) f.enableMultiline();
    f.addToPage(page, { x, y: fy, width: w, height: h, borderWidth: 1, borderColor: LINE, backgroundColor: FIELD_BG });
  };

  const dropdownField = (name, x, fy, w, h, options) => {
    const f = form.createDropdown(name);
    f.addOptions(options);
    f.addToPage(page, { x, y: fy, width: w, height: h, borderWidth: 1, borderColor: LINE, backgroundColor: rgb(1, 1, 1) });
  };

  // Inline row of labelled fillable fields
  const row = (cells) => {
    ensureSpace(20);
    let x = M;
    for (const c of cells) {
      page.drawText(c.label, { x, y: y - 9, size: 7, font, color: GRAY });
      const labelW = font.widthOfTextAtSize(c.label, 7) + 5;
      if (c.options) dropdownField(c.name, x + labelW, y - 13, c.w, 13, c.options);
      else textField(c.name, x + labelW, y - 13, c.w, 13);
      x += labelW + c.w + 12;
    }
    y -= 20;
  };

  // ── Branded header ──
  page.drawRectangle({ x: 0, y: H - 40, width: W, height: 40, color: NAVY });
  page.drawRectangle({ x: 0, y: H - 42, width: W, height: 2, color: GOLD });
  page.drawText(org, { x: M, y: H - 22, size: 12, font: bold, color: rgb(1, 1, 1) });
  page.drawText("BOARD MEETING MINUTES", { x: M, y: H - 32, size: 7, font, color: GOLD });

  // ── Meeting title + date ──
  y = H - 72;
  const title = meeting?.title || "Board Meeting";
  const dateStr = meeting?.meeting_date ? format(parseDateSmart(meeting.meeting_date), "MMMM d, yyyy") : "";
  page.drawText(title, { x: M, y: y - 12, size: 14, font: bold, color: NAVY });
  y -= 20;
  const sub = [dateStr, meeting?.location].filter(Boolean).join("  ·  ");
  if (sub) { page.drawText(sub, { x: M, y: y - 9, size: 9, font, color: GRAY }); y -= 16; }
  y -= 10;

  // ── Agenda items grouped by section, each with fillable minute fields ──
  const sections = AGENDA_SECTIONS
    .map(({ key, label }) => ({
      label,
      items: agendaItems
        .filter((i) => sectionOf(i) === key)
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
    }))
    .filter((s) => s.items.length > 0);

  for (const s of sections) {
    ensureSpace(30);
    const label = s.label.toUpperCase();
    page.drawText(label, { x: M, y: y - 9, size: 9, font: bold, color: NAVY });
    const lw = bold.widthOfTextAtSize(label, 9) + 8;
    page.drawLine({ start: { x: M + lw, y: y - 6 }, end: { x: W - M, y: y - 6 }, thickness: 0.75, color: LINE });
    y -= 22;

    s.items.forEach((item, i) => {
      const id = fieldIdx++;
      ensureSpace(140);

      const itemTitle = `${i + 1}. ${item.title}`;
      page.drawText(itemTitle, { x: M, y: y - 10, size: 10, font: bold, color: rgb(0.1, 0.1, 0.12) });
      if (item.presenter) {
        const p = `Presenter: ${item.presenter}`;
        page.drawText(p, { x: W - M - font.widthOfTextAtSize(p, 7), y: y - 9, size: 7, font, color: GRAY });
      }
      y -= 16;

      page.drawText("Minutes / Discussion", { x: M, y: y - 8, size: 7, font, color: GRAY });
      y -= 10;
      textField(`item${id}_notes`, M, y - 42, W - 2 * M, 42, true);
      y -= 48;

      row([{ label: "Motion:", name: `item${id}_motion`, w: 300 }]);
      row([
        { label: "Moved by:", name: `item${id}_moved_by`, w: 110 },
        { label: "Seconded by:", name: `item${id}_seconded_by`, w: 110 },
        { label: "Result:", name: `item${id}_result`, w: 90, options: ["Carried", "Defeated", "Tabled", "Withdrawn"] },
      ]);
      row([
        { label: "Action assigned to:", name: `item${id}_action_to`, w: 150 },
        { label: "Due date:", name: `item${id}_action_due`, w: 90 },
      ]);
      y -= 14;
    });
  }

  // General notes field at the end (or when there are no agenda items)
  ensureSpace(70);
  page.drawText("Additional Notes", { x: M, y: y - 9, size: 9, font: bold, color: NAVY });
  y -= 22;
  textField("additional_notes", M, y - 60, W - 2 * M, 60, true);

  // ── Footers ──
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawText(`${org} — Board Meeting Minutes`, { x: M, y: 28, size: 7, font, color: GRAY });
    const pn = `Page ${i + 1} of ${pages.length}`;
    p.drawText(pn, { x: W - M - font.widthOfTextAtSize(pn, 7), y: 28, size: 7, font, color: GRAY });
  });

  doc.setTitle(`${title} — Minutes`);
  doc.setSubject("Board meeting minutes (fillable)");
  return doc.save();
}