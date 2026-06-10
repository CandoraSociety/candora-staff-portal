import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";

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

export default function RecentFiles({ files }) {
  const navigate = useNavigate();
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Recent Files</CardTitle>
        <Link to="/filemanager/files">
          <Button variant="ghost" size="sm" className="text-xs">View All</Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {files.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No files yet. Upload your first file!</p>
        ) : (
          files.slice(0, 8).map((file) => {
            const ext = getFileExtension(file.original_name);
            const style = getFileTypeStyle(ext);
            return (
              <div key={file.id} className="flex items-center gap-3 group">
                <div className={`h-9 w-9 rounded-lg ${style.bg} flex items-center justify-center shrink-0`}>
                  <FileText className={`h-4 w-4 ${style.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.display_name || file.original_name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="uppercase">{ext}</span>
                    <span>·</span>
                    <span>{formatFileSize(file.file_size)}</span>
                    <span>·</span>
                    <span>{file.created_date ? format(new Date(file.created_date), "MMM d") : ""}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Open file"
                    onClick={() => navigate(`/filemanager/view?id=${file.id}`)}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Download"
                    onClick={() => window.open(file.file_url, "_blank")}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}