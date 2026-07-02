import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Loader2, Video, FileText } from "lucide-react";

function detectMediaType(fileType) {
  if (fileType?.startsWith("image/")) return "photo";
  if (fileType?.startsWith("video/")) return "video";
  return "document";
}

export default function MediaUploader({ media = [], onChange }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange([...media, { url: file_url, caption: "", type: detectMediaType(file.type) }]);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = (index) => onChange(media.filter((_, i) => i !== index));
  const handleCaptionChange = (index, caption) =>
    onChange(media.map((m, i) => (i === index ? { ...m, caption } : m)));

  return (
    <div className="space-y-2">
      {media.map((item, index) => (
        <div key={index} className="flex gap-2 items-start border rounded-lg p-2">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
            {item.type === "photo" ? (
              <img src={item.url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="text-muted-foreground">
                {item.type === "video" ? <Video className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
              </div>
            )}
          </div>
          <Input
            placeholder="Caption (optional)..."
            value={item.caption || ""}
            onChange={(e) => handleCaptionChange(index, e.target.value)}
            className="flex-1 h-8"
          />
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleRemove(index)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <input ref={inputRef} type="file" className="hidden" onChange={handleUpload} accept="image/*,video/*,.pdf,.doc,.docx" />
      <Button variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
        {uploading ? "Uploading..." : "Add Media"}
      </Button>
    </div>
  );
}