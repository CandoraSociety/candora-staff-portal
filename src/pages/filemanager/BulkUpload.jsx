import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, CheckCircle2, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { generateStandardizedName, getFileExtension, FILE_CATEGORIES } from "@/lib/fileHelpers";
import BulkFileRow from "@/components/bulk/BulkFileRow";

const PHOTO_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];

export default function BulkUpload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    const newFiles = selected.map((f, i) => ({
      id: `file-${Date.now()}-${i}`,
      file: f,
      category: PHOTO_EXTS.includes(getFileExtension(f.name)) ? "to_be_sorted" : "other",
      status: "pending",
    }));
    setFiles([...files, ...newFiles]);
  };

  const handleRemove = (id) => setFiles(files.filter((f) => f.id !== id));

  const handleCategoryChange = (id, category) => {
    setFiles(files.map((f) => (f.id === id ? { ...f, category } : f)));
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      for (const item of files) {
        try {
          setFiles((prev) => prev.map((f) => (f.id === item.id ? { ...f, status: "uploading" } : f)));
          const { file_url } = await base44.integrations.Core.UploadFile({ file: item.file });
          const stdName = generateStandardizedName(item.file.name, item.category, "universal");
          await base44.entities.File.create({
            original_name: item.file.name,
            standardized_name: stdName,
            display_name: item.file.name.replace(/\.[^/.]+$/, ""),
            file_url,
            file_type: getFileExtension(item.file.name),
            file_size: item.file.size,
            category: item.category,
            access_level: "universal",
            owner_email: user?.email,
            owner_name: user?.full_name,
          });
          setFiles((prev) => prev.map((f) => (f.id === item.id ? { ...f, status: "done" } : f)));
        } catch (err) {
          setFiles((prev) => prev.map((f) => (f.id === item.id ? { ...f, status: "error", error: err.message } : f)));
        }
      }
      await queryClient.invalidateQueries({ queryKey: ["files"] });
    },
    onSuccess: () => {
      toast.success("Bulk upload completed");
      setFiles([]);
      setUploading(false);
    },
    onError: () => {
      toast.error("Upload failed");
      setUploading(false);
    },
  });

  const handleUpload = () => uploadMutation.mutate();

  const hasPhotos = files.some((f) => PHOTO_EXTS.includes(getFileExtension(f.file.name)));

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bulk Upload</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload multiple files at once</p>
        </div>
        <Link to="/filemanager/upload"><Button variant="outline">Single Upload</Button></Link>
      </div>

      <div className="border-2 border-dashed rounded-xl p-8 text-center">
        <input type="file" id="bulk-upload" className="hidden" multiple onChange={handleFileSelect} accept="*/*" />
        <label htmlFor="bulk-upload" className="cursor-pointer">
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Select multiple files</p>
          <p className="text-sm text-muted-foreground">or drag and drop them here</p>
        </label>
      </div>

      {files.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{files.length} files selected</p>
            <div className="flex items-center gap-2">
              <Button onClick={handleUpload} disabled={uploading} className="gap-2">{uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</> : <><CheckCircle2 className="h-4 w-4" /> Upload All</>}</Button>
            </div>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {files.map((item) => (
              <BulkFileRow key={item.id} item={item} onCategoryChange={handleCategoryChange} onRemove={handleRemove} showCategoryEdit />
            ))}
          </div>
        </>
      )}
    </div>
  );
}