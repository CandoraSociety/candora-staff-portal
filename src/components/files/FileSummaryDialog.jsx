import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText, Calendar, User, Tag, Eye, EyeOff, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

export default function FileSummaryDialog({ file, open, onOpenChange }) {
  const navigate = useNavigate();
  if (!file) return null;

  const ext = file.file_type || file.original_name?.split(".").pop()?.toLowerCase() || "";
  const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(ext);
  const isPdf = ext === "pdf";
  const canPreview = isImage || isPdf;
  const previewUrl = file.file_url || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center`}><FileText className="h-5 w-5 text-slate-600" /></div>
            <div className="min-w-0">
              <p className="truncate">{file.display_name || file.original_name}</p>
              <p className="text-xs font-normal text-muted-foreground">{file.standardized_name}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {file.summary && <div className="bg-muted/50 rounded-lg p-4"><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Summary</h4><p className="text-sm leading-relaxed">{file.summary}</p></div>}
          {file.description && <div><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Description</h4><p className="text-sm">{file.description}</p></div>}
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /><span>{file.created_date ? format(new Date(file.created_date), "MMM d, yyyy") : "—"}</span></div>
            <div className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4" /><span>{file.owner_name || "Unknown"}</span></div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="capitalize">{file.access_level}</Badge>
            <Badge variant="outline" className="capitalize">{file.category?.replace(/_/g, " ")}</Badge>
            <Badge variant="outline">{ext.toUpperCase()}</Badge>
            <Badge variant="outline">{file.file_size ? `${(file.file_size / 1024 / 1024).toFixed(2)} MB` : "—"}</Badge>
          </div>

          {file.keywords?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1"><Tag className="h-3 w-3" /> Keywords</h4>
              <div className="flex flex-wrap gap-1.5">{file.keywords.map((kw, i) => <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>)}</div>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" className="flex-1 gap-2" onClick={() => { onOpenChange(false); navigate(`/filemanager/view?id=${file.id}`); }}><ExternalLink className="h-4 w-4" /> Open File</Button>
            <Button className="flex-1 gap-2" onClick={() => window.open(file.file_url, "_blank")}><Download className="h-4 w-4" /> Download</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}