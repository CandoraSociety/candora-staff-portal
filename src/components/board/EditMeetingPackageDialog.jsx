import { useEffect, useState } from "react";
import { Package, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { gatherPackageCandidates } from "@/lib/boardPackageCandidates";
import { rebuildPackageZip } from "@/components/board/meetingPackageZip";

/**
 * "Manage package items" — add documents to a meeting package or take them out.
 * Saving rebuilds the zip from the chosen documents, so the download and the
 * individual links on the meeting card always match.
 */
export default function EditMeetingPackageDialog({ pkg, meeting, onClose, onSaved }) {
  const [rows, setRows] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const candidates = await gatherPackageCandidates(meeting);
        const existing = pkg.package_files || [];
        // Items already in the package keep their place and label
        const next = existing.map((f) => {
          const match = candidates.find((c) => c.fileUrl && c.fileUrl === f.file_url);
          return {
            key: f.file_url,
            label: f.label,
            sub: match?.sub || f.file_name || "In this package",
            file_url: f.file_url,
            checked: true,
          };
        });
        // Everything else that could be added
        candidates.forEach((c) => {
          if (!c.available || !c.fileUrl) return;
          if (/\.html?($|\?)/i.test(c.fileUrl)) return;
          if (next.some((r) => r.key === c.fileUrl)) return;
          next.push({ key: c.fileUrl, label: c.label, sub: c.sub, file_url: c.fileUrl, checked: false });
        });
        if (!cancelled) setRows(next);
      } catch (err) {
        if (!cancelled) {
          toast.error("Could not load the package documents", { description: err?.message || "Unknown error" });
          onClose();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pkg.id, meeting.id]);

  const toggle = (key) => setRows((prev) => prev.map((r) => (r.key === key ? { ...r, checked: !r.checked } : r)));

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setRows((prev) => [
        ...(prev || []),
        {
          key: file_url,
          label: file.name.replace(/\.[^.]+$/, ""),
          sub: "Uploaded document",
          file_url,
          checked: true,
        },
      ]);
    } catch (err) {
      toast.error("Could not upload the document", { description: err?.message || "Unknown error" });
    } finally {
      setUploading(false);
    }
  };

  const selectedCount = (rows || []).filter((r) => r.checked).length;

  const handleSave = async () => {
    if (selectedCount === 0) return;
    setSaving(true);
    try {
      const selected = rows.filter((r) => r.checked);
      const { blob, skipped, included } = await rebuildPackageZip(
        selected.map((r) => ({ label: r.label, file_url: r.file_url })),
      );
      if (skipped.length > 0) {
        toast.warning(`${skipped.length} document${skipped.length === 1 ? "" : "s"} couldn't be added to the package.`, {
          description: skipped.join(", "),
        });
      }
      const fileName = pkg.file_name || "Candora-Meeting-Package.zip";
      const { file_url } = await base44.integrations.Core.UploadPublicFile({
        file: new File([blob], fileName, { type: "application/zip" }),
      });
      await base44.entities.BoardDocument.update(pkg.id, { file_url, package_files: included });
      onSaved({ ...pkg, file_url, package_files: included });
    } catch (err) {
      toast.error("Could not update the meeting package", { description: err?.message || "Unknown error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-auto bg-black/40 flex items-start sm:items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl max-w-lg w-full p-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="w-9 h-9 rounded-lg bg-[#1e2f4d] text-white flex items-center justify-center"><Package size={18} /></span>
          <div className="flex-1">
            <h2 className="font-heading text-lg font-semibold">Package Items</h2>
            <p className="text-xs text-muted-foreground">{meeting?.title || "Board Meeting"}</p>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        {rows === null ? (
          <div className="flex items-center gap-3 py-8 justify-center">
            <span className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Gathering meeting documents…</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mt-3">Tick what belongs in the package. Unchecking an item takes it out of the zip and off the meeting card.</p>
            <div className="mt-4 space-y-1.5 max-h-[46vh] overflow-auto pr-1">
              {rows.map((r) => (
                <label key={r.key} className="flex items-start gap-3 border border-border rounded-lg px-3 py-2.5 cursor-pointer hover:bg-muted/50">
                  <input type="checkbox" checked={r.checked} onChange={() => toggle(r.key)} className="mt-0.5 w-4 h-4" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium truncate">{r.label}</span>
                    <span className="block text-xs text-muted-foreground truncate">{r.sub}</span>
                  </span>
                </label>
              ))}
              {rows.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Nothing available to add yet.</p>
              )}
            </div>

            <label className={`mt-3 inline-flex items-center gap-2 text-xs border border-border rounded-lg px-3 py-1.5 cursor-pointer hover:bg-muted transition ${uploading ? "opacity-60" : ""}`}>
              {uploading ? <span className="w-3.5 h-3.5 border-2 border-border border-t-primary rounded-full animate-spin" /> : <Upload size={13} />}
              {uploading ? "Uploading…" : "Upload a document"}
              <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>

            <div className="flex gap-3 mt-5">
              <button type="button" onClick={onClose} className="flex-1 border border-border rounded-lg py-2 text-sm hover:bg-muted transition">Cancel</button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || selectedCount === 0}
                className="flex-1 bg-[#1e2f4d] text-white rounded-lg py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
            {selectedCount === 0 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">Keep at least one item, or delete the package from the meeting card.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}