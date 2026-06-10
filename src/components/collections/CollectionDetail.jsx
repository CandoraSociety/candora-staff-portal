import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2, Download, ExternalLink, FolderOpen, Search, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { getFileExtension, getFileTypeStyle } from "@/lib/fileHelpers";
import FilePickerGrid from "@/components/collections/FilePickerGrid";

export default function CollectionDetail({ collection, files, onBack, onDelete }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const collectionFiles = files.filter((f) => collection.file_ids?.includes(f.id));

  const filteredFiles = collectionFiles.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.display_name?.toLowerCase().includes(q) ||
      f.original_name?.toLowerCase().includes(q)
    );
  });

  const removeFileMutation = useMutation({
    mutationFn: async (fileId) => {
      const newFileIds = collection.file_ids.filter((id) => id !== fileId);
      await base44.entities.Collection.update(collection.id, { file_ids: newFileIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("File removed from collection");
    },
  });

  const handleRemoveFile = (fileId) => {
    removeFileMutation.mutate(fileId);
  };

  const handleToggleFile = (fileId) => {
    if (collection.file_ids.includes(fileId)) {
      removeFileMutation.mutate(fileId);
    } else {
      const newFileIds = [...collection.file_ids, fileId];
      base44.entities.Collection.update(collection.id, { file_ids: newFileIds }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["collections"] });
        toast.success("File added to collection");
      });
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: collection.color || "#e2e8f0" }}
            >
              <FolderOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{collection.name}</h1>
              <p className="text-sm text-muted-foreground">
                {collectionFiles.length} file{collectionFiles.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onDelete} className="gap-2">
            <Trash2 className="h-4 w-4" />
            Delete Collection
          </Button>
          <Button onClick={() => setShowPicker(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Files
          </Button>
        </div>
      </div>

      {collection.description && (
        <p className="text-sm text-muted-foreground">{collection.description}</p>
      )}

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search in collection..."
          className="pl-9"
        />
      </div>

      {collectionFiles.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No files in this collection</h3>
          <p className="text-muted-foreground mb-4">Add files to organize them</p>
          <Button onClick={() => setShowPicker(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Files
          </Button>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-16">
          <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No files match your search</h3>
          <p className="text-muted-foreground">Try a different search term</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredFiles.map((file) => {
            const ext = getFileExtension(file.original_name);
            const style = getFileTypeStyle(ext);
            return (
              <Card key={file.id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${style.bg}`}>
                      <FileText className={`h-5 w-5 ${style.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {file.display_name || file.original_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {file.standardized_name || file.original_name}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleRemoveFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(file.file_url, "_blank")}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(`/filemanager/view?id=${file.id}`, "_blank")}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <FilePickerGrid
        open={showPicker}
        files={files.filter((f) => !collection.file_ids?.includes(f.id))}
        selectedFileIds={collection.file_ids || []}
        onToggle={handleToggleFile}
        onClose={() => setShowPicker(false)}
      />
    </div>
  );
}