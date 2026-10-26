import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import CategorySelector from "@/components/files/CategorySelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { ACCESS_LEVELS, generateStandardizedName, getFileExtension } from "@/lib/fileHelpers";

const ACCEPTED_TYPES = ["pdf", "xlsx", "xls", "csv"];
const ACCEPT_ATTR = ".pdf,.xlsx,.xls,.csv";

export default function QuickFileUploadDialog({ open, onOpenChange }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState("to_be_sorted");
  const [subcategory, setSubcategory] = useState("");
  const [accessLevel, setAccessLevel] = useState("universal");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const reset = () => {
    setFile(null);
    setDisplayName("");
    setCategory("to_be_sorted");
    setSubcategory("");
    setAccessLevel("universal");
    setDescription("");
    setKeywords([]);
    setKeywordInput("");
  };

  const canChoose = (value) => {
    if (value === "manager") return user?.role === "admin" || user?.role === "manager";
    if (value === "finance") return user?.role === "admin" || user?.role === "finance";
    if (value === "corporate") return user?.role === "admin";
    return true;
  };

  const handleFileSelect = (f) => {
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(getFileExtension(f.name))) {
      toast.error("Quick Files accepts PDF, Excel and CSV files. Use the File Manager for other types.");
      return;
    }
    setFile(f);
    setDisplayName(f.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
  };

  const handleAddKeyword = () => {
    const kw = keywordInput.trim().toLowerCase();
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw]);
      setKeywordInput("");
    }
  };

  const handleUpload = async () => {
    if (!file || isUploading) return;
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.File.create({
        original_name: file.name,
        standardized_name: generateStandardizedName(file.name, category, accessLevel),
        display_name: displayName || file.name,
        description,
        summary: description || "",
        keywords,
        file_url,
        file_type: getFileExtension(file.name),
        file_size: file.size,
        category,
        subcategory: subcategory || undefined,
        access_level: accessLevel,
        owner_email: user?.email,
        owner_name: user?.full_name,
        source_app: "dashboard_quick_files",
      });
      queryClient.invalidateQueries({ queryKey: ["all-files-search"] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("File uploaded to the vault.");
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!isUploading) onOpenChange(o); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload a file</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {!file ? (
            <div
              className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => document.getElementById("qf-file-input")?.click()}
            >
              <input
                type="file"
                id="qf-file-input"
                className="hidden"
                accept={ACCEPT_ATTR}
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Drop a file here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, Excel and CSV files</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <FileText className="h-6 w-6 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatMegaBytes(file.size)}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={reset} title="Remove file">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div>
            <Label>Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Friendly name for this file"
            />
          </div>

          <div>
            <Label>Category</Label>
            <CategorySelector value={category} onChange={setCategory} onSubcategoryChange={setSubcategory} className="w-full" />
          </div>

          <div>
            <Label>Access Level</Label>
            <Select value={accessLevel} onValueChange={setAccessLevel}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCESS_LEVELS.map((al) => (
                  <SelectItem key={al.value} value={al.value} disabled={!canChoose(al.value)}>
                    {al.label} — {al.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this file"
              className="h-20"
            />
          </div>

          <div>
            <Label>Keywords (optional)</Label>
            <div className="flex gap-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Add a keyword"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddKeyword())}
              />
              <Button type="button" variant="outline" onClick={handleAddKeyword}>Add</Button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {keywords.map((kw) => (
                  <span key={kw} className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                    {kw}
                    <button onClick={() => setKeywords(keywords.filter((k) => k !== kw))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {file && (
            <Card className="p-3 bg-muted/50">
              <p className="text-xs text-muted-foreground font-medium mb-1">Standardized File Name</p>
              <p className="text-sm font-mono break-all">{generateStandardizedName(file.name, category, accessLevel)}</p>
            </Card>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>Cancel</Button>
            <Button onClick={handleUpload} disabled={!file || isUploading} className="gap-2">
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Upload to Vault
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatMegaBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}