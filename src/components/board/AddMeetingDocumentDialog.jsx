import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Upload, FileText } from "lucide-react";

const TYPE_OPTIONS = [
  { value: "other", label: "Document" },
  { value: "minutes", label: "Minutes" },
  { value: "agenda", label: "Agenda" },
  { value: "financial_report", label: "Financial report" },
  { value: "ed_report", label: "ED report" },
  { value: "committee_report", label: "Committee report" },
  { value: "policy", label: "Policy" },
  { value: "bylaw", label: "Bylaw" },
  { value: "strategic_plan", label: "Strategic plan" },
  { value: "training", label: "Training" },
];

// Attach any document to a meeting card
export default function AddMeetingDocumentDialog({ meeting, onClose, onAdded }) {
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("other");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("Choose a file to add to the meeting first.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      const doc = await base44.entities.BoardDocument.create({
        title: title.trim() || file.name.replace(/\.[^.]+$/, ""),
        document_type: documentType,
        meeting_id: meeting.id,
        file_url,
        file_name: file.name,
        description: description.trim(),
        is_public_to_board: true,
      });
      onAdded(doc);
    } catch {
      setError("The document couldn't be added. Please try again.");
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-heading font-semibold text-lg">Add Document</h2>
            <p className="text-xs text-muted-foreground mt-1">{meeting.title}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Financial Statements"
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Document type</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Note (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Circulated with the agenda"
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">File *</label>
            <label className="flex items-center gap-2 border border-dashed border-input rounded-lg px-3 py-3 text-sm cursor-pointer hover:bg-muted transition">
              <FileText size={16} className="text-muted-foreground shrink-0" />
              <span className="truncate text-muted-foreground">{file ? file.name : "Choose a PDF, Word, Excel or image file"}</span>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
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
              <Upload size={14} /> {uploading ? "Adding..." : "Add Document"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}