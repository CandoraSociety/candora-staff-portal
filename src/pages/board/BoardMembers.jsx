import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Mail, Phone, Trash2, CheckCircle, Circle, User } from "lucide-react";
import { format } from "date-fns";

const ROLES = ["Chair","Vice-Chair","Treasurer","Secretary","Director","ED","Observer"];

export default function BoardMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", role: "Director", phone: "", term_start: "", term_end: "", bio: "", committee: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => { const data = await base44.entities.BoardMember.list(); setMembers(data); setLoading(false); };
  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const saved = await base44.entities.BoardMember.create({ ...form, status: "active" });
    setMembers(prev => [...prev, saved]);
    setForm({ full_name: "", email: "", role: "Director", phone: "", term_start: "", term_end: "", bio: "", committee: "" });
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this board member?")) return;
    await base44.entities.BoardMember.delete(id);
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const toggleStatus = async (member) => {
    const newStatus = member.status === "active" ? "inactive" : "active";
    await base44.entities.BoardMember.update(member.id, { status: newStatus });
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, status: newStatus } : m));
  };

  const active = members.filter(m => m.status === "active");
  const inactive = members.filter(m => m.status !== "active");

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Board Members</h1>
          <p className="text-muted-foreground text-sm mt-1">{active.length} active members</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
          <Plus size={16} /> Add Member
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-card border border-border rounded-xl p-5 mb-6">
          <h3 className="font-semibold mb-4">New Board Member</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium mb-1.5 block">Full Name *</label><input required value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Email *</label><input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Role</label><select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none">{ROLES.map(r => <option key={r}>{r}</option>)}</select></div>
            <div><label className="text-sm font-medium mb-1.5 block">Phone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Term Start</label><input type="date" value={form.term_start} onChange={e => setForm({...form, term_start: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Term End</label><input type="date" value={form.term_end} onChange={e => setForm({...form, term_end: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none" /></div>
            <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Committee</label><input value={form.committee} onChange={e => setForm({...form, committee: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none" placeholder="e.g. Finance, Governance" /></div>
            <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Bio</label><textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows={3} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none resize-none" /></div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-border rounded-lg py-2 text-sm hover:bg-muted transition">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-60">{saving ? "Saving..." : "Add Member"}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-6">
          {[{ label: "Active Members", data: active }, { label: "Inactive / Past Members", data: inactive }].map(({ label, data }) => {
            if (!data.length) return null;
            return (
              <div key={label}>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{label}</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {data.map(member => (
                    <div key={member.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition group">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                            {member.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{member.full_name}</p>
                            <p className="text-xs text-muted-foreground">{member.role}</p>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => toggleStatus(member)} className="p-1.5 text-muted-foreground hover:text-foreground rounded">
                            {member.status === "active" ? <CheckCircle size={14} className="text-green-600" /> : <Circle size={14} />}
                          </button>
                          <button onClick={() => handleDelete(member.id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1">
                        {member.email && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail size={11} />{member.email}</p>}
                        {member.phone && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone size={11} />{member.phone}</p>}
                        {member.committee && <p className="text-xs text-muted-foreground">Committee: {member.committee}</p>}
                        {member.term_end && <p className="text-xs text-muted-foreground">Term ends: {format(new Date(member.term_end), "MMM yyyy")}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {members.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <User size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No board members yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}