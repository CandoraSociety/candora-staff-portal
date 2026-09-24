import { Fragment, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AGENDA_SECTIONS, sectionOf } from "@/components/board/agendaDocumentHtml";
import { useOrgSettings } from "@/lib/useOrgSettings";
import { generateMinutesTemplatePdf } from "@/lib/generateMinutesTemplatePdf";
import MinutesFillableOverlay from "@/components/board/MinutesFillableOverlay";
import MinutesAttendancePanel, { SEED_BOARD_MEMBERS, memberEmail } from "@/components/board/MinutesAttendancePanel";
import MinutesAddAgendaItem from "@/components/board/MinutesAddAgendaItem";

const ENTRY_TYPES = ["note","motion","resolution","action_item","discussion","information","dissent","abstention","in_camera"];
const MOTION_RESULTS = ["","carried","defeated","tabled","withdrawn"];
const EMPTY_FORM = { entry_type: "note", content: "", motion_verbiage: "", moved_by: "", seconded_by: "", motion_result: "", votes_in_favour: "", votes_opposed: "", votes_abstained: "", action_assigned_to: "", action_due_date: "", event_time: "", is_in_camera: false };

// 24h "HH:MM" → readable "h:MM AM/PM" for display
const fmtTime = (t) => {
  const m = String(t || "").match(/^(\d{1,2}):(\d{2})/);
  if (!m) return t || "";
  let h = Number(m[1]);
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m[2]} ${ap}`;
};

// Per-item entry capabilities — each standing agenda item only records what it actually needs
const titleMatch = (item, frag) => (item?.title || "").toLowerCase().includes(frag);
const isCallToOrderItem = (item) => item?.item_type === "call_to_order" || titleMatch(item, "call to order");
const isApprovalOfAgendaItem = (item) => item?.item_type === "approval_of_agenda" || titleMatch(item, "approval of agenda");
const isApprovalOfMinutesItem = (item) => item?.item_type === "approval_of_minutes" || titleMatch(item, "approval of minutes");
const isNextMeetingItem = (item) => titleMatch(item, "date of next meeting");
const isAdjournMotionItem = (item) => titleMatch(item, "motion to adjourn");
const isInvitationItem = (item) => titleMatch(item, "invitation to visit");

function itemEntryCaps(item) {
  if (isInvitationItem(item)) return { none: true };
  if (isAdjournMotionItem(item)) return { typeSelect: false, motion: false, inCamera: false, notes: false, date: false, moverOnly: true, time: true };
  if (isCallToOrderItem(item) || isNextMeetingItem(item)) return { typeSelect: false, motion: false, inCamera: false, notes: true, date: isNextMeetingItem(item), time: isCallToOrderItem(item) };
  if (isApprovalOfAgendaItem(item)) return { typeSelect: false, motion: true, inCamera: false };
  if (isApprovalOfMinutesItem(item)) return { typeSelect: true, motion: true, inCamera: false, typeOptions: ["note"] };
  return { typeSelect: true, motion: true, inCamera: true };
}

const ENTRY_COLORS = {
  motion: "border-l-4 border-l-blue-400 bg-blue-50/40",
  resolution: "border-l-4 border-l-purple-400 bg-purple-50/40",
  action_item: "border-l-4 border-l-amber-400 bg-amber-50/40",
  in_camera: "border-l-4 border-l-red-400 bg-red-50/40",
  note: "",
};

export default function BoardMinutesTaker() {
  const { id } = useParams();
  const { orgName } = useOrgSettings();
  const [meeting, setMeeting] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showFillable, setShowFillable] = useState(false);
  const [agendaItems, setAgendaItems] = useState([]);
  const [entries, setEntries] = useState([]);
  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState({});
  const [activeItemId, setActiveItemId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Meeting.filter({ id }),
      base44.entities.AgendaItem.filter({ meeting_id: id }),
      base44.entities.MinuteEntry.filter({ meeting_id: id }),
      base44.entities.BoardMember.filter({ status: "active" }),
      base44.entities.BoardMinutesAttendance.filter({ meeting_id: id }),
    ]).then(async ([meetings, ai, me, bm, att]) => {
      setMeeting(meetings[0]);
      setAgendaItems(ai.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)));
      setEntries(me.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)));
      let memberList = bm;
      if (bm.length === 0) {
        memberList = await base44.entities.BoardMember.bulkCreate(
          SEED_BOARD_MEMBERS.map((m) => ({ ...m, email: memberEmail(m.full_name), status: "active" }))
        );
      }
      setMembers(memberList.sort((a, b) => (a.full_name || "").localeCompare(b.full_name || "")));
      setAttendance(att[0] || null);
      if (ai.length > 0) { setActiveItemId(ai[0].id); setExpandedItems({ [ai[0].id]: true }); }
      setLoading(false);
    });
  }, [id]);

  const saveAttendance = async (updates) => {
    if (attendance) {
      setAttendance(await base44.entities.BoardMinutesAttendance.update(attendance.id, updates));
    } else {
      setAttendance(await base44.entities.BoardMinutesAttendance.create({ meeting_id: id, present_member_names: [], guest_names: [], ...updates }));
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!activeItemId) return;
    setSaving(true);
    const itemEntries = entries.filter(e => e.agenda_item_id === activeItemId);
    const caps = itemEntryCaps(agendaItems.find(i => i.id === activeItemId));
    const entryType = caps.moverOnly ? "motion" : (!caps.typeSelect ? (caps.motion ? "motion" : "note") : form.entry_type);
    const { entry_type, votes_in_favour, votes_opposed, votes_abstained, ...rest } = form;
    const saved = await base44.entities.MinuteEntry.create({
      ...rest,
      entry_type: entryType,
      votes_in_favour: votes_in_favour === "" ? undefined : votes_in_favour === "all" ? attendeeOptions.length : Number(votes_in_favour),
      votes_opposed: votes_opposed === "" ? undefined : Number(votes_opposed),
      votes_abstained: votes_abstained === "" ? undefined : Number(votes_abstained),
      is_in_camera: entryType === "in_camera",
      meeting_id: id,
      agenda_item_id: activeItemId,
      order_index: itemEntries.length,
    });
    setEntries(prev => [...prev, saved]);
    setForm(EMPTY_FORM);
    setSaving(false);
  };

  const handleAddItem = async (payload) => {
    const saved = await base44.entities.AgendaItem.create({ ...payload, meeting_id: id, order_index: agendaItems.length });
    setAgendaItems((prev) => [...prev, saved]);
    setActiveItemId(saved.id);
    setForm(EMPTY_FORM);
    setExpandedItems((prev) => ({ ...prev, [saved.id]: true }));
  };

  const handleDelete = async (entryId) => {
    await base44.entities.MinuteEntry.delete(entryId);
    setEntries(prev => prev.filter(e => e.id !== entryId));
  };

  const handleDownloadPdf = async (inCameraOnly, completed = false) => {
    setDownloadingPdf(true);
    try {
      if (!inCameraOnly && !completed) {
        // Fillable minutes — an interactive in-app view that mirrors the Minutes Taker form.
        // Opened inside the app (not a popup) because popup documents get their scripts blocked.
        setShowFillable(true);
        return;
      }
      const bytes = await generateMinutesTemplatePdf(meeting, orgName, agendaItems, members, attendance, entries, { inCameraOnly, completed });
      const suffix = inCameraOnly ? "In Camera Minutes (Confidential)" : completed ? "Completed Minutes" : "Minutes";
      const file = new File([bytes], `${meeting?.title || "Board Meeting"} - ${suffix}.pdf`, { type: "application/pdf" });
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      window.open(file_url, "_blank");
    } catch (err) {
      toast.error("Failed to generate minutes PDF", { description: err?.message || "Unknown error" });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const toggleItem = (itemId) => {
    setExpandedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    setActiveItemId(itemId);
    setForm(EMPTY_FORM);
  };

  const isMotion = ["motion","resolution"].includes(form.entry_type);
  const isAction = form.entry_type === "action_item";
  const isCamera = form.entry_type === "in_camera";
  const hasInCamera = agendaItems.some(i => i.is_in_camera) || entries.some(e => e.is_in_camera || e.entry_type === "in_camera");
  const presentNames = attendance?.present_member_names || [];
  const guestNames = attendance?.guest_names || [];
  // Motion/seconding dropdowns list voting attendees only — guests and non-voting members are excluded
  const votingMembers = members.filter(m => m.is_voting !== false);
  const presentVoting = votingMembers.filter(m => presentNames.includes(m.full_name)).map(m => m.full_name);
  const attendeeOptions = presentVoting.length > 0 ? presentVoting : votingMembers.map(m => m.full_name);

  // Group agenda items under their agenda sections, in section order
  const sectionsWithItems = AGENDA_SECTIONS
    .map(({ key, label }) => ({
      key,
      label,
      items: agendaItems
        .filter((i) => sectionOf(i) === key)
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
    }))
    .filter((s) => s.items.length > 0);

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Link to="/board/meetings" className="text-muted-foreground hover:text-foreground"><ArrowLeft size={18} /></Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading text-2xl font-semibold">Minutes Taker</h1>
          {meeting && <p className="text-muted-foreground text-sm">{meeting.title} · {format(new Date(meeting.meeting_date), "MMMM d, yyyy")}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleDownloadPdf(false, true)}
            disabled={downloadingPdf}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 transition disabled:opacity-50 shrink-0"
          >
            {downloadingPdf ? "Generating..." : "Download Completed Minutes"}
          </button>
          <button
            onClick={() => handleDownloadPdf(false)}
            disabled={downloadingPdf}
            className="flex items-center gap-1.5 border border-border text-foreground px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-muted transition disabled:opacity-50 shrink-0"
          >
            {downloadingPdf ? "Generating..." : "Download Fillable Minutes"}
          </button>
          {hasInCamera && (
            <button
              onClick={() => handleDownloadPdf(true)}
              disabled={downloadingPdf}
              className="flex items-center gap-1.5 border border-red-300 text-red-700 bg-red-50 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-100 transition disabled:opacity-50 shrink-0"
            >
              {downloadingPdf ? "Generating..." : "Download In-Camera Minutes"}
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <MinutesAttendancePanel
          members={members}
          presentNames={presentNames}
          guestNames={guestNames}
          onToggleMember={(name, present) => saveAttendance({ present_member_names: present ? [...presentNames, name] : presentNames.filter(n => n !== name) })}
          onAddGuest={(name) => saveAttendance({ guest_names: [...guestNames, name] })}
          onRemoveGuest={(name) => saveAttendance({ guest_names: guestNames.filter(n => n !== name) })}
          onSelectAll={(names) => saveAttendance({ present_member_names: names })}
          onMemberAdded={(m) => {
            setMembers(prev => [...prev, m].sort((a, b) => (a.full_name || "").localeCompare(b.full_name || "")));
            saveAttendance({ present_member_names: [...presentNames, m.full_name] });
          }}
        />
        {sectionsWithItems.map(({ key, label, items }) => (
          <div key={key} className="space-y-3">
            <div className="flex items-center gap-3 pt-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</h2>
              <div className="h-px bg-border flex-1" />
            </div>
            {items.map((item, idx) => {
              const itemEntries = entries.filter(e => e.agenda_item_id === item.id);
              const expanded = expandedItems[item.id];
              const isActive = activeItemId === item.id;
              const caps = itemEntryCaps(item);
              return (
                <Fragment key={item.id}>
                <div className={`bg-card border rounded-xl overflow-hidden transition ${isActive ? "border-primary/40 shadow-sm" : "border-border"}`}>
                  <button onClick={() => toggleItem(item.id)} className="w-full flex items-center gap-3 p-4 hover:bg-muted/40 transition text-left">
                    <span className="text-xs font-semibold text-muted-foreground w-5">{idx + 1}.</span>
                    <span className="flex-1 text-sm font-medium text-foreground">
                      {item.title}
                      {item.is_in_camera && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium align-middle">In Camera</span>}
                    </span>
                    <span className="text-xs text-muted-foreground">{itemEntries.length} entries</span>
                    {expanded ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
                  </button>
                  {expanded && (
                    <div className="border-t border-border p-4 space-y-3">
                      {itemEntries.map(entry => (
                        <div key={entry.id} className={`p-3 rounded-lg bg-background border border-border group ${ENTRY_COLORS[entry.entry_type] || ""}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-semibold text-muted-foreground uppercase">{entry.entry_type?.replace(/_/g, " ")}</span>
                              {entry.motion_verbiage && <p className="text-sm font-medium mt-1 italic">"{entry.motion_verbiage}"</p>}
                              {entry.content && <p className="text-sm text-foreground mt-1">{entry.content}</p>}
                              <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                                {entry.moved_by && <span>Moved: {entry.moved_by}</span>}
                                {entry.seconded_by && <span>Seconded: {entry.seconded_by}</span>}
                                {entry.motion_result && <span className={`font-medium ${entry.motion_result === "carried" ? "text-green-600" : entry.motion_result === "defeated" ? "text-red-600" : "text-amber-600"}`}>{entry.motion_result}</span>}
                                {(entry.votes_in_favour != null || entry.votes_opposed != null || entry.votes_abstained != null) && (
                                  <span>In favour: {entry.votes_in_favour ?? 0} · Opposed: {entry.votes_opposed ?? 0} · Abstained: {entry.votes_abstained ?? 0}</span>
                                )}
                                {entry.event_time && <span>{isAdjournMotionItem(item) ? "Adjourned" : "Time"}: {fmtTime(entry.event_time)}</span>}
                                {entry.action_assigned_to && <span>Assigned: {entry.action_assigned_to}</span>}
                                {entry.action_due_date && <span>{isNextMeetingItem(item) ? "Next meeting" : "Due"}: {format(new Date(entry.action_due_date), "MMM d, yyyy")}</span>}
                              </div>
                            </div>
                            <button onClick={() => handleDelete(entry.id)} className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive shrink-0"><Trash2 size={13} /></button>
                          </div>
                        </div>
                      ))}

                      {!caps.none && (
                      <form onSubmit={handleAddEntry} className="bg-muted/40 rounded-xl p-4 space-y-3 border border-dashed border-border">
                        <div className="flex items-center gap-2 flex-wrap">
                          {caps.typeSelect && (
                            <select value={form.entry_type} onChange={e => setForm({...form, entry_type: e.target.value})} className="border border-input rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none">
                              {(caps.typeOptions || ENTRY_TYPES).map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                            </select>
                          )}
                          {caps.motion && (
                            <button
                              type="button"
                              onClick={() => setForm({...form, entry_type: "motion"})}
                              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition shrink-0 ${isMotion ? "bg-blue-500 text-white border-blue-500" : "border-border text-foreground hover:border-blue-400"}`}
                            >
                              + Motion
                            </button>
                          )}
                          {caps.inCamera && (
                            <button
                              type="button"
                              onClick={() => setForm({...form, entry_type: "in_camera"})}
                              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition shrink-0 ${isCamera ? "bg-red-500 text-white border-red-500" : "border-border text-foreground hover:border-red-400"}`}
                            >
                              + In Camera
                            </button>
                          )}
                          <span className="text-xs text-muted-foreground">for "{item.title}"</span>
                          {isCamera && caps.inCamera && <span className="text-[11px] text-red-600">Confidential — goes in the separate In-Camera Minutes for the Board Chair, not the regular minutes.</span>}
                        </div>
                        {isMotion && !caps.moverOnly && (
                          <input value={form.motion_verbiage} onChange={e => setForm({...form, motion_verbiage: e.target.value})} placeholder="Motion verbiage (e.g. Be it resolved that...)" className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none" />
                        )}
                        {caps.time && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{isAdjournMotionItem(item) ? "Adjourned at:" : "Called to order:"}</span>
                            <input type="time" value={form.event_time} onChange={e => setForm({...form, event_time: e.target.value})} className="border border-input rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none" />
                          </div>
                        )}
                        {caps.notes && (
                          <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="Notes / details..." rows={2} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none resize-none" />
                        )}
                        {caps.date && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Next meeting date:</span>
                            <input type="date" value={form.action_due_date} onChange={e => setForm({...form, action_due_date: e.target.value})} className="border border-input rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none" />
                          </div>
                        )}
                        {(isMotion || caps.moverOnly) && (
                          <div className={caps.moverOnly ? "flex items-center gap-2" : "grid grid-cols-3 gap-2"}>
                            <select value={form.moved_by} onChange={e => setForm({...form, moved_by: e.target.value})} className="border border-input rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none">
                              <option value="">— moved by —</option>
                              {attendeeOptions.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                            {!caps.moverOnly && (
                              <select value={form.seconded_by} onChange={e => setForm({...form, seconded_by: e.target.value})} className="border border-input rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none">
                                <option value="">— seconded by —</option>
                                {attendeeOptions.map(n => <option key={n} value={n}>{n}</option>)}
                              </select>
                            )}
                            {!caps.moverOnly && (
                              <select value={form.motion_result} onChange={e => setForm({...form, motion_result: e.target.value})} className="border border-input rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none">
                                {MOTION_RESULTS.map(r => <option key={r} value={r}>{r || "— result —"}</option>)}
                              </select>
                            )}
                          </div>
                        )}
                        {isMotion && !caps.moverOnly && (
                          <div className="grid grid-cols-3 gap-2">
                            <select value={form.votes_in_favour} onChange={e => setForm({...form, votes_in_favour: e.target.value})} className="border border-input rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none">
                              <option value="">— in favour —</option>
                              <option value="all">All present</option>
                              {Array.from({ length: 13 }, (_, n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                            <select value={form.votes_opposed} onChange={e => setForm({...form, votes_opposed: e.target.value})} className="border border-input rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none">
                              <option value="">— opposed —</option>
                              {Array.from({ length: 13 }, (_, n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                            <select value={form.votes_abstained} onChange={e => setForm({...form, votes_abstained: e.target.value})} className="border border-input rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none">
                              <option value="">— abstained —</option>
                              {Array.from({ length: 13 }, (_, n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                        )}
                        {caps.typeSelect && isAction && (
                          <div className="grid grid-cols-2 gap-2">
                            <input value={form.action_assigned_to} onChange={e => setForm({...form, action_assigned_to: e.target.value})} placeholder="Assigned to" className="border border-input rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none" />
                            <input type="date" value={form.action_due_date} onChange={e => setForm({...form, action_due_date: e.target.value})} className="border border-input rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none" />
                          </div>
                        )}
                        <button type="submit" disabled={saving || (caps.moverOnly ? !form.moved_by : (!form.content && !form.motion_verbiage && !(caps.date && form.action_due_date) && !(caps.time && form.event_time)))} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 transition disabled:opacity-50">
                          <Plus size={13} /> Add Entry
                        </button>
                      </form>
                      )}
                    </div>
                  )}
                </div>
                {isApprovalOfAgendaItem(item) && <MinutesAddAgendaItem defaultSection={key} onAdd={handleAddItem} />}
                </Fragment>
              );
            })}
          </div>
        ))}
        {agendaItems.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No agenda items found. <Link to={`/board/meetings/${id}/agenda`} className="text-primary hover:underline">Build the agenda first</Link> — or add one below.</p>
          </div>
        )}

        {/* Add agenda item mid-meeting — shown in the Approval of Agenda section when it exists, otherwise here */}
        {!sectionsWithItems.some(s => s.items.some(isApprovalOfAgendaItem)) && (
          <MinutesAddAgendaItem onAdd={handleAddItem} />
        )}
      </div>

      {showFillable && (
        <MinutesFillableOverlay
          meeting={meeting}
          orgName={orgName}
          items={agendaItems}
          members={members}
          onClose={() => setShowFillable(false)}
        />
      )}
    </div>
  );
}