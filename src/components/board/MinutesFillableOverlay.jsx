import { useEffect, useRef, useState } from "react";
import { FileCheck, Link2, Printer, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { parseDateSmart } from "@/lib/dateUtils";
import { AGENDA_SECTIONS, sectionOf, CANDORA_LOGO_URL } from "@/components/board/agendaDocumentHtml";
import MinutesFinalDoc from "@/components/board/MinutesFinalDoc";

const ROLE_LABELS = { ED: "Executive Director", "Vice-Chair": "Vice Chair" };
const NOTES_TYPES = ["note", "discussion", "information", "dissent", "abstention"];
const MOTION_RESULTS = ["Carried", "Defeated", "Tabled", "Withdrawn"];
const GENERIC_TYPES = ["note", "motion", "resolution", "action_item", "discussion", "information", "dissent", "abstention", "in_camera"];

const titleMatch = (item, frag) => (item?.title || "").toLowerCase().includes(frag);
const isCallToOrderItem = (i) => i?.item_type === "call_to_order" || titleMatch(i, "call to order");
const isApprovalOfAgendaItem = (i) => i?.item_type === "approval_of_agenda" || titleMatch(i, "approval of agenda");
const isApprovalOfMinutesItem = (i) => i?.item_type === "approval_of_minutes" || titleMatch(i, "approval of minutes");
const isNextMeetingItem = (i) => titleMatch(i, "date of next meeting");
const isAdjournMotionItem = (i) => titleMatch(i, "motion to adjourn");
const isInvitationItem = (i) => titleMatch(i, "invitation to visit");

const FIELD = "border border-slate-300 bg-slate-50 rounded-md px-2.5 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-slate-400";
const CAP = "text-[11px] text-slate-600 inline-flex items-center gap-1.5";
const SECTION_TITLE = "text-[11px] font-bold uppercase tracking-wider text-[#1e2f4d] border-b border-[#1e2f4d] pb-1 mb-3";
const ADD_BTN = "border border-dashed border-slate-400 text-[#1e2f4d] rounded-md px-3 py-1.5 text-sm hover:bg-slate-50 transition";

const EMPTY_ENTRY = { id: "", type: "", motion_verbiage: "", content: "", moved_by: "", seconded_by: "", motion_result: "", votes_in_favour: "", votes_opposed: "", votes_abstained: "", action_assigned_to: "", action_due_date: "" };

function EntryBlock({ entry, types, fixedType, voterNames, onPatch, onRemove, minimalMotion }) {
  const isMotion = ["motion", "resolution"].includes(entry.type);
  const isAction = entry.type === "action_item";
  const isCamera = entry.type === "in_camera";
  const isNotes = NOTES_TYPES.includes(entry.type);
  const voteOpts = Array.from({ length: 13 }, (_, n) => <option key={n}>{n}</option>);
  return (
    <div className="border border-dashed border-slate-300 rounded-lg p-3 my-2">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="flex-1 text-[11px] font-bold uppercase text-slate-500">{(entry.type || "New entry").replace(/_/g, " ")}</span>
        {!fixedType && (
          <select value={entry.type} onChange={(e) => onPatch({ type: e.target.value })} className={`${FIELD} w-44`}>
            <option value="">— entry type —</option>
            {types.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
          </select>
        )}
        <button type="button" onClick={onRemove} className="text-[11px] text-slate-400 hover:text-red-600 underline">Remove</button>
      </div>
      {isMotion && !minimalMotion && (
        <input className={`${FIELD} w-full mt-2`} placeholder="Motion verbiage (e.g. Be it resolved that...)" value={entry.motion_verbiage || ""} onChange={(e) => onPatch({ motion_verbiage: e.target.value })} />
      )}
      {isMotion && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
          <label className={CAP}>Moved by
            <select className={FIELD} value={entry.moved_by || ""} onChange={(e) => onPatch({ moved_by: e.target.value })}>
              <option value="">— select —</option>
              {voterNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className={CAP}>Seconded by
            <select className={FIELD} value={entry.seconded_by || ""} onChange={(e) => onPatch({ seconded_by: e.target.value })}>
              <option value="">— select —</option>
              {voterNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className={CAP}>Result
            <select className={FIELD} value={entry.motion_result || ""} onChange={(e) => onPatch({ motion_result: e.target.value })}>
              <option value="">—</option>
              {MOTION_RESULTS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
        </div>
      )}
      {isMotion && !minimalMotion && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-1">
          <label className={CAP}>In favour
            <select className={FIELD} value={entry.votes_in_favour || ""} onChange={(e) => onPatch({ votes_in_favour: e.target.value })}>
              <option value="">—</option>
              <option>All present</option>
              {voteOpts}
            </select>
          </label>
          <label className={CAP}>Opposed
            <select className={FIELD} value={entry.votes_opposed || ""} onChange={(e) => onPatch({ votes_opposed: e.target.value })}>
              <option value="">—</option>
              {voteOpts}
            </select>
          </label>
          <label className={CAP}>Abstained
            <select className={FIELD} value={entry.votes_abstained || ""} onChange={(e) => onPatch({ votes_abstained: e.target.value })}>
              <option value="">—</option>
              {voteOpts}
            </select>
          </label>
        </div>
      )}
      {isAction && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
          <label className={CAP}>Action assigned to
            <input className={FIELD} placeholder="Name" value={entry.action_assigned_to || ""} onChange={(e) => onPatch({ action_assigned_to: e.target.value })} />
          </label>
          <label className={CAP}>Due date
            <input type="date" className={FIELD} value={entry.action_due_date || ""} onChange={(e) => onPatch({ action_due_date: e.target.value })} />
          </label>
        </div>
      )}
      {isCamera && (
        <p className="text-xs text-red-600 mt-2">Confidential — goes in the separate In-Camera Minutes for the Board Chair, not the regular minutes.</p>
      )}
      {(isMotion || isAction || isCamera || isNotes) && (
        <textarea className={`${FIELD} w-full mt-2`} rows={3} placeholder="Notes / discussion..." value={entry.content || ""} onChange={(e) => onPatch({ content: e.target.value })} />
      )}
    </div>
  );
}

export default function MinutesFillableOverlay({ meeting, orgName, items, members, onClose }) {
  const org = orgName || "Candora Society of Edmonton";
  const active = (members || []).filter((m) => m.status !== "inactive");
  const voting = active.filter((m) => m.is_voting !== false);
  const voterNames = voting.map((m) => m.full_name);
  const allNames = active.map((m) => m.full_name);

  useEffect(() => {
    document.body.classList.add("fillable-printing");
    return () => document.body.classList.remove("fillable-printing");
  }, []);

  const uidRef = useRef(0);
  const uid = () => `e${++uidRef.current}`;

  const [present, setPresent] = useState([]);
  const [guests, setGuests] = useState([]);
  const [guestInput, setGuestInput] = useState("");
  const [recorder, setRecorder] = useState("");
  const [chair, setChair] = useState("");
  const [entries, setEntries] = useState({});
  const [newItems, setNewItems] = useState([]);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemSection, setNewItemSection] = useState("new_business");
  const [showItemForm, setShowItemForm] = useState(false);
  const [adjournBy, setAdjournBy] = useState("");
  const [adjournTime, setAdjournTime] = useState("");
  const [callTime, setCallTime] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [nextNotes, setNextNotes] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [agendaApproved, setAgendaApproved] = useState(false);
  const [showFinal, setShowFinal] = useState(false);

  const allPresent = active.length > 0 && active.every((m) => present.includes(m.full_name));

  const addEntryTo = (containerId, type = "") =>
    setEntries((prev) => ({ ...prev, [containerId]: [...(prev[containerId] || []), { ...EMPTY_ENTRY, id: uid(), type }] }));
  const patchEntry = (containerId, entryId, patch) =>
    setEntries((prev) => ({ ...prev, [containerId]: (prev[containerId] || []).map((e) => (e.id === entryId ? { ...e, ...patch } : e)) }));
  const removeEntry = (containerId, entryId) =>
    setEntries((prev) => ({ ...prev, [containerId]: (prev[containerId] || []).filter((e) => e.id !== entryId) }));

  const copyLink = () => {
    const url = `${window.location.origin}/fillable-minutes/${meeting?.id}`;
    navigator.clipboard.writeText(url).then(() => toast.success("Link copied — anyone with the link can open and fill in the minutes, no login needed."));
  };

  const addNewItem = (sectionKey) => {
    const title = newItemTitle.trim();
    if (!title) return;
    setNewItems((prev) => [...prev, { id: `new-${uid()}`, sectionKey, title }]);
    setNewItemTitle("");
    setShowItemForm(false);
  };

  const sections = AGENDA_SECTIONS
    .map(({ key, label }) => ({
      key, label,
      items: [
        ...(items || []).filter((i) => sectionOf(i) === key).sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
        ...newItems.filter((n) => n.sectionKey === key),
      ],
    }))
    .filter((s) => s.items.length > 0);

  const dateStr = meeting?.meeting_date ? format(parseDateSmart(meeting.meeting_date), "MMMM d, yyyy 'at' h:mm a") : "";

  const renderItemBody = (item, section) => {
    if (isInvitationItem(item)) return null;
    if (isAdjournMotionItem(item)) {
      return (
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
          <label className={CAP}>Moved to adjourn by
            <select className={FIELD} value={adjournBy} onChange={(e) => setAdjournBy(e.target.value)}>
              <option value="">— select —</option>
              {voterNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className={CAP}>Adjourned at
            <input type="time" className={FIELD} value={adjournTime} onChange={(e) => setAdjournTime(e.target.value)} />
          </label>
        </div>
      );
    }
    if (isCallToOrderItem(item)) {
      return (
        <div className="mt-2">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <label className={CAP}>Called to order
              <input type="time" className={FIELD} value={callTime} onChange={(e) => setCallTime(e.target.value)} />
            </label>
          </div>
          <textarea className={`${FIELD} w-full mt-2`} rows={2} placeholder="Notes..." value={callNotes} onChange={(e) => setCallNotes(e.target.value)} />
        </div>
      );
    }
    if (isNextMeetingItem(item)) {
      return (
        <div className="mt-2">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <label className={CAP}>Next meeting date
              <input type="date" className={FIELD} value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
            </label>
          </div>
          <textarea className={`${FIELD} w-full mt-2`} rows={2} placeholder="Notes..." value={nextNotes} onChange={(e) => setNextNotes(e.target.value)} />
        </div>
      );
    }
    if (isApprovalOfAgendaItem(item)) {
      return (
        <div>
          <label className="flex items-center gap-2 text-sm mt-1">
            <input type="checkbox" checked={agendaApproved} onChange={(e) => setAgendaApproved(e.target.checked)} />
            Agenda approved as presented
          </label>
          <div className="flex items-center gap-2 flex-wrap mt-2">
            <button type="button" onClick={() => { setNewItemSection(section.key); setShowItemForm((v) => !v); }} className={ADD_BTN}>+ Add agenda item</button>
          </div>
          {showItemForm && (
            <div className="flex gap-2 mt-2 flex-wrap">
              <input className={`${FIELD} flex-1 min-w-[220px]`} placeholder="New agenda item title" value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)} />
              <select className={FIELD} value={newItemSection} onChange={(e) => setNewItemSection(e.target.value)}>
                {AGENDA_SECTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <button type="button" onClick={() => addNewItem(newItemSection)} className="bg-[#1e2f4d] text-white rounded-md px-3 py-1.5 text-sm">Add</button>
            </div>
          )}
        </div>
      );
    }
    const cid = item.id;
    const types = isApprovalOfMinutesItem(item) ? ["note"] : GENERIC_TYPES;
    return (
      <div>
        {(entries[cid] || []).map((e) => (
          <EntryBlock key={e.id} entry={e} types={types} voterNames={voterNames} minimalMotion={isApprovalOfMinutesItem(item)} onPatch={(p) => patchEntry(cid, e.id, p)} onRemove={() => removeEntry(cid, e.id)} />
        ))}
        {isApprovalOfMinutesItem(item) && (
          <button type="button" onClick={() => addEntryTo(cid, "motion")} className={`${ADD_BTN} mr-2`}>+ Motion</button>
        )}
        <button type="button" onClick={() => addEntryTo(cid)} className={ADD_BTN}>+ Add entry</button>
      </div>
    );
  };

  if (showFinal) {
    return (
      <MinutesFinalDoc
        meeting={meeting}
        org={org}
        sections={sections}
        members={active}
        present={present}
        guests={guests}
        recorder={recorder}
        chair={chair}
        entries={entries}
        data={{ callTime, callNotes, adjournBy, adjournTime, nextDate, nextNotes, additionalNotes, agendaApproved }}
        onBack={() => setShowFinal(false)}
      />
    );
  }

  return (
    <div className="fillable-minutes-overlay fixed inset-0 z-[100] overflow-auto bg-slate-200">
      <div className="fillable-page max-w-[830px] mx-auto bg-white my-6 px-10 py-8 shadow-xl">
        <div className="no-print sticky top-0 z-10 flex items-center gap-3 -mx-4 px-4 py-2 bg-[#1e2f4d] rounded-lg text-white mb-4">
          <button type="button" onClick={() => setShowFinal(true)} title="Produce the final minutes with only the filled-in information" className="flex items-center gap-1.5 bg-white/10 border border-white/30 text-white font-bold px-3 py-1.5 rounded-md text-sm hover:bg-white/20">
            <FileCheck size={14} /> Generate Final PDF
          </button>
          <button type="button" onClick={copyLink} title="Copy a direct link to this fillable minutes form" className="flex items-center gap-1.5 bg-white/10 border border-white/30 text-white px-3 py-1.5 rounded-md text-sm hover:bg-white/20">
            <Link2 size={14} /> Copy link
          </button>
          <span className="text-xs text-slate-200">Fill in the fields, then generate the final PDF.</span>
          <button type="button" onClick={onClose} className="ml-auto flex items-center gap-1 text-sm text-slate-300 hover:text-white">
            <X size={14} /> Close
          </button>
        </div>

        <div className="text-center border-b-[3px] border-[#1e2f4d] pb-3">
          <img src={CANDORA_LOGO_URL} alt="Candora" className="h-16 mx-auto" />
          <div className="font-bold text-[#1e2f4d] mt-1">{org}</div>
          <h1 className="text-xl font-bold text-[#1e2f4d] mt-1">{meeting?.title || "Board Meeting"} — Minutes</h1>
          <div className="text-sm text-slate-700">{dateStr}</div>
          {meeting?.location && <div className="text-xs text-slate-500">{meeting.location}</div>}
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-2 mt-3">
          <label className={CAP}>Minutes recorded by
            <select className={FIELD} value={recorder} onChange={(e) => setRecorder(e.target.value)}>
              <option value="">— select —</option>
              {allNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className={CAP}>Meeting Chair
            <select className={FIELD} value={chair} onChange={(e) => setChair(e.target.value)}>
              <option value="">— select —</option>
              {allNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-5">
          <h2 className={SECTION_TITLE}>Attendance</h2>
          <div className="flex items-center justify-between">
            <label className="no-print flex items-center gap-1.5 text-xs text-slate-600">
              <input type="checkbox" checked={allPresent} onChange={() => setPresent(allPresent ? [] : active.map((m) => m.full_name))} /> Select all
            </label>
            <span className="text-xs text-slate-500">{present.length + guests.length} present</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-1 mt-2">
            {active.map((m) => (
              <label key={m.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={present.includes(m.full_name)}
                  onChange={() => setPresent((prev) => prev.includes(m.full_name) ? prev.filter((n) => n !== m.full_name) : [...prev, m.full_name])}
                />
                <span>{m.full_name}</span>
                <span className="text-[10px] text-slate-500">({ROLE_LABELS[m.role] || m.role || ""}{m.is_voting === false ? " · non-voting" : ""})</span>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <label className={CAP}>Guests
              <input className={FIELD} placeholder="Guest name..." value={guestInput} onChange={(e) => setGuestInput(e.target.value)} />
            </label>
            <button type="button" onClick={() => { const name = guestInput.trim(); if (!name) return; setGuests((prev) => [...prev, name]); setGuestInput(""); }} className={ADD_BTN}>Add guest</button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {guests.map((g) => (
              <span key={g} className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-300 rounded-full px-3 py-1 text-sm">
                {g}
                <button type="button" onClick={() => setGuests((prev) => prev.filter((n) => n !== g))} className="text-slate-400 hover:text-red-600"><X size={12} /></button>
              </span>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Unchecked members are recorded as regrets.</p>
        </div>

        {sections.map(({ key, label, items: sectionItems }) => (
          <div key={key} className="mt-6">
            <h2 className={SECTION_TITLE}>{label}</h2>
            {sectionItems.map((item, idx) => (
              <div key={item.id} className="my-4">
                <div className="font-bold text-sm">
                  {idx + 1}. {item.title}
                  {item.is_in_camera && <span className="ml-2 text-amber-700 font-normal text-xs">(In Camera)</span>}
                  {item.presenter && <span className="ml-2 font-normal italic text-slate-500 text-xs">— {item.presenter}</span>}
                  {String(item.id).startsWith("new-") && (
                    <button type="button" onClick={() => setNewItems((prev) => prev.filter((n) => n.id !== item.id))} className="ml-2 text-[11px] font-normal text-slate-400 hover:text-red-600 underline">Remove</button>
                  )}
                </div>
                {renderItemBody(item, { key })}
              </div>
            ))}
          </div>
        ))}

        <div className="mt-8">
          <h2 className={SECTION_TITLE}>Additional Notes</h2>
          <textarea className={`${FIELD} w-full`} rows={4} value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} />
        </div>
      </div>
    </div>
  );
}