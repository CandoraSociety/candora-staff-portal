import React from "react";
import { X, Loader2, CheckCircle2, AlertCircle, FileText, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getFileExtension, PHOTO_EXTS, FILE_CATEGORIES } from "@/lib/fileHelpers";
import { Button } from "@/components/ui/button";

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

  const formatFileSize = (bytes) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        item.status === "done" ? "bg-green-50 border-green-200" :
        item.status === "error" ? "bg-red-50 border-red-200" : "bg-card"
      }`}
    >
      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
        {getStatusIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.file.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{ext.toUpperCase()} • {formatFileSize(item.file.size)}</span>
          {item.status === "error" && (
            <span className="text-xs text-destructive truncate">{item.error}</span>
          )}
        </div>
      </div>

      {item.status === "pending" && showCategoryEdit && (
        <div className="flex items-center gap-2">
          <Select value={item.category} onValueChange={(val) => onCategoryChange?.(item.id, val)}>
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="to_be_sorted">To Be Sorted</SelectItem>
              {FILE_CATEGORIES.filter(c => c.value !== "to_be_sorted").map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onRemove?.(item.id)}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      )}

      {item.status === "done" && (
        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Uploaded
        </Badge>
      )}

      {item.status === "uploading" && (
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Uploading...
        </Badge>
      )}

      {item.status === "error" && (
        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
          <AlertCircle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      )}
    </div>
  );
}