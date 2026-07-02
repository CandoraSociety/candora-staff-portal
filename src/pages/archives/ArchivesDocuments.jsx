import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Upload, Loader2, FileText, Image, Video, File, ExternalLink, Trash2 } from "lucide-react";
import { useArchiveAdmin } from "@/components/archives/useArchiveAdmin";
import { useToast } from "@/components/ui/use-toast";

const SUBCATEGORIES = ["Photos", "Videos", "Newspaper Clippings", "News Coverage", "Contracts", "Communications", "Other"];

function getFileIcon(fileType) {
  const ext = (fileType || "").toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext)) return { Icon: Image, color: "text-blue-500" };
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return { Icon: Video, color: "text-purple-500" };
  if (["pdf"].includes(ext)) return { Icon: FileText, color: "text-red-500" };
  if (["doc", "docx"].includes(ext)) return { Icon: FileText, color: "text-blue-600" };
  if (["xls", "xlsx"].includes(ext)) return { Icon: FileText, color: "text-green-600" };
  if (["ppt", "pptx"].includes(ext)) return { Icon: FileText, color: "text-orange-500" };
  return { Icon: File, color: "text-muted-foreground" };
}

export default function ArchivesDocuments() {
  const { isAdmin } = useArchiveAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState("all");
  const fileInputRef = useRef(null);

  // Ensure SharePoint folder exists on mount
  useEffect(() => {
    if (isAdmin) {
      base44.functions.invoke("ensureArchivesFolder", {}).catch(() => {});
    }
  }, [isAdmin]);

  const { data: documents } = useQuery({
    queryKey: ["archiveDocuments"],
    queryFn: () => base44.entities.File.filter({ category: "archives" }),
  });

  const filtered = filter === "all" ? (documents || []) : (documents || []).filter(d => (d.subcategory || "") === filter);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadOpen(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      const res = await base44.functions.invoke("uploadArchiveFile", {
        file_url,
        fileName: selectedFile.name,
        description,
        subcategory,
      });
      if (res.data?.success) {
        toast({ title: "Document archived", description: res.data.file_name });
        queryClient.invalidateQueries({ queryKey: ["archiveDocuments"] });
      } else {
        throw new Error(res.data?.error || "Upload failed");
      }
      setUploadOpen(false);
      setSelectedFile(null);
      setDescription("");
      setSubcategory("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc) => {
    if (!confirm(`Remove "${doc.display_name || doc.original_name}" from the archive? (The SharePoint file will remain.)`)) return;
    try {
      await base44.entities.File.delete(doc.id);
      queryClient.invalidateQueries({ queryKey: ["archiveDocuments"] });
      toast({ title: "Document removed from archive" });
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Document Archive</h1>
          <p className="text-muted-foreground">Historical photos, videos, clippings, and supporting documents.</p>
        </div>
        {isAdmin && (
          <>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
            <Button size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" /> Upload Document
            </Button>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>All</Button>
        {SUBCATEGORIES.map(sc => (
          <Button key={sc} variant={filter === sc ? "default" : "outline"} size="sm" onClick={() => setFilter(sc)}>{sc}</Button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 && <p className="text-muted-foreground col-span-full text-center py-12">No documents in this category yet.</p>}
        {filtered.map(doc => {
          const { Icon, color } = getFileIcon(doc.file_type);
          const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes((doc.file_type || "").toLowerCase());
          return (
            <Card key={doc.id} className="hover:shadow-md transition-shadow overflow-hidden">
              {isImage && doc.file_url && (
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                  <div className="aspect-video overflow-hidden bg-muted">
                    <img src={doc.file_url} alt={doc.display_name} className="w-full h-full object-cover" />
                  </div>
                </a>
              )}
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {!isImage && <Icon className={`h-8 w-8 flex-shrink-0 ${color}`} />}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{doc.display_name || doc.original_name}</h3>
                    {doc.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{doc.description}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      {doc.subcategory && <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{doc.subcategory}</span>}
                      <span className="text-xs text-muted-foreground uppercase">{doc.file_type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-3">
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-2"><ExternalLink className="h-3.5 w-3.5" /> View</Button>
                  </a>
                  {isAdmin && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(doc)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={(v) => { if (!uploading) setUploadOpen(v); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload to Archive</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <File className="h-8 w-8 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile?.name}</p>
                <p className="text-xs text-muted-foreground">{selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <div>
              <Label>Subcategory</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {SUBCATEGORIES.map(sc => (
                  <Button key={sc} variant={subcategory === sc ? "default" : "outline"} size="sm" onClick={() => setSubcategory(sc)}>{sc}</Button>
                ))}
              </div>
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of this document..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadOpen(false); setSelectedFile(null); }} disabled={uploading}>Cancel</Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Uploading...</> : "Upload to SharePoint"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}