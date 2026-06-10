import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText, MoreVertical, Trash2, ExternalLink, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

function getFileExtension(name) {
  if (!name) return "";
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

function getFileTypeStyle(ext) {
  const map = {
    pdf: { bg: "bg-red-100", color: "text-red-600" },
    docx: { bg: "bg-blue-100", color: "text-blue-600" },
    doc: { bg: "bg-blue-100", color: "text-blue-600" },
    xlsx: { bg: "bg-green-100", color: "text-green-600" },
    xls: { bg: "bg-green-100", color: "text-green-600" },
    pptx: { bg: "bg-orange-100", color: "text-orange-600" },
    ppt: { bg: "bg-orange-100", color: "text-orange-600" },
    png: { bg: "bg-purple-100", color: "text-purple-600" },
    jpg: { bg: "bg-purple-100", color: "text-purple-600" },
    jpeg: { bg: "bg-purple-100", color: "text-purple-600" },
  };
  return map[ext] || { bg: "bg-slate-100", color: "text-slate-600" };
}

function formatFileSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileListItem({ file, onDelete, index = 0 }) {
  const navigate = useNavigate();
  const ext = getFileExtension(file.original_name);
  const style = getFileTypeStyle(ext);

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:shadow-sm transition-all">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${style.bg}`}><FileText className={`h-4 w-4 ${style.color}`} /></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.display_name || file.original_name}</p>
        <p className="text-xs text-muted-foreground">{file.standardized_name}</p>
      </div>
      <Badge variant="secondary" className="text-xs">{file.category?.replace(/_/g, " ") || "Uncategorized"}</Badge>
      <Badge variant="outline" className="text-xs capitalize">{file.access_level}</Badge>
      <span className="text-xs text-muted-foreground w-20">{formatFileSize(file.file_size)}</span>
      <span className="text-xs text-muted-foreground w-24">{file.created_date ? format(new Date(file.created_date), "MMM d, yyyy") : ""}</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/filemanager/view?id=${file.id}`)}><ExternalLink className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(file.file_url, "_blank")}><Download className="h-4 w-4" /></Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/filemanager/edit?id=${file.id}`)}><Eye className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
            {onDelete && <DropdownMenuItem onClick={() => onDelete(file)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}