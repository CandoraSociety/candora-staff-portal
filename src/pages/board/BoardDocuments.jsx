import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, FolderOpen, FileText, Search, Trash2, ExternalLink } from "lucide-react";
import { format } from "date-fns";

const DOC_TYPES = [
  { value: "all", label: "All Documents" }, { value: "minutes", label: "Minutes" }, { value: "agenda", label: "Agendas" },
  { value: "financial_report", label: "Financial Reports" }, { value: "ed_report", label: "ED Reports" },
  { value: "committee_report", label: "Committee Reports" }, { value: "policy", label: "Policies" },
  { value: "bylaw", label: "Bylaws" }, { value: "strategic_plan", label: "Strategic Plan" },
  { value: "training", label: "Training Resources" }, { value: "corporate_doc", label: "Corporate Documents" }, { value: "other", label: "Other" },
];
const TYPE_ICONS = { minutes: "📋", agenda: "📅", financial_report: "💰", ed_report: "📊", committee_report: "👥", policy: "📜", bylaw: "⚖️", strategic_plan: "🎯", training: "📚", corporate_doc: "🏢", other: "📄" };

export default function BoardDocuments() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: "", document_type: "other", description: "" });

  const load = async () => { const data = await base44.entities.BoardDocument.list("-created_date"); setDocs(data); setLoading(false); };
  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const doc = await base44.entities.BoardDocument.create({ ...uploadForm, file_url, file_name: file.name });
    setDocs(prev => [doc, ...prev]);
    setShowUpload(false);
    setUploadForm({ title: "", document_type: "other", description: "" });
    setUploading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this document?")) return;
    await base44.entities.BoardDocument.delete(id);
    setDocs(prev => prev.filter(d => d.id !== id));
  };

  const filtered = docs.filter(d =>
    (filter === "all" || d.document_type === filter) &&
    (!search || d.title.toLowerCase().includes(search.toLowerCase()) || d.description?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Documents</h1>
          <p className="text-muted-foreground text-sm mt-1">All board documents, reports, and resources</p>
        </div>
        <button onClick={() => setShowUpload(!showUpload)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
          <Upload size={15} /> Upload Document
        </button>
      </div>

      {showUpload && (
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <h3 className="font-semibold mb-4">Upload New Document</h3>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Document Title *</label>
              <input value={uploadForm.title} onChange={e => setUploadForm({...uploadForm, title: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. June 2026 Financial Report" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Document Type</label>
              <select value={uploadForm.document_type} onChange={e => setUploadForm({...uploadForm, document_type: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none">
                {DOC_TYPES.filter(t => t.value !== "all").map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1.5 block">Description (optional)</label>
              <input value={uploadForm.description} onChange={e => setUploadForm({...uploadForm, description: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className={`flex items-center gap-2 cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
              <Upload size={14} /> {uploading ? "Uploading..." : "Choose File & Upload"}
              <input type="file" className="hidden" onChange={handleUpload} disabled={uploading || !uploadForm.title} />
            </label>
            <button onClick={() => setShowUpload(false)} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="w-full border border-input rounded-lg pl-9 pr-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Search documents..." />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {DOC_TYPES.map(type => (
          <button key={type.value} onClick={() => setFilter(type.value)} className={`text-xs px-3 py-1.5 rounded-full border transition ${filter === type.value ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
            {type.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => (
            <div key={doc.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition group">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-2xl">{TYPE_ICONS[doc.document_type] || "📄"}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  {doc.file_url && <a href={doc.file_url} target="_blank" rel="noreferrer" className="p-1.5 text-muted-foreground hover:text-foreground rounded"><ExternalLink size={14} /></a>}
                  <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded"><Trash2 size={14} /></button>
                </div>
              </div>
              <h3 className="font-semibold text-sm text-foreground leading-tight mb-1">{doc.title}</h3>
              {doc.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{doc.description}</p>}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{DOC_TYPES.find(t => t.value === doc.document_type)?.label || doc.document_type}</span>
                <span className="text-xs text-muted-foreground">{format(new Date(doc.created_date), "MMM d, yyyy")}</span>
              </div>
              {doc.file_name && <p className="text-xs text-muted-foreground mt-1 truncate">{doc.file_name}</p>}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-16 text-muted-foreground">
              <FolderOpen size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No documents found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}