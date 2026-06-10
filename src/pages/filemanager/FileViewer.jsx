import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, ExternalLink, Edit, Share2, Info } from "lucide-react";
import { getFileExtension, getFileTypeStyle } from "@/lib/fileHelpers";
import FileSummaryDialog from "@/components/files/FileSummaryDialog";
import ShareDialog from "@/components/files/ShareDialog";

export default function FileViewer() {
  const [searchParams] = useSearchParams();
  const fileId = searchParams.get("id");
  const [showSummary, setShowSummary] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const { data: file, isLoading } = useQuery({
    queryKey: ["file", fileId],
    queryFn: () => base44.entities.File.get(fileId),
    enabled: !!fileId,
  });

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!file) return <div className="p-8 text-center">File not found</div>;

  const ext = getFileExtension(file.original_name);
  const style = getFileTypeStyle(ext);
  const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(ext);
  const isPdf = ext === "pdf";

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="flex items-center justify-between p-4 max-w-[1400px] mx-auto">
          <div className="flex items-center gap-3">
            <Link to="/filemanager/files"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
            <div>
              <h1 className="text-lg font-semibold">{file.display_name || file.original_name}</h1>
              <p className="text-xs text-muted-foreground">{file.standardized_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSummary(true)} className="gap-1"><Info className="h-4 w-4" /> Info</Button>
            <Button variant="outline" size="sm" onClick={() => setShowShare(true)} className="gap-1"><Share2 className="h-4 w-4" /> Share</Button>
            <Link to={`/filemanager/edit?id=${file.id}`}><Button variant="outline" size="sm" className="gap-1"><Edit className="h-4 w-4" /> Edit</Button></Link>
            <Button size="sm" onClick={() => window.open(file.file_url, "_blank")} className="gap-1"><Download className="h-4 w-4" /> Download</Button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-[1400px] mx-auto">
        <div className="rounded-lg border bg-card overflow-hidden" style={{ height: "calc(100vh - 180px)" }}>
          {isImage ? (
            <img src={file.file_url} alt={file.display_name} className="w-full h-full object-contain" />
          ) : isPdf ? (
            <iframe src={file.file_url} className="w-full h-full" title={file.display_name} />
          ) : (
            <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(file.file_url)}&embedded=true`} className="w-full h-full" title={file.display_name} sandbox="allow-scripts allow-same-origin allow-popups" />
          )}
        </div>
      </div>

      <FileSummaryDialog file={file} open={showSummary} onOpenChange={setShowSummary} />
      <ShareDialog file={file} open={showShare} onOpenChange={setShowShare} />
    </div>
  );
}