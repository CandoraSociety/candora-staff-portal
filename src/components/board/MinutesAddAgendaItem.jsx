import { useState } from "react";
import { Plus } from "lucide-react";
import { AGENDA_SECTIONS } from "@/components/board/agendaDocumentHtml";

export default function MinutesAddAgendaItem({ onAdd, defaultSection = "new_business" }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", section: defaultSection, presenter: "", duration_minutes: 5 });

  const submit = (e) => {
    e.preventDefault();
    onAdd({ ...form, title: form.title.trim(), duration_minutes: Number(form.duration_minutes) || 0 });
    setForm({ title: "", section: form.section, presenter: "", duration_minutes: 5 });
    setOpen(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      {!open ? (
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <Plus size={14} /> Add agenda item
        </button>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Add Agenda Item</h3>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:underline">Cancel</button>
          </div>
          <input required autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Item title" className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="border border-input rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none">
              {AGENDA_SECTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <input type="number" min="0" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} placeholder="Minutes" className="border border-input rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none" />
          </div>
          <input value={form.presenter} onChange={(e) => setForm({ ...form, presenter: e.target.value })} placeholder="Presenter (optional)" className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none" />
          <button type="submit" className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 transition">
            <Plus size={13} /> Add Item
          </button>
        </form>
      )}
    </div>
  );
}