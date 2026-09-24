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
const NUMS = Array.from({ length: 13 }, (_, n) => String(n));
const ROLE_LABELS = { ED: "Executive Director", "Vice-Chair": "Vice Chair" };

/**
 * Builds a fillable AcroForm PDF for taking board meeting minutes.
 * One set of fillable fields per agenda item: minutes/discussion notes,
 * motion verbiage, moved/seconded/result, and action-item assignee/due date.
 */
export async function generateMinutesTemplatePdf(meeting, orgName, agendaItems, members = [], attendance = null, entries = [], { inCameraOnly = false } = {}) {
  const BRAND = inCameraOnly ? rgb(0.45, 0.06, 0.08) : NAVY;
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
    page.drawText(inCameraOnly ? "In Camera Minutes (continued) — Confidential" : "Board Meeting Minutes (continued)", { x: M, y: y - 10, size: 8, font: bold, color: BRAND });
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

  // Simple word-wrap for plain-text notes
  const wrap = (text, size, width) => {
    const words = String(text || "").split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    for (const w of words) {
      const t = line ? line + " " + w : w;
      if (font.widthOfTextAtSize(t, size) > width && line) { lines.push(line); line = w; } else line = t;
    }
    if (line) lines.push(line);
    return lines;
  };

  // ── Branded header ──
  page.drawRectangle({ x: 0, y: H - 40, width: W, height: 40, color: BRAND });
  page.drawRectangle({ x: 0, y: H - 42, width: W, height: 2, color: GOLD });
  page.drawText(org, { x: M, y: H - 22, size: 12, font: bold, color: rgb(1, 1, 1) });
  page.drawText(inCameraOnly ? "IN CAMERA MINUTES — CONFIDENTIAL · BOARD CHAIR ONLY" : "BOARD MEETING MINUTES", { x: M, y: H - 32, size: 7, font, color: inCameraOnly ? rgb(1, 0.8, 0.82) : GOLD });

  // ── Meeting title + date ──
  y = H - 72;
  const title = meeting?.title || "Board Meeting";
  const dateStr = meeting?.meeting_date ? format(parseDateSmart(meeting.meeting_date), "MMMM d, yyyy") : "";
  page.drawText(title, { x: M, y: y - 12, size: 14, font: bold, color: NAVY });
  y -= 20;
  const sub = [dateStr, meeting?.location].filter(Boolean).join("  ·  ");
  if (sub) { page.drawText(sub, { x: M, y: y - 9, size: 9, font, color: GRAY }); y -= 16; }
  y -= 10;

  // ── Attendance — checkboxes for permanent members + guests field ──
  const sortedMembers = [...members].sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
  if (sortedMembers.length > 0) {
    ensureSpace(40);
    page.drawText("ATTENDANCE", { x: M, y: y - 9, size: 9, font: bold, color: NAVY });
    const aw = bold.widthOfTextAtSize("ATTENDANCE", 9) + 8;
    page.drawLine({ start: { x: M + aw, y: y - 6 }, end: { x: W - M, y: y - 6 }, thickness: 0.75, color: LINE });
    y -= 22;
    const presentNames = attendance?.present_member_names || [];
    for (let i = 0; i < sortedMembers.length; i += 2) {
      ensureSpace(18);
      for (const [idx, x] of [[i, M], [i + 1, M + 270]]) {
        const m = sortedMembers[idx];
        if (!m) continue;
        const cb = form.createCheckBox(`attend_${idx}`);
        cb.addToPage(page, { x, y: y - 11, width: 11, height: 11, borderWidth: 1, borderColor: LINE, backgroundColor: rgb(1, 1, 1) });
        if (presentNames.includes(m.full_name)) cb.check();
        const role = m.role ? ` (${ROLE_LABELS[m.role] || m.role})` : "";
        page.drawText(`${m.full_name}${role}`, { x: x + 17, y: y - 9, size: 8, font, color: rgb(0.15, 0.15, 0.18) });
      }
      y -= 18;
    }
    ensureSpace(34);
    page.drawText("Guests", { x: M, y: y - 8, size: 7, font, color: GRAY });
    y -= 10;
    textField("attendance_guests", M, y - 22, W - 2 * M, 22, true);
    y -= 30;
  }

  // ── Agenda items grouped by section, each with fillable minute fields ──
  const camItems = inCameraOnly ? agendaItems.filter((i) => i.is_in_camera) : agendaItems.filter((i) => !i.is_in_camera);
  const itemById = new Map(agendaItems.map((i) => [i.id, i]));
  const sections = AGENDA_SECTIONS
    .map(({ key, label }) => ({
      label,
      items: camItems
        .filter((i) => sectionOf(i) === key)
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
    }))
    .filter((s) => s.items.length > 0);

  for (const s of sections) {
    ensureSpace(30);
    const label = s.label.toUpperCase();
    page.drawText(label, { x: M, y: y - 9, size: 9, font: bold, color: BRAND });
    const lw = bold.widthOfTextAtSize(label, 9) + 8;
    page.drawLine({ start: { x: M + lw, y: y - 6 }, end: { x: W - M, y: y - 6 }, thickness: 0.75, color: LINE });
    y -= 22;

    s.items.forEach((item, i) => {
      const id = fieldIdx++;
      ensureSpace(170);

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
        { label: "Moved by:", name: `item${id}_moved_by`, w: 150 },
        { label: "Seconded by:", name: `item${id}_seconded_by`, w: 150 },
      ]);
      row([
        { label: "In favour:", name: `item${id}_in_favour`, w: 40, options: NUMS },
        { label: "Opposed:", name: `item${id}_opposed`, w: 40, options: NUMS },
        { label: "Abstained:", name: `item${id}_abstained`, w: 40, options: NUMS },
        { label: "Result:", name: `item${id}_result`, w: 90, options: ["Carried", "Defeated", "Tabled", "Withdrawn"] },
      ]);
      row([
        { label: "Action assigned to:", name: `item${id}_action_to`, w: 150 },
        { label: "Due date:", name: `item${id}_action_due`, w: 90 },
      ]);
      y -= 14;
    });
  }

  // ── Recorded in-camera entries — confidential document only ──
  if (inCameraOnly) {
    const camEntries = (entries || []).filter((e) => e.is_in_camera || e.entry_type === "in_camera");
    if (camEntries.length > 0) {
      ensureSpace(30);
      page.drawText("RECORDED IN-CAMERA NOTES", { x: M, y: y - 9, size: 9, font: bold, color: BRAND });
      const lw0 = bold.widthOfTextAtSize("RECORDED IN-CAMERA NOTES", 9) + 8;
      page.drawLine({ start: { x: M + lw0, y: y - 6 }, end: { x: W - M, y: y - 6 }, thickness: 0.75, color: LINE });
      y -= 22;
      for (const entry of camEntries) {
        ensureSpace(36);
        const itemTitle = itemById.get(entry.agenda_item_id)?.title || "General";
        page.drawText(`${itemTitle} — ${String(entry.entry_type || "note").replace(/_/g, " ")}`, { x: M, y: y - 10, size: 9, font: bold, color: rgb(0.1, 0.1, 0.12) });
        y -= 14;
        if (entry.motion_verbiage) {
          for (const l of wrap(`Motion: "${entry.motion_verbiage}"`, 8, W - 2 * M)) {
            ensureSpace(12);
            page.drawText(l, { x: M, y: y - 8, size: 8, font: bold, color: rgb(0.1, 0.1, 0.12) });
            y -= 11;
          }
        }
        if (entry.content) {
          for (const l of wrap(entry.content, 8, W - 2 * M)) {
            ensureSpace(12);
            page.drawText(l, { x: M, y: y - 8, size: 8, font, color: rgb(0.2, 0.2, 0.22) });
            y -= 11;
          }
        }
        const hasVotes = entry.votes_in_favour != null || entry.votes_opposed != null || entry.votes_abstained != null;
        const bits = [
          entry.moved_by && `Moved: ${entry.moved_by}`,
          entry.seconded_by && `Seconded: ${entry.seconded_by}`,
          entry.motion_result && `Result: ${entry.motion_result}`,
          hasVotes && `In favour: ${entry.votes_in_favour ?? 0} · Opposed: ${entry.votes_opposed ?? 0} · Abstained: ${entry.votes_abstained ?? 0}`,
        ].filter(Boolean).join("    ");
        if (bits) {
          for (const l of wrap(bits, 7, W - 2 * M)) {
            ensureSpace(12);
            page.drawText(l, { x: M, y: y - 8, size: 7, font, color: GRAY });
            y -= 11;
          }
        }
        y -= 10;
      }
    }
  }

  // General notes field at the end (or when there are no agenda items)
  ensureSpace(70);
  page.drawText("Additional Notes", { x: M, y: y - 9, size: 9, font: bold, color: NAVY });
  y -= 22;
  textField("additional_notes", M, y - 60, W - 2 * M, 60, true);

  // ── Footers ──
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawText(inCameraOnly ? `${org} — In Camera Minutes — CONFIDENTIAL · Board Chair only` : `${org} — Board Meeting Minutes`, { x: M, y: 28, size: 7, font, color: GRAY });
    const pn = `Page ${i + 1} of ${pages.length}`;
    p.drawText(pn, { x: W - M - font.widthOfTextAtSize(pn, 7), y: 28, size: 7, font, color: GRAY });
  });

  doc.setTitle(inCameraOnly ? `${title} — In Camera Minutes (Confidential)` : `${title} — Minutes`);
  doc.setSubject(inCameraOnly ? "In-camera meeting minutes — confidential, for the Board Chair" : "Board meeting minutes (fillable)");
  return doc.save();
}