import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import CategorySelector from "./CategorySelector";
import { generateStandardizedName, getFileExtension, ACCESS_LEVELS } from "@/lib/fileHelpers";

export default function FileUploader({ onComplete }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [category, setCategory] = useState("to_be_sorted");
  const [accessLevel, setAccessLevel] = useState("universal");
  const [description, setDescription] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      const name = selected.name.replace(/\.[^/.]+$/, "");
      setDisplayName(name);
    }
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (kw) => setKeywords(keywords.filter((k) => k !== kw));

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("No file selected");
      setIsUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const stdName = generateStandardizedName(file.name, category, accessLevel);
      const fileData = {
        original_name: file.name,
        standardized_name: stdName,
        display_name: displayName || file.name,
        description,
        keywords,
        file_url,
        file_type: getFileExtension(file.name),
        file_size: file.size,
        category,
        access_level: accessLevel,
        owner_email: user?.email,
        owner_name: user?.full_name,
      };
      await base44.entities.File.create(fileData);
      await queryClient.invalidateQueries({ queryKey: ["files"] });
    },
    onSuccess: () => {
      toast.success("File uploaded successfully");
      setFile(null);
      setPreviewUrl(null);
      setCategory("to_be_sorted");
      setAccessLevel("universal");
      setDescription("");
      setDisplayName("");
      setKeywords([]);
      setIsUploading(false);
      if (onComplete) onComplete();
    },
    onError: (err) => {
      toast.error(`Upload failed: ${err.message}`);
      setIsUploading(false);
    },
  });

  const handleUpload = () => { if (file) uploadMutation.mutate(); };

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
        <input type="file" id="file-upload" className="hidden" onChange={handleFileSelect} accept="*/*" />
        <Label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Drop your file here or click to browse</p>
          <p className="text-sm text-muted-foreground mt-1">Supports all file types</p>
        </Label>
      </div>

      {file && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <FileText className="h-8 w-8 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{file.name}</p>
              <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => { setFile(null); setPreviewUrl(null); }}><X className="h-4 w-4" /></Button>
          </div>

          <div className="grid gap-4">
            <div>
              <Label>Display Name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Friendly name for this file" />
            </div>

            <div>
              <Label>Category</Label>
              <CategorySelector value={category} onChange={setCategory} className="w-full" />
            </div>

            <div>
              <Label>Access Level</Label>
              <Select value={accessLevel} onValueChange={setAccessLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ACCESS_LEVELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label} — {l.description}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div>
              <Label>Description (optional)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this file" className="h-20" />
            </div>

            <div>
              <Label>Keywords (optional)</Label>
              <div className="flex gap-2 mt-1">
                <Input value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} placeholder="Add a keyword" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddKeyword())} />
                <Button type="button" variant="outline" onClick={handleAddKeyword}>Add</Button>
              </div>
              {keywords.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{keywords.map((kw) => <span key={kw} className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">{kw}<button onClick={() => handleRemoveKeyword(kw)}><X className="h-3 w-3" /></button></span>)}</div>}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">Standardized name will be: <span className="font-mono">{generateStandardizedName(file.name, category, accessLevel)}</span></p>
            <Button onClick={handleUpload} disabled={isUploading} className="gap-2">{isUploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</> : <><CheckCircle2 className="h-4 w-4" /> Upload to Vault</>}</Button>
          </div>
        </div>
      )}
    </div>
  );
}