import React from "react";
import { X, Loader2, CheckCircle2, AlertCircle, FileText, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getFileExtension, PHOTO_EXTS } from "@/lib/fileHelpers";

export default function BulkFileRow({ item, onCategoryChange, onRemove, showCategoryEdit = false }) {
  const ext = getFileExtension(item.file.name);
  const isPhoto = PHOTO_EXTS.includes(ext);

  const getStatusIcon = () => {
    switch (item.status) {
      case "uploading":
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case "done":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return isPhoto ? <ImageIcon className="h-4 w-4 text-muted-foreground" /> : <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:shadow-sm transition-all">
      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
        {getStatusIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.file.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{ext.toUpperCase()} • {(item.file.size / 1024).toFixed(1)} KB</span>
          {item.status === "error" && (
            <span className="text-xs text-destructive">{item.error}</span>
          )}
        </div>
      </div>

      {item.status === "pending" && (
        <>
          {showCategoryEdit && (
            <select
              value={item.category}
              onChange={(e) => onCategoryChange?.(item.id, e.target.value)}
              className="text-sm border rounded-md px-3 py-1.5 bg-background"
            >
              <option value="to_be_sorted">To Sort</option>
              <option value="grants_federal">Grants - Federal</option>
              <option value="grants_provincial">Grants - Provincial</option>
              <option value="corporate">Corporate</option>
              <option value="finance">Finance</option>
              <option value="hr">HR</option>
              <option value="marketing">Marketing</option>
              <option value="other">Other</option>
            </select>
          )}

          <button
            onClick={() => onRemove?.(item.id)}
            className="h-8 w-8 rounded flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </>
      )}

      {item.status === "done" && (
        <Badge variant="outline" className="bg-success/10 text-success">Uploaded</Badge>
      )}

      {item.status === "uploading" && (
        <Badge variant="outline" className="bg-primary/10 text-primary">Uploading...</Badge>
      )}
    </div>
  );
}