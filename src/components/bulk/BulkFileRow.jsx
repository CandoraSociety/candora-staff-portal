import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getFileExtension, getFileTypeStyle, formatFileSize } from "@/lib/fileHelpers";
import { FILE_CATEGORIES } from "@/lib/fileHelpers";

export default function BulkFileRow({ item, onCategoryChange, onRemove, showCategoryEdit = false }) {
  const ext = getFileExtension(item.file?.name || "");
  const style = getFileTypeStyle(ext);

  return (
    <div className="flex items-center gap-3 p-3 bg-card border rounded-lg">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${style.bg}`}>
        <span className={`text-xs font-bold uppercase ${style.color}`}>{ext || "file"}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.file?.name}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(item.file?.size)}</p>
      </div>

      {showCategoryEdit && (
        <Select value={item.category} onValueChange={(val) => onCategoryChange(item.id, val)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {FILE_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="flex items-center gap-2">
        {item.status === "uploading" && <span className="text-xs text-primary">Uploading...</span>}
        {item.status === "done" && <span className="text-xs text-green-600">Done</span>}
        {item.status === "error" && <span className="text-xs text-destructive">Error</span>}
        <Button variant="ghost" size="icon" onClick={() => onRemove(item.id)}><X className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}