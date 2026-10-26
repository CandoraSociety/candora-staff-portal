import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import CollapsibleWidget from "@/components/dashboard/CollapsibleWidget";
import QuickFileUploadDialog from "@/components/dashboard/QuickFileUploadDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Search, Upload, FileText, X, ArrowRight } from "lucide-react";
import { canAccessFile, getFileExtension, formatFileSize } from "@/lib/fileHelpers";

const MAX_RESULTS = 5;

export default function QuickFilesWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data: allFiles = [] } = useQuery({
    queryKey: ["all-files-search"],
    queryFn: () => base44.entities.File.list("-created_date", 2000),
  });

  const results = useMemo(() => {
    const q = (query || "").toLowerCase().trim();
    if (!q) return [];
    return allFiles
      .filter((f) => canAccessFile(f, user))
      .filter((f) =>
        (f.display_name || f.original_name || "").toLowerCase().includes(q) ||
        (f.description || "").toLowerCase().includes(q) ||
        (f.summary || "").toLowerCase().includes(q) ||
        (f.keywords || []).some((k) => k.toLowerCase().includes(q))
      )
      .slice(0, MAX_RESULTS);
  }, [query, allFiles, user]);

  return (
    <div data-tour="dashboard-quickfiles" className="h-full [&>div]:h-full">
      <CollapsibleWidget title="Quick Files" icon={FolderOpen}>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              data-tour="qf-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the vault by file name, description or keyword..."
              className="pl-9 pr-8"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted"
                title="Clear search"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <Button data-tour="qf-upload-btn" onClick={() => setUploadOpen(true)} className="gap-2 shrink-0">
            <Upload className="h-4 w-4" /> Upload a file
          </Button>
        </div>

        {query ? (
          <div className="mt-3 space-y-2" data-tour="qf-results">
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No files match your search. Try different keywords, or use the File Manager.
              </p>
            ) : (
              results.map((file) => (
                <div
                  key={file.id}
                  onClick={() => navigate(`/filemanager/view?id=${file.id}`)}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/10 cursor-pointer transition-colors"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.display_name || file.original_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{file.description || file.summary || "No description"}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="secondary">{getFileExtension(file.original_name || file.display_name || "").toUpperCase()}</Badge>
                    <Badge variant="outline">{formatFileSize(file.file_size)}</Badge>
                  </div>
                </div>
              ))
            )}
            <button
              onClick={() => navigate("/filemanager/search")}
              className="flex items-center gap-1 text-sm text-primary hover:underline pt-1"
            >
              Open the File Manager for folders, bulk uploads and sharing <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mt-2">
            Upload a PDF, Excel or CSV file with its category, access level and keywords — it lands organized in the document vault. Need folders, bulk uploads or sharing? Open the{" "}
            <span className="text-primary font-medium cursor-pointer hover:underline" onClick={() => navigate("/filemanager")}>
              File Manager portal
            </span>
            .
          </p>
        )}
      </CollapsibleWidget>
      <QuickFileUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}