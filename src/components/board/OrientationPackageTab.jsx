import { useEffect, useState } from "react";
import JSZip from "jszip";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Archive, Download, FileText, Link2, PackageOpen, Plus, RotateCcw, Trash2, Upload } from "lucide-react";

const EMPTY_FORM = { title: "", description: "" };

// Board Orientation Package — documents given to new board members. Documents can
// be added, removed, or parked (set aside for later, excluded from the package);
// the active set can be downloaded or shared as a single ZIP.
export default function OrientationPackageTab() {
  const [docs, setDocs] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [packaging, setPackaging] = useState(null); // "download" | "share" while building the ZIP

  useEffect(() => {
    base44.entities.BoardOrientationDoc.list("order_index").then(setDocs);
  }, []);

  const active = (docs || []).filter((d) => d.status !== "parked");
  const parked = (docs || []).filter((d) => d.status === "parked");

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!pendingFile) return;
    setSaving(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: pendingFile });
      const saved = await base44.entities.BoardOrientationDoc.create({
        ...form,
        file_url,
        file_name: pendingFile.name,
        status: "active",
        order_index: (docs || []).length,
      });
      setDocs((prev) => [...(prev || []), saved]);
      setForm(EMPTY_FORM);
      setPendingFile(null);
      setShowForm(false);
    } catch (err) {
      toast.error("Could not add the document", { description: err?.message || "Unknown error" });
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (doc, status) => {
    const updated = await base44.entities.BoardOrientationDoc.update(doc.id, { status });
    setDocs((prev) => prev.map((d) => (d.id === doc.id ? updated : d)));
  };

  const handleDelete = async (doc) => {
    if (!confirm(`Remove "${doc.title}" from the package?`)) return;
    await base44.entities.BoardOrientationDoc.delete(doc.id);
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
  };

  // Builds the ZIP from the active documents (fetched from storage)
  const buildZip = async () => {
    const zip = new JSZip();
    for (const d of active) {
      try {
        const res = await fetch(d.file_url);
        if (!res.ok) throw new Error("could not load the file");
        zip.file(d.file_name || `${d.title}.pdf`, await res.arrayBuffer());
      } catch (err) {
        toast.error(`"${d.title}" couldn't be included`, { description: err?.message || "Unknown error" });
        throw err;
      }
    }
    return zip.generateAsync({ type: "blob" });
  };

  const handleDownload = async () => {
    setPackaging("download");
    try {
      const blob = await buildZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Candora-Board-Orientation-Package.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* per-file toast already shown */
    } finally {
      setPackaging(null);
    }
  };

  const handleShare = async () => {
    setPackaging("share");
    try {
      const blob = await buildZip();
      const file = new File([blob], "Candora-Board-Orientation-Package.zip", { type: "application/zip" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await navigator.clipboard.writeText(file_url);
      toast.success("Share link copied — anyone with the link can download the ZIP.");
    } catch (err) {
      if (err?.message?.includes("clipboard")) toast.error("Could not copy the link automatically — please copy it manually.");
      /* per-file toasts already shown */
    } finally {
      setPackaging(null);
    }
  };

  if (docs === null) {
    return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-heading text-lg font-semibold flex items-center gap-2"><PackageOpen size={18} /> Board Orientation Package</h2>
            <p className="text-muted-foreground text-sm mt-1">{active.length} document{active.length === 1 ? "" : "s"} in the package{parked.length ? ` · ${parked.length} parked` : ""}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
              <Plus size={15} /> Add Document
            </button>
            <button onClick={handleDownload} disabled={!active.length || packaging} className="flex items-center gap-1.5 border border-border rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted transition disabled:opacity-50">
              <Download size={15} /> {packaging === "download" ? "Packing..." : "Download ZIP"}
            </button>
            <button onClick={handleShare} disabled={!active.length || packaging} className="flex items-center gap-1.5 border border-border rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted transition disabled:opacity-50">
              <Link2 size={15} /> {packaging === "share" ? "Packing..." : "Share ZIP"}
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="border-t border-border mt-4 pt-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium mb-1.5 block">Title *</label><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Document *</label>
                <label className={`flex items-center gap-2 cursor-pointer text-sm border border-border rounded-lg px-3 py-2 transition ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
                  <Upload size={14} /> {pendingFile ? pendingFile.name : uploading ? "Uploading..." : "Choose file"}
                  <input type="file" className="hidden" disabled={uploading} onChange={(e) => setPendingFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Description</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            </div>
            <div className="flex gap-3 mt-4">
              <button type="button" onClick={() => { setShowForm(false); setPendingFile(null); setForm(EMPTY_FORM); }} className="flex-1 border border-border rounded-lg py-2 text-sm hover:bg-muted transition">Cancel</button>
              <button type="submit" disabled={!pendingFile || saving} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-60">{saving ? "Adding..." : "Add to Package"}</button>
            </div>
          </form>
        )}
      </div>

      {/* Package documents */}
      <div className="space-y-2">
        {active.map((doc) => (
          <div key={doc.id} className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-4 group hover:shadow-sm transition">
            <div className="flex items-start gap-3 min-w-0">
              <FileText size={18} className="text-primary shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{doc.title}</p>
                {doc.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{doc.description}</p>}
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{doc.file_name}</p>
              </div>
            </div>
            <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
              <button onClick={() => setStatus(doc, "parked")} title="Park — set aside, excluded from the package" className="p-1.5 text-muted-foreground hover:text-foreground rounded"><Archive size={14} /></button>
              <button onClick={() => handleDelete(doc)} className="p-1.5 text-muted-foreground hover:text-destructive rounded"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {active.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <PackageOpen size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium text-sm">No documents in the package yet</p>
            <p className="text-xs mt-1">Use "Add Document" to build the orientation package for new board members.</p>
          </div>
        )}
      </div>

      {/* Parked documents */}
      {parked.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Parked — not in the package</h3>
          <div className="space-y-2">
            {parked.map((doc) => (
              <div key={doc.id} className="bg-muted/40 border border-dashed border-border rounded-xl p-4 flex items-start justify-between gap-4 group">
                <div className="flex items-start gap-3 min-w-0">
                  <FileText size={18} className="text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate text-muted-foreground">{doc.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{doc.file_name}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => setStatus(doc, "active")} title="Restore to the package" className="p-1.5 text-muted-foreground hover:text-foreground rounded"><RotateCcw size={14} /></button>
                  <button onClick={() => handleDelete(doc)} className="p-1.5 text-muted-foreground hover:text-destructive rounded"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}