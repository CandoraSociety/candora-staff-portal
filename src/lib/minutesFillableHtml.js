import { format } from "date-fns";
import { parseDateSmart } from "@/lib/dateUtils";
import { AGENDA_SECTIONS, sectionOf, CANDORA_LOGO_URL } from "@/components/board/agendaDocumentHtml";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// JSON for embedding inside a <script> — "<" escaped so the tag can never be closed early
const j = (v) => JSON.stringify(v).replace(/</g, "\\u003c");

const ROLE_LABELS = { ED: "Executive Director", "Vice-Chair": "Vice Chair" };
const titleMatch = (item, frag) => (item?.title || "").toLowerCase().includes(frag);
const isCallToOrderItem = (i) => i?.item_type === "call_to_order" || titleMatch(i, "call to order");
const isApprovalOfAgendaItem = (i) => i?.item_type === "approval_of_agenda" || titleMatch(i, "approval of agenda");
const isApprovalOfMinutesItem = (i) => i?.item_type === "approval_of_minutes" || titleMatch(i, "approval of minutes");
const isNextMeetingItem = (i) => titleMatch(i, "date of next meeting");
const isAdjournMotionItem = (i) => titleMatch(i, "motion to adjourn");
const isInvitationItem = (i) => titleMatch(i, "invitation to visit");

/**
 * Builds the fillable board-minutes template as a standalone interactive HTML document.
 * Meant to be SAVED as a .html file and opened from the user's computer — opened
 * locally its scripts run fine, so the fillable buttons work. (Documents opened
 * directly by the app get their scripts blocked, which is why this is offered as a
 * download rather than a new tab.)
 */
export function buildMinutesFillableHtml({ meeting, orgName, items, members }) {
  const org = orgName || "Candora Society of Edmonton";
  const active = (members || []).filter((m) => m.status !== "inactive");
  const voting = active.filter((m) => m.is_voting !== false);
  const voterOpts = ['<option value="">— select —</option>', ...voting.map((m) => `<option>${esc(m.full_name)}</option>`)].join("");
  const favOpts = '<option value="">—</option><option>All present</option>' + Array.from({ length: 13 }, (_, n) => `<option>${n}</option>`).join("");
  const numOpts = '<option value="">—</option>' + Array.from({ length: 13 }, (_, n) => `<option>${n}</option>`).join("");

  // Field groups injected into every entry block — shown only for the matching entry type
  const TEMPLATES = {
    motion:
      `<input class="f" placeholder="Motion verbiage (e.g. Be it resolved that...)">` +
      `<textarea class="f" rows="3" placeholder="Notes / discussion..."></textarea>` +
      `<div class="frow">` +
      `<label class="cap">Moved by <select class="f">${voterOpts}</select></label>` +
      `<label class="cap">Seconded by <select class="f">${voterOpts}</select></label>` +
      `<label class="cap">Result <select class="f"><option value="">—</option><option>Carried</option><option>Defeated</option><option>Tabled</option><option>Withdrawn</option></select></label>` +
      `</div>` +
      `<div class="frow">` +
      `<label class="cap">In favour <select class="f">${favOpts}</select></label>` +
      `<label class="cap">Opposed <select class="f">${numOpts}</select></label>` +
      `<label class="cap">Abstained <select class="f">${numOpts}</select></label>` +
      `</div>`,
    action_item:
      `<div class="frow">` +
      `<label class="cap">Action assigned to <input class="f" placeholder="Name"></label>` +
      `<label class="cap">Due date <input type="date" class="f"></label>` +
      `</div>` +
      `<textarea class="f" rows="3" placeholder="Notes / details..."></textarea>`,
    in_camera:
      `<div class="confidential">Confidential — goes in the separate In-Camera Minutes for the Board Chair, not the regular minutes.</div>` +
      `<textarea class="f" rows="3" placeholder="Notes / details..."></textarea>`,
    notes: `<textarea class="f" rows="3" placeholder="Notes / details..."></textarea>`,
  };

  const renderItem = (item, idx) => {
    const head = `<div class="item-title">${idx + 1}. ${esc(item.title)}${item.is_in_camera ? ' <span class="ic-tag">(In Camera)</span>' : ""}${item.presenter ? ` <span class="presenter">— ${esc(item.presenter)}</span>` : ""}</div>`;
    let body = "";
    if (isInvitationItem(item)) {
      body = "";
    } else if (isAdjournMotionItem(item)) {
      body = `<div class="frow"><label class="cap">Moved to adjourn by <select class="f">${voterOpts}</select></label><label class="cap">Adjourned at <input type="time" class="f w80"></label></div>`;
    } else if (isCallToOrderItem(item)) {
      body = `<div class="frow"><label class="cap">Called to order <input type="time" class="f w80"></label></div><textarea class="f" rows="2" placeholder="Notes..."></textarea>`;
    } else if (isNextMeetingItem(item)) {
      body = `<div class="frow"><label class="cap">Next meeting date <input type="date" class="f"></label></div><textarea class="f" rows="2" placeholder="Notes..."></textarea>`;
    } else if (isApprovalOfAgendaItem(item)) {
      body = `<div class="entries" id="entries-${esc(item.id)}"></div><button type="button" class="add-btn" onclick="addMotion('entries-${esc(item.id)}')">+ Motion</button>` +
        `<div style="margin-top:4px;"><button type="button" class="add-btn" onclick="toggleAgendaForm(this)">+ Add agenda item</button>` +
        `<div class="agenda-form" style="display:none"><input class="f" placeholder="New agenda item title"><button type="button" class="add-btn" onclick="addAgendaItem(this)">Add</button></div></div>`;
    } else {
      const notesOnly = isApprovalOfMinutesItem(item);
      const allowInCamera = !notesOnly;
      body = `<div class="entries" id="entries-${esc(item.id)}"></div><button type="button" class="add-btn" onclick="addEntry('entries-${esc(item.id)}', ${allowInCamera ? "true" : "false"}, ${notesOnly ? "true" : "false"})">+ Add entry</button>`;
    }
    return `<div class="item">${head}${body}</div>`;
  };

  const sectionsHtml = AGENDA_SECTIONS
    .map(({ key, label }) => ({
      label,
      list: (items || []).filter((i) => sectionOf(i) === key).sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
    }))
    .filter((s) => s.list.length > 0)
    .map(({ label, list }) => `<div class="section"><h2>${esc(label)}</h2>${list.map(renderItem).join("")}</div>`)
    .join("");

  const attendanceRows = active
    .map((m) => `<label class="att-row"><input type="checkbox"> ${esc(m.full_name)} <span class="att-role">(${ROLE_LABELS[m.role] || m.role || ""}${m.is_voting === false ? " · non-voting" : ""})</span></label>`)
    .join("");

  const allMemberOpts = ['<option value="">— select —</option>', ...active.map((m) => `<option>${esc(m.full_name)}</option>`)].join("");
  const chairRow = `<div class="frow" style="margin:10px 0 0;"><label class="cap">Minutes recorded by <select class="f">${allMemberOpts}</select></label><label class="cap">Meeting Chair <select class="f">${allMemberOpts}</select></label></div>`;

  const title = meeting?.title || "Board Meeting";
  const dateStr = meeting?.meeting_date ? format(parseDateSmart(meeting.meeting_date), "MMMM d, yyyy 'at' h:mm a") : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${esc(title)} — Fillable Minutes</title>
  <style>
    @page { size: letter portrait; margin: 0.75in; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 11pt; margin: 0; padding: 70px 20px 40px; }
    .toolbar { position: fixed; top: 10px; right: 12px; display: flex; gap: 10px; align-items: center; background: #1e2f4d; color: #fff; padding: 8px 12px; border-radius: 8px; z-index: 10; }
    .toolbar button { background: #f5c116; border: none; padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; }
    .toolbar .hint { font-size: 9pt; color: #dbe4f0; }
    .head { text-align: center; border-bottom: 3px solid #1e2f4d; padding: 8px 0 14px; margin-bottom: 4px; }
    .head img { height: 64px; }
    .head .org { font-size: 12pt; font-weight: bold; color: #1e2f4d; }
    .head h1 { margin: 4px 0 2px; font-size: 15pt; color: #1e2f4d; }
    .head .when { font-size: 10.5pt; color: #333; }
    .head .where { font-size: 10pt; color: #555; }
    .section h2 { font-size: 10.5pt; text-transform: uppercase; letter-spacing: 0.05em; color: #1e2f4d; border-bottom: 1px solid #1e2f4d; padding-bottom: 3px; margin: 20px 0 8px; }
    .item { margin: 14px 0; }
    .item-title { font-weight: bold; margin-bottom: 6px; }
    .presenter { font-weight: normal; font-style: italic; color: #555; font-size: 10pt; }
    .ic-tag { color: #b45309; font-weight: normal; font-size: 9.5pt; }
    .att-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; }
    .att-row { font-size: 10pt; display: flex; align-items: center; gap: 6px; }
    .att-role { color: #666; font-size: 9pt; }
    .att-hint { font-size: 8.5pt; color: #888; margin-top: 6px; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
    .chip { background: #eef1f6; border: 1px solid #cbd5e1; border-radius: 999px; padding: 3px 10px; font-size: 10pt; }
    .chip-x { border: none; background: none; color: #888; cursor: pointer; font-size: 10pt; }
    .f { border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 5px; padding: 6px 8px; font-family: inherit; font-size: 10pt; margin: 4px 0; width: 100%; }
    .f.w80 { width: 85px; }
    textarea.f { resize: vertical; }
    .frow { display: flex; flex-wrap: wrap; gap: 8px 20px; align-items: center; margin: 4px 0; }
    .cap { font-size: 8.5pt; color: #555; display: inline-flex; align-items: center; gap: 5px; }
    .cap .f { width: auto; min-width: 110px; margin: 0; font-size: 9.5pt; padding: 4px 6px; }
    .entry-block { border: 1px dashed #cbd5e1; border-radius: 8px; padding: 10px 12px; margin: 8px 0; }
    .entry-head { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
    .entry-head .type-select { width: 160px; min-width: 160px; }
    .entry-title { font-weight: bold; font-size: 9pt; text-transform: uppercase; color: #555; flex: 1; }
    .et-motion, .et-resolution { color: #2563eb !important; }
    .et-action_item { color: #d97706 !important; }
    .et-in_camera { color: #dc2626 !important; }
    .remove-btn { border: none; background: none; color: #999; cursor: pointer; font-size: 9pt; text-decoration: underline; }
    .add-btn { border: 1px dashed #94a3b8; background: none; color: #1e2f4d; border-radius: 6px; padding: 6px 12px; font-size: 10pt; cursor: pointer; margin-top: 4px; }
    .add-btn:hover { background: #eef1f6; }
    .confidential { font-size: 9pt; color: #dc2626; margin: 4px 0; }
    @media print {
      .no-print { display: none !important; }
      body { padding: 0; }
      select, input, textarea { color: #111; }
    }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <button type="button" onclick="window.print()">Print / Save as PDF</button>
    <span class="hint">Fill in the fields, then print or save as PDF.</span>
  </div>
  <div class="head">
    <img src="${CANDORA_LOGO_URL}" alt="Candora" />
    <div class="org">${esc(org)}</div>
    <h1>${esc(title)} — Minutes</h1>
    <div class="when">${dateStr}</div>
    ${meeting?.location ? `<div class="where">${esc(meeting.location)}</div>` : ""}
  </div>
  ${chairRow}

  <div class="section">
    <h2>Attendance</h2>
    <label class="cap no-print" style="margin-bottom:6px;"><input type="checkbox" id="att-selectall"> Select all</label>
    <div class="att-grid">${attendanceRows}</div>
    <div class="frow" style="margin-top:8px;">
      <label class="cap">Guests <input id="guest-input" class="f" placeholder="Guest name..."></label>
      <button type="button" class="add-btn" onclick="addGuest()">Add guest</button>
    </div>
    <div id="guest-chips" class="chips"></div>
    <div class="att-hint">Unchecked members are recorded as regrets.</div>
  </div>

  ${sectionsHtml}

  <div class="section">
    <h2>Additional Notes</h2>
    <textarea class="f" rows="4"></textarea>
  </div>

  <script>
    var TEMPLATES = ${j(TEMPLATES)};
    var NOTES_TYPES = ['note', 'discussion', 'information', 'dissent', 'abstention'];
    var GROUP_OF = { motion: 'motion', resolution: 'motion', action_item: 'action_item', in_camera: 'in_camera' };

    var attSel = document.getElementById('att-selectall');
    attSel.addEventListener('change', function () {
      var rows = document.querySelectorAll('.att-row input[type=checkbox]');
      for (var i = 0; i < rows.length; i++) rows[i].checked = attSel.checked;
    });

    function addEntry(containerId, allowInCamera, notesOnly) {
      var container = document.getElementById(containerId);
      var block = document.createElement('div');
      block.className = 'entry-block';
      var selHtml = notesOnly
        ? '<option value="note">Note</option>'
        : ('<option value="">— entry type —</option>' +
        '<option value="motion">Motion</option>' +
        '<option value="resolution">Resolution</option>' +
        '<option value="action_item">Action Item</option>' +
        '<option value="note">Note</option>' +
        '<option value="discussion">Discussion</option>' +
        '<option value="information">Information</option>' +
        '<option value="dissent">Dissent</option>' +
        '<option value="abstention">Abstention</option>' +
        (allowInCamera ? '<option value="in_camera">In Camera</option>' : ''));
      block.innerHTML =
        '<div class="entry-head">' +
          '<span class="entry-title">New entry</span>' +
          '<select class="f type-select">' + selHtml + '</select>' +
          '<button type="button" class="remove-btn no-print">Remove</button>' +
        '</div>' +
        '<div class="tf" data-tf="motion" style="display:none">' + TEMPLATES.motion + '</div>' +
        '<div class="tf" data-tf="action_item" style="display:none">' + TEMPLATES.action_item + '</div>' +
        '<div class="tf" data-tf="in_camera" style="display:none">' + TEMPLATES.in_camera + '</div>' +
        '<div class="tf" data-tf="notes" style="display:none">' + TEMPLATES.notes + '</div>';
      container.appendChild(block);

      var sel = block.querySelector('.type-select');
      var head = block.querySelector('.entry-title');
      sel.addEventListener('change', function () {
        var t = sel.value;
        var groups = block.querySelectorAll('.tf');
        for (var i = 0; i < groups.length; i++) groups[i].style.display = 'none';
        var tf = GROUP_OF[t] || (NOTES_TYPES.indexOf(t) >= 0 ? 'notes' : null);
        if (tf) block.querySelector('[data-tf="' + tf + '"]').style.display = '';
        head.textContent = t ? t.replace(/_/g, ' ').toUpperCase() : 'New entry';
        head.className = 'entry-title' + (t ? ' et-' + t : '');
      });
      block.querySelector('.remove-btn').addEventListener('click', function () {
        block.parentNode.removeChild(block);
      });
    }

    function addMotion(containerId) {
      var container = document.getElementById(containerId);
      var block = document.createElement('div');
      block.className = 'entry-block';
      block.innerHTML =
        '<div class="entry-head">' +
          '<span class="entry-title et-motion">MOTION</span>' +
          '<button type="button" class="remove-btn no-print">Remove</button>' +
        '</div>' +
        TEMPLATES.motion;
      container.appendChild(block);
      block.querySelector('.remove-btn').addEventListener('click', function () {
        block.parentNode.removeChild(block);
      });
    }

    function toggleAgendaForm(btn) {
      var form = btn.parentNode.querySelector('.agenda-form');
      form.style.display = form.style.display === 'none' ? '' : 'none';
    }

    function addAgendaItem(btn) {
      var form = btn.parentNode;
      var input = form.querySelector('input');
      var title = input.value.trim();
      if (!title) return;
      var wrap = document.createElement('div');
      wrap.className = 'item';
      var n = (window.__agendaN = (window.__agendaN || 0) + 1);
      var entriesId = 'entries-new-' + n;
      wrap.innerHTML = '<div class="item-title"></div>' +
        '<div class="entries" id="' + entriesId + '"></div>' +
        '<button type="button" class="add-btn" onclick="addEntry(\'' + entriesId + '\', true, false)">+ Add entry</button>';
      wrap.querySelector('.item-title').textContent = title;
      form.closest('.section').appendChild(wrap);
      input.value = '';
      form.style.display = 'none';
    }

    function addGuest() {
      var input = document.getElementById('guest-input');
      var name = input.value.trim();
      if (!name) return;
      var chips = document.getElementById('guest-chips');
      var chip = document.createElement('span');
      chip.className = 'chip';
      chip.appendChild(document.createTextNode(name));
      var x = document.createElement('button');
      x.type = 'button';
      x.className = 'chip-x';
      x.textContent = 'x';
      x.onclick = function () { chips.removeChild(chip); };
      chip.appendChild(x);
      chips.appendChild(chip);
      input.value = '';
    }
  </script>
</body>
</html>`;
}