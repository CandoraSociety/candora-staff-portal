import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, BookOpen, CheckCircle, Circle, Trash2, ExternalLink, Upload } from "lucide-react";

const CATEGORIES = ["governance","financial_oversight","legal_compliance","strategic_planning","board_culture","nonprofit_law","orientation","other"];
const RESOURCE_TYPES = ["document","video","link","policy","checklist"];

export default function BoardOnboarding() {
  const [resources, setResources] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("resources");
  const [form, setForm] = useState({ title: "", category: "orientation", resource_type: "document", description: "", external_url: "", is_required: false });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.TrainingResource.list("order_index"),
      base44.entities.BoardMember.filter({ status: "active" }),
    ]).then(([r, m]) => { setResources(r); setMembers(m); setLoading(false); });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const saved = await base44.entities.TrainingResource.create({ ...form, order_index: resources.length });
    setResources(prev => [...prev, saved]);
    setForm({ title: "", category: "orientation", resource_type: "document", description: "", external_url: "", is_required: false });
    setShowForm(false);
    setSaving(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, file_url }));
    setUploading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this resource?")) return;
    await base44.entities.TrainingResource.delete(id);
    setResources(prev => prev.filter(r => r.id !== id));
  };

  const grouped = resources.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  const requiredCount = resources.filter(r => r.is_required).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Board Onboarding</h1>
          <p className="text-muted-foreground text-sm mt-1">{resources.length} resources • {requiredCount} required</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
          <Plus size={16} /> Add Resource
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {["resources", "members"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"}`}>
            {tab === "resources" ? "Training Resources" : "Member Progress"}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-card border border-border rounded-xl p-5 mb-6">
          <h3 className="font-semibold mb-4">Add Training Resource</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium mb-1.5 block">Title *</label><input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Category</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none">{CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}</select></div>
            <div><label className="text-sm font-medium mb-1.5 block">Resource Type</label><select value={form.resource_type} onChange={e => setForm({...form, resource_type: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none">{RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="text-sm font-medium mb-1.5 block">External URL</label><input value={form.external_url} onChange={e => setForm({...form, external_url: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none" placeholder="https://" /></div>
            <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none resize-none" /></div>
            <div className="sm:col-span-2 flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_required} onChange={e => setForm({...form, is_required: e.target.checked})} className="w-4 h-4" />
                Required for all new board members
              </label>
              <label className={`flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-lg transition ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
                <Upload size={13} /> {uploading ? "Uploading..." : "Upload File"}
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
              {form.file_url && <span className="text-xs text-green-600">✓ File uploaded</span>}
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-border rounded-lg py-2 text-sm hover:bg-muted transition">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-60">{saving ? "Saving..." : "Add Resource"}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>
      ) : activeTab === "resources" ? (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 capitalize">{category.replace(/_/g, " ")}</h2>
              <div className="space-y-2">
                {items.map(resource => (
                  <div key={resource.id} className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-4 group hover:shadow-sm transition">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-lg shrink-0">{resource.resource_type === "video" ? "🎥" : resource.resource_type === "link" ? "🔗" : resource.resource_type === "checklist" ? "✅" : resource.resource_type === "policy" ? "📜" : "📄"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground">{resource.title}</p>
                          {resource.is_required && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Required</span>}
                        </div>
                        {resource.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{resource.description}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                      {(resource.external_url || resource.file_url) && (
                        <a href={resource.external_url || resource.file_url} target="_blank" rel="noreferrer" className="p-1.5 text-muted-foreground hover:text-foreground rounded"><ExternalLink size={14} /></a>
                      )}
                      <button onClick={() => handleDelete(resource.id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {resources.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No training resources yet</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {members.map(member => (
            <div key={member.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                  {member.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{member.full_name}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {member.onboarding_complete
                  ? <span className="flex items-center gap-1.5 text-xs text-green-600"><CheckCircle size={14} /> Complete</span>
                  : <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Circle size={14} /> Pending</span>
                }
              </div>
            </div>
          ))}
          {members.length === 0 && <p className="text-center py-12 text-muted-foreground text-sm">No active board members found.</p>}
        </div>
      )}
    </div>
  );
}