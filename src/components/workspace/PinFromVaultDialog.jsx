import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, FileText, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { getFileExtension, getFileTypeStyle } from "@/lib/fileHelpers";

export default function PinFromVaultDialog({ open, onOpenChange, files = [], defaultGroup = "", onPin }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [groupName, setGroupName] = useState(defaultGroup || "");
  const [selectedFiles, setSelectedFiles] = useState([]);

  const filteredFiles = files.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.display_name?.toLowerCase().includes(q) ||
      f.original_name?.toLowerCase().includes(q) ||
      f.category?.toLowerCase().includes(q)
    );
  });

  const toggleFile = (file) => {
    setSelectedFiles((prev) =>
      prev.some((f) => f.id === file.id)
        ? prev.filter((f) => f.id !== file.id)
        : [...prev, file]
    );
  };

  const pinMutation = useMutation({
    mutationFn: async () => {
      for (const file of selectedFiles) {
        await base44.entities.WorkspaceItem.create({
          owner_email: user?.email,
          workspace_group: groupName.trim() || "Default",
          file_id: file.id,
          file_url: file.file_url,
          original_name: file.original_name,
          file_type: file.file_type,
          file_size: file.file_size,
          pinned_from_vault: true,
          label: file.display_name || file.original_name,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-items"] });
      toast.success(`Pinned ${selectedFiles.length} file${selectedFiles.length !== 1 ? "s" : ""} to workspace`);
      setSelectedFiles([]);
      setGroupName("");
      onPin?.();
      onOpenChange(false);
    },
  });

  const handlePin = async () => {
    if (selectedFiles.length === 0) return;
    pinMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Pin Files from Vault</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Group Name (optional)</Label>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Grant Submission 2024"
            />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vault files..."
              className="pl-9"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredFiles.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No files found</p>
            ) : (
              <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
                {filteredFiles.map((file) => {
                  const isSelected = selectedFiles.some((f) => f.id === file.id);
                  const ext = getFileExtension(file.original_name);
                  const style = getFileTypeStyle(ext);
                  return (
                    <div
                      key={file.id}
                      onClick={() => toggleFile(file)}
                      className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                        isSelected ? "border-primary bg-primary/5" : "hover:border-primary"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${style.bg}`}>
                          <FileText className={`h-5 w-5 ${style.color}`} />
                        </div>
                        {isSelected && <Check className="h-5 w-5 text-primary" />}
                      </div>
                      <p className="text-sm font-medium truncate">{file.display_name || file.original_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{ext.toUpperCase()}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handlePin} disabled={selectedFiles.length === 0}>
                Pin to Workspace
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}