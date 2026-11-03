import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Upload, FileText } from "lucide-react";

// Manual fallback for minutes that didn't auto-populate: attach a finished
// minutes file to a meeting as a board document of type "minutes".
export default function UploadMinutesDialog({ meeting, onClose, onUploaded }) {
  const [title, setTitle] = useState(`${meeting.title} — Minutes`);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("Choose a minutes file to upload first.");
      return;
    }
    setError("");
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const doc = await base44.entities.BoardDocument.create({
      title: title.trim() || `${meeting.title} — Minutes`,
      document_type: "minutes",
      meeting_id: meeting.id,
      file_url,
      file_name: file.name,
      description: description.trim(),
    });
    onUploaded(doc);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-heading font-semibold text-lg">Upload Minutes</h2>
            <p className="text-xs text-muted-foreground mt-1">{meeting.title}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Minutes Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Note (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Signed copy from the clerk"
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Minutes File *</label>
            <label className="flex items-center gap-2 border border-dashed border-input rounded-lg px-3 py-3 text-sm cursor-pointer hover:bg-muted transition">
              <FileText size={16} className="text-muted-foreground shrink-0" />
              <span className="truncate text-muted-foreground">{file ? file.name : "Choose a PDF or Word file"}</span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 border border-border rounded-lg py-2 text-sm hover:bg-muted transition">Cancel</button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
            >
              <Upload size={14} /> {uploading ? "Uploading..." : "Upload Minutes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}