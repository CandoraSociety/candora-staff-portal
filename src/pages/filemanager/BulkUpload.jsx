import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, CheckCircle2, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { generateStandardizedName, getFileExtension, FILE_CATEGORIES, PHOTO_EXTS } from "@/lib/fileHelpers";
import BulkFileRow from "@/components/bulk/BulkFileRow";
import PhotoSorterDialog from "@/components/bulk/PhotoSorterDialog";

export default function BulkUpload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showPhotoSorter, setShowPhotoSorter] = useState(false);

  const handleFileSelect = useCallback((e) => {
    const selected = Array.from(e.target.files || []);
    const newFiles = selected.map((f, i) => ({
      id: `file-${Date.now()}-${i}`,
      file: f,
      category: "to_be_sorted",
      status: "pending",
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const selected = Array.from(e.dataTransfer.files);
    const newFiles = selected.map((f, i) => ({
      id: `file-${Date.now()}-${i}`,
      file: f,
      category: "to_be_sorted",
      status: "pending",
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleRemove = (id) => setFiles(files.filter((f) => f.id !== id));

  const handleCategoryChange = (id, category) => {
    setFiles(files.map((f) => (f.id === id ? { ...f, category } : f)));
  };

  const performUpload = useCallback(async (photoAssignments = []) => {
    setUploading(true);
    let uploadFiles = files;
    
    if (photoAssignments.length > 0) {
      uploadFiles = files.map((f) => {
        const assignment = photoAssignments.find((a) => a.id === f.id);
        return assignment ? { ...f, category: assignment.category } : f;
      });
    }

    for (const item of uploadFiles) {
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
    toast.success("Bulk upload completed");
    setFiles([]);
    setUploading(false);
  }, [files, user, queryClient]);

  const handleUpload = useCallback(() => {
    const photosToSort = files.filter((f) => 
      PHOTO_EXTS.includes(getFileExtension(f.file.name))
    );

    if (photosToSort.length > 0) {
      setShowPhotoSorter(true);
      return;
    }

    performUpload();
  }, [files, performUpload]);

  const handlePhotoSortDone = useCallback((assignments) => {
    setShowPhotoSorter(false);
    performUpload(assignments);
  }, [performUpload]);

  const unsortedPhotos = files.filter((f) => 
    PHOTO_EXTS.includes(getFileExtension(f.file.name)) && f.category === "to_be_sorted"
  );

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bulk Upload</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload multiple files at once</p>
        </div>
        <Link to="/filemanager/upload"><Button variant="outline">Single Upload</Button></Link>
      </div>

      <div 
        className="border-2 border-dashed rounded-xl p-8 text-center"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
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
              {unsortedPhotos.length > 0 && (
                <Button variant="outline" className="gap-2" onClick={() => setShowPhotoSorter(true)}>
                  <ImageIcon className="h-4 w-4" />
                  Sort Photos ({unsortedPhotos.length})
                </Button>
              )}
              <Button onClick={handleUpload} disabled={uploading || unsortedPhotos.length > 0} className="gap-2">
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Upload All
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {files.map((item) => (
              <BulkFileRow key={item.id} item={item} onCategoryChange={handleCategoryChange} onRemove={handleRemove} showCategoryEdit />
            ))}
          </div>
        </>
      )}

      {showPhotoSorter && (
        <PhotoSorterDialog
          photos={files.filter((f) => PHOTO_EXTS.includes(getFileExtension(f.file.name)))}
          onDone={handlePhotoSortDone}
          onCancel={() => setShowPhotoSorter(false)}
        />
      )}
    </div>
  );
}