import { PDFDocument, StandardFonts, rgb, PDFName, PDFString } from "pdf-lib";
import { format } from "date-fns";
import { parseDateSmart } from "@/lib/dateUtils";
import { AGENDA_SECTIONS, sectionOf } from "@/components/board/agendaDocumentHtml";

const W = 612, H = 792, M = 50;
const NAVY = rgb(0.07, 0.15, 0.36);
const GOLD = rgb(0.96, 0.75, 0.1);
const GRAY = rgb(0.45, 0.47, 0.51);
const LINE = rgb(0.75, 0.77, 0.8);
const FIELD_BG = rgb(0.985, 0.985, 0.995);
const RED = rgb(0.78, 0.08, 0.08);
const NUMS = Array.from({ length: 13 }, (_, n) => String(n));
const ROLE_LABELS = { ED: "Executive Director", "Vice-Chair": "Vice Chair" };
const matchesTitle = (item, frag) => String(item?.title || "").toLowerCase().includes(frag);
const isApprovalOfAgendaItem = (item) => item?.item_type === "approval_of_agenda" || matchesTitle(item, "approval of agenda");
const isApprovalOfMinutesItem = (item) => item?.item_type === "approval_of_minutes" || matchesTitle(item, "approval of minutes");

/**
 * Builds a fillable AcroForm PDF for taking board meeting minutes.
 * One set of fillable fields per agenda item: minutes/discussion notes,
 * motion verbiage, moved/seconded/result, and action-item assignee/due date.
 */
export async function generateMinutesTemplatePdf(meeting, orgName, agendaItems, members = [], attendance = null, entries = [], { inCameraOnly = false, completed = false } = {}) {
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

  // Red 9pt text inside every text field (box is placed on the page first,
  // then styled — styling before placement breaks the field's appearance)
  const redTextAppearance = (field, widget, fnt) => ({ backgroundColor: FIELD_BG, borderColor: LINE, borderWidth: 1, textColor: RED });

  const textField = (name, x, fy, w, h, multiline = false, value = "") => {
    const f = form.createTextField(name);
    f.addToPage(page, { x, y: fy, width: w, height: h, borderWidth: 1, borderColor: LINE, backgroundColor: FIELD_BG });
    if (multiline) f.enableMultiline();
    if (value) f.setText(String(value));
    f.setFontSize(9);
    f.updateAppearances(font, redTextAppearance);
    // Text typed later in a PDF reader renders red at the same 9pt size
    f.acroField.dict.set(PDFName.of("DA"), PDFString.of(`${RED.red.toFixed(6)} ${RED.green.toFixed(6)} ${RED.blue.toFixed(6)} rg /Helv 9 Tf`));
  };

  const dropdownField = (name, x, fy, w, h, options, value) => {
    const f = form.createDropdown(name);
    let opts = options;
    const v = value != null ? String(value) : "";
    if (v !== "" && !opts.includes(v)) opts = [...opts, v];
    f.addOptions(opts);
    f.addToPage(page, { x, y: fy, width: w, height: h, borderWidth: 1, borderColor: LINE, backgroundColor: rgb(1, 1, 1) });
    if (v !== "") f.select(v);
    f.setFontSize(8);
    f.acroField.dict.set(PDFName.of("DA"), PDFString.of(`${RED.red.toFixed(6)} ${RED.green.toFixed(6)} ${RED.blue.toFixed(6)} rg /Helv 8 Tf`));
  };

  // Inline row of labelled fillable fields
  const row = (cells) => {
    ensureSpace(20);
    let x = M;
    for (const c of cells) {
      page.drawText(c.label, { x, y: y - 9, size: 7, font, color: GRAY });
      const labelW = font.widthOfTextAtSize(c.label, 7) + 5;
      if (c.options) dropdownField(c.name, x + labelW, y - 13, c.w, 13, c.options, c.value);
      else textField(c.name, x + labelW, y - 13, c.w, 13, false, c.value);
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

  // ── Attendance — only the names marked present (members + guests) ──
  const presentNames = attendance?.present_member_names || [];
  const attGuests = attendance?.guest_names || [];
  const memberByName = new Map(members.map((m) => [m.full_name, m]));
  const roleOf = (n) => { const m = memberByName.get(n); return m?.role ? ` (${ROLE_LABELS[m.role] || m.role})` : ""; };
  const attNames = [...presentNames.map((n) => `${n}${roleOf(n)}`), ...attGuests.map((g) => `${g} (Guest)`)];
  ensureSpace(40);
  page.drawText("ATTENDANCE", { x: M, y: y - 9, size: 9, font: bold, color: BRAND });
  const aw = bold.widthOfTextAtSize("ATTENDANCE", 9) + 8;
  page.drawLine({ start: { x: M + aw, y: y - 6 }, end: { x: W - M, y: y - 6 }, thickness: 0.75, color: LINE });
  y -= 22;
  if (completed) {
    for (let i = 0; i < attNames.length; i += 2) {
      ensureSpace(16);
      for (const [idx, x] of [[i, M], [i + 1, M + 270]]) {
        if (!attNames[idx]) continue;
        page.drawText(attNames[idx], { x, y: y - 9, size: 9, font, color: rgb(0.15, 0.15, 0.18) });
      }
      y -= 16;
    }
  } else {
    // Blank fillable attendance — a Present/Regret dropdown beside each permanent member, plus a guests field.
    // Nothing recorded in the app is carried over: the fillable template starts empty.
    const attMembers = (members || []).filter((m) => m.status !== "inactive");
    for (let i = 0; i < attMembers.length; i += 2) {
      ensureSpace(18);
      for (const [idx, x] of [[i, M], [i + 1, M + 270]]) {
        if (!attMembers[idx]) continue;
        const m = attMembers[idx];
        const label = `${m.full_name}${m.role ? ` (${ROLE_LABELS[m.role] || m.role})` : ""}`;
        page.drawText(label, { x, y: y - 9, size: 8, font, color: rgb(0.15, 0.15, 0.18) });
        dropdownField(`attendance_${idx}`, x + font.widthOfTextAtSize(label, 8) + 5, y - 13, 66, 13, ["", "Present", "Regret"], "");
      }
      y -= 17;
    }
    row([{ label: "Guests:", name: "attendance_guests", w: 300, value: "" }]);
  }
  // Regrets — permanent members not marked present; completed document only
  const regretNames = (members || [])
    .filter((m) => m.status !== "inactive" && !presentNames.includes(m.full_name))
    .map((m) => m.full_name);
  if (completed && presentNames.length > 0 && regretNames.length > 0) {
    for (const l of wrap(`Regrets:  ${regretNames.join("    ")}`, 9, W - 2 * M)) {
      ensureSpace(14);
      page.drawText(l, { x: M, y: y - 9, size: 9, font, color: GRAY });
      y -= 13;
    }
  }
  y -= 8;
  // Motion moved/seconded dropdowns list voting attendees only — guests and non-voting members are excluded
  const votingMembers = (members || []).filter((m) => m.is_voting !== false);
  const presentVoting = votingMembers.filter((m) => presentNames.includes(m.full_name)).map((m) => m.full_name);
  const attendeeOpts = presentVoting.length > 0 ? presentVoting : votingMembers.map((m) => m.full_name);

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
      const itemTitle = `${i + 1}. ${item.title}`;
      ensureSpace(40);
      page.drawText(itemTitle, { x: M, y: y - 10, size: 10, font: bold, color: rgb(0.1, 0.1, 0.12) });
      if (item.presenter) {
        const p = `Presenter: ${item.presenter}`;
        page.drawText(p, { x: W - M - font.widthOfTextAtSize(p, 7), y: y - 9, size: 7, font, color: GRAY });
      }
      y -= 16;

      const itemEntries = (entries || [])
        .filter((e) => e.agenda_item_id === item.id)
        .filter((e) => inCameraOnly || !(e.is_in_camera || e.entry_type === "in_camera"))
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

      // Per-item capabilities — Call to Order and Date of Next Meeting are notes-only,
      // Motion to Adjourn needs only the mover's name, Invitation to Visit has no fields
      if (matchesTitle(item, "invitation to visit")) { y -= 6; return; }
      const notesOnly = item.item_type === "call_to_order" || matchesTitle(item, "call to order") || matchesTitle(item, "date of next meeting");
      const isNextMeetingItem = matchesTitle(item, "date of next meeting");
      const isAdjournMotionItem = matchesTitle(item, "motion to adjourn");

      // Completed document: only the recorded entries, flattened.
      // Fillable template: exactly one blank block per item carrying the full field set —
      // nothing recorded in the app is included (that's what the completed document is for).
      const blocks = completed ? itemEntries : [null];
      blocks.forEach((entry, bi) => {
        const id = fieldIdx++;
        let type = entry?.entry_type || "note";
        if (notesOnly) type = "note";
        if (isAdjournMotionItem) type = "motion";
        const isM = ["motion", "resolution"].includes(type);
        const isA = type === "action_item";
        const isCam = entry && (entry.is_in_camera || entry.entry_type === "in_camera");
        const blankAll = !completed && !notesOnly; // blank blocks carry every field the in-app form can use

        // Motion to Adjourn — only the name of the person moving to adjourn
        if (isAdjournMotionItem) {
          row([
            { label: "Moved to adjourn by:", name: `item${id}_moved_by`, w: 150, options: attendeeOpts, value: entry?.moved_by },
          ]);
          y -= 10;
          return;
        }

        // Date of Next Meeting — fillable date for the next meeting, plus a notes box
        if (isNextMeetingItem) {
          row([
            { label: "Next meeting date:", name: `item${id}_next_meeting_date`, w: 90, value: entry?.action_due_date || "" },
          ]);
        }

        if (completed) {
          ensureSpace(30);
          page.drawText(
            `${String(type).replace(/_/g, " ").toUpperCase()}${blocks.length > 1 ? `  #${bi + 1}` : ""}${isCam ? "  — IN CAMERA" : ""}`,
            { x: M, y: y - 8, size: 7, font: bold, color: isCam ? RED : GRAY }
          );
          y -= 12;
        } else if (blankAll) {
          // Entry type selector — the same choices as the in-app form (In Camera only where the app allows it)
          const typeOptions = ["Note", "Motion", "Resolution", "Action Item", "Discussion", "Information", "Dissent", "Abstention"];
          if (!(isApprovalOfAgendaItem(item) || isApprovalOfMinutesItem(item))) typeOptions.push("In Camera");
          row([
            { label: "Entry type:", name: `item${id}_type`, w: 110, options: typeOptions, value: "" },
          ]);
        }

        // Motion verbiage — recorded motion/resolution entries, and every blank block
        if (isM || blankAll) {
          const mv = entry?.motion_verbiage || "";
          const mlines = mv ? wrap(mv, 9, W - 2 * M - 8) : [""];
          const mh = Math.max(20, mlines.length * 11 + 7);
          ensureSpace(mh + 12);
          page.drawText("Motion", { x: M, y: y - 8, size: 7, font, color: GRAY });
          y -= 10;
          textField(`item${id}_motion`, M, y - mh, W - 2 * M, mh, true, mv);
          y -= mh + 8;
        }

        // Notes / discussion — every entry; box sized to its recorded text, wraps when filled
        const content = entry?.content || "";
        const clines = content ? wrap(content, 9, W - 2 * M - 8) : [""];
        const ch = Math.max(28, clines.length * 11 + 8);
        ensureSpace(ch + 12);
        page.drawText("Notes / Discussion", { x: M, y: y - 8, size: 7, font, color: GRAY });
        y -= 10;
        textField(`item${id}_notes`, M, y - ch, W - 2 * M, ch, true, content);
        y -= ch + 8;

        // Motion attribution, votes and result — recorded motion/resolution entries, and every blank block
        if (isM || blankAll) {
          row([
            { label: "Moved by:", name: `item${id}_moved_by`, w: 150, options: attendeeOpts, value: entry?.moved_by },
            { label: "Seconded by:", name: `item${id}_seconded_by`, w: 150, options: attendeeOpts, value: entry?.seconded_by },
          ]);
          row([
            { label: "In favour:", name: `item${id}_in_favour`, w: 40, options: ["All", ...NUMS], value: entry?.votes_in_favour },
            { label: "Opposed:", name: `item${id}_opposed`, w: 40, options: NUMS, value: entry?.votes_opposed },
            { label: "Abstained:", name: `item${id}_abstained`, w: 40, options: NUMS, value: entry?.votes_abstained },
            { label: "Result:", name: `item${id}_result`, w: 90, options: ["Carried", "Defeated", "Tabled", "Withdrawn"], value: entry?.motion_result ? String(entry.motion_result).charAt(0).toUpperCase() + String(entry.motion_result).slice(1) : "" },
          ]);
        }

        // Action item fields — recorded action_item entries, and every blank block
        if (isA || blankAll) {
          row([
            { label: "Action assigned to:", name: `item${id}_action_to`, w: 150, value: entry?.action_assigned_to },
            { label: "Due date:", name: `item${id}_action_due`, w: 90, value: entry?.action_due_date },
          ]);
        }
        y -= 10;
      });
      y -= 6;
    });
  }

  // ── Recorded in-camera entries — confidential document only ──
  if (inCameraOnly) {
    const camEntries = (entries || []).filter((e) => (e.is_in_camera || e.entry_type === "in_camera") && !itemById.get(e.agenda_item_id)?.is_in_camera);
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

  // General notes field at the end (or when there are no agenda items) — fillable template only
  if (!completed) {
    ensureSpace(70);
    page.drawText("Additional Notes", { x: M, y: y - 9, size: 9, font: bold, color: NAVY });
    y -= 22;
    textField("additional_notes", M, y - 60, W - 2 * M, 60, true);
  }

  // ── Footers ──
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawText(inCameraOnly ? `${org} — In Camera Minutes — CONFIDENTIAL · Board Chair only` : `${org} — Board Meeting Minutes`, { x: M, y: 28, size: 7, font, color: GRAY });
    const pn = `Page ${i + 1} of ${pages.length}`;
    p.drawText(pn, { x: W - M - font.widthOfTextAtSize(pn, 7), y: 28, size: 7, font, color: GRAY });
  });

  // Completed document: flatten the form so the recorded entries become permanent page text
  if (completed) form.flatten();
  doc.setTitle(inCameraOnly ? `${title} — In Camera Minutes (Confidential)` : `${title} — Minutes`);
  doc.setSubject(inCameraOnly ? "In-camera meeting minutes — confidential, for the Board Chair" : "Board meeting minutes (fillable)");
  return doc.save();
}