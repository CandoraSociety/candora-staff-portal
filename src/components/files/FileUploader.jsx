import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Upload, X, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import CategorySelector from "./CategorySelector";
import { generateStandardizedName, getFileExtension, ACCESS_LEVELS } from "@/lib/fileHelpers";
import { motion, AnimatePresence } from "framer-motion";

export default function FileUploader({ onComplete }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [category, setCategory] = useState("to_be_sorted");
  const [subcategory, setSubcategory] = useState("");
  const [accessLevel, setAccessLevel] = useState("universal");
  const [description, setDescription] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [financeEmails, setFinanceEmails] = useState([]);
  const [financeEmailInput, setFinanceEmailInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["file-categories"],
    queryFn: () => base44.entities.FileCategory.list(),
  });

  const handleFileSelect = useCallback((f) => {
    if (!f) return;
    setFile(f);
    const name = f.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    setDisplayName(name);
  }, []);

  const handleAddKeyword = () => {
    const kw = keywordInput.trim().toLowerCase();
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw]);
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (kw) => setKeywords(keywords.filter((k) => k !== kw));

  const handleAddFinanceEmail = () => {
    const email = financeEmailInput.trim().toLowerCase();
    if (email && !financeEmails.includes(email) && email.includes("@")) {
      setFinanceEmails([...financeEmails, email]);
      setFinanceEmailInput("");
    }
  };

  const handleRemoveFinanceEmail = (email) => setFinanceEmails(financeEmails.filter((e) => e !== email));

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, [handleFileSelect]);

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
        summary: description || "",
        keywords,
        file_url,
        file_type: getFileExtension(file.name),
        file_size: file.size,
        category,
        subcategory: subcategory || undefined,
        access_level: accessLevel,
        finance_authorized_emails: accessLevel === "finance" ? financeEmails : [],
        owner_email: user?.email,
        owner_name: user?.full_name,
      };
      await base44.entities.File.create(fileData);
      const catRecord = categories.find((c) => c.value === category);
      if (catRecord) {
        await base44.entities.FileCategory.update(catRecord.id, { 
          usage_count: (catRecord.usage_count || 0) + 1 
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["files"] });
    },
    onSuccess: () => {
      toast.success("File uploaded successfully!");
      setFile(null);
      setPreviewUrl(null);
      setCategory("to_be_sorted");
      setSubcategory("");
      setAccessLevel("universal");
      setDescription("");
      setDisplayName("");
      setKeywords([]);
      setFinanceEmails([]);
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
      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
          isDragOver ? "border-primary bg-primary/5" : "hover:border-primary/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-upload")?.click()}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0])}
          accept="*/*"
        />
        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-medium">Drop your file here or click to browse</p>
        <p className="text-sm text-muted-foreground mt-1">Supports all file types</p>
      </div>

      <AnimatePresence>
        {file && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-5"
          >
            {/* File Preview */}
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <FileText className="h-8 w-8 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewUrl(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ACCESS_LEVELS.map((al) => {
                    const canSelectManager = user?.role === "admin" || user?.role === "manager";
                    const canSelectFinance = user?.role === "admin" || user?.role === "finance";
                    const canSelectCorporate = user?.role === "admin";
                    const disabled =
                      (al.value === "manager" && !canSelectManager) ||
                      (al.value === "finance" && !canSelectFinance) ||
                      (al.value === "corporate" && !canSelectCorporate);

                    return (
                      <Card
                        key={al.value}
                        className={`p-3 cursor-pointer transition-all text-center ${
                          disabled
                            ? "opacity-40 cursor-not-allowed"
                            : accessLevel === al.value
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "hover:border-primary/30"
                        }`}
                        onClick={() => !disabled && setAccessLevel(al.value)}
                      >
                        <p className="text-sm font-medium">{al.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{al.description}</p>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {accessLevel === "finance" && (
                <div>
                  <Label>Authorized Emails (Finance)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={financeEmailInput}
                      onChange={(e) => setFinanceEmailInput(e.target.value)}
                      placeholder="email@example.com"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddFinanceEmail())}
                    />
                    <Button type="button" variant="outline" onClick={handleAddFinanceEmail}>Add</Button>
                  </div>
                  {financeEmails.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {financeEmails.map((email) => (
                        <span key={email} className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                          {email}
                          <button onClick={() => handleRemoveFinanceEmail(email)}>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

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
                <div className="flex gap-2 mt-1">
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
                        <button onClick={() => handleRemoveKeyword(kw)}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Standardized Name Preview */}
              <Card className="p-3 bg-muted/50">
                <p className="text-xs text-muted-foreground font-medium mb-1">Standardized File Name</p>
                <p className="text-sm font-mono">{generateStandardizedName(file.name, category, accessLevel)}</p>
              </Card>
            </div>

            {/* Upload Button */}
            <div className="flex items-center justify-end pt-4">
              <Button onClick={() => uploadMutation.mutate()} disabled={isUploading} className="gap-2">
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Upload to Vault
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}