import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";

const MEETING_TYPES = ["Regular Board Meeting","Special Meeting","AGM","In Camera","Committee Meeting"];

export default function BoardNewMeetingModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    title: "",
    meeting_date: "",
    location: "",
    meeting_type: "Regular Board Meeting",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const saved = await base44.entities.Meeting.create({ ...form, status: "upcoming" });
    onSaved(saved);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-heading font-semibold text-lg">Schedule New Meeting</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Meeting Title *</label>
            <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. July 2026 Regular Board Meeting" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Date & Time *</label>
            <input required type="datetime-local" value={form.meeting_date} onChange={e => setForm({...form, meeting_date: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Meeting Type</label>
            <select value={form.meeting_type} onChange={e => setForm({...form, meeting_type: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none">
              {MEETING_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Location / Video Link</label>
            <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none" placeholder="e.g. Boardroom or Zoom link" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-border rounded-lg py-2 text-sm hover:bg-muted transition">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-60">{saving ? "Scheduling..." : "Schedule Meeting"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}