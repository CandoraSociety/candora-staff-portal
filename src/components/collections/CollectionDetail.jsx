import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Trash2, ExternalLink, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { getFileExtension, getFileTypeStyle, formatFileSize } from "@/lib/fileHelpers";
import FilePickerGrid from "./FilePickerGrid";

export default function CollectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPicker, setShowPicker] = useState(false);

  const { data: collection } = useQuery({
    queryKey: ["collection", id],
    queryFn: () => base44.entities.Collection.get(id),
    enabled: !!id,
  });

  const { data: files = [] } = useQuery({
    queryKey: ["collection-files", id],
    queryFn: async () => {
      if (!collection?.file_ids) return [];
      const all = await base44.entities.File.list("-created_date", 100);
      return all.filter((f) => collection.file_ids.includes(f.id));
    },
    enabled: !!collection,
  });

  const removeFromCollectionMutation = useMutation({
    mutationFn: async (fileId) => {
      const newFileIds = collection.file_ids.filter((fid) => fid !== fileId);
      await base44.entities.Collection.update(id, { file_ids: newFileIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection", id] });
      toast.success("File removed from collection");
    },
  });

  const handleToggleFile = (fileId) => {
    if (collection.file_ids.includes(fileId)) {
      removeFromCollectionMutation.mutate(fileId);
    } else {
      const newFileIds = [...collection.file_ids, fileId];
      base44.entities.Collection.update(id, { file_ids: newFileIds }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["collection", id] });
        toast.success("File added to collection");
      });
    }
  };

  if (!collection) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/filemanager/collections")}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">{collection.name}</h1>
            <p className="text-sm text-muted-foreground">{collection.description || "No description"}</p>
          </div>
        </div>
        <Button onClick={() => setShowPicker(true)} className="gap-2"><Plus className="h-4 w-4" /> Add Files</Button>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No files in this collection</p>
          <Button onClick={() => setShowPicker(true)} className="mt-4 gap-2"><Plus className="h-4 w-4" /> Add your first file</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => {
            const ext = getFileExtension(file.original_name);
            const style = getFileTypeStyle(ext);
            return (
              <Card key={file.id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${style.bg}`}><FileText className={`h-5 w-5 ${style.color}`} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{file.display_name || file.original_name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => window.open(file.file_url, "_blank")} className="h-8 w-8 rounded flex items-center justify-center hover:bg-muted"><ExternalLink className="h-4 w-4" /></button>
                      <button onClick={() => removeFromCollectionMutation.mutate(file.id)} className="h-8 w-8 rounded flex items-center justify-center hover:bg-muted"><Trash2 className="h-4 w-4 text-destructive" /></button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <FilePickerGrid open={showPicker} selectedFileIds={collection.file_ids || []} onToggle={handleToggleFile} onClose={() => setShowPicker(false)} />
    </div>
  );
}