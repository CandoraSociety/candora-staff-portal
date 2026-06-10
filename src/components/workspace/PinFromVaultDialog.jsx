import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { Search } from "lucide-react";

export default function PinFromVaultDialog({ open, onOpenChange }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [workspaceGroup, setWorkspaceGroup] = useState("");
  const [selectedFileId, setSelectedFileId] = useState(null);

  const { data: files = [] } = useQuery({
    queryKey: ["files-vault"],
    queryFn: () => base44.entities.File.list("-created_date", 100),
    enabled: open,
  });

  const filteredFiles = files.filter((f) =>
    f.original_name.toLowerCase().includes(search.toLowerCase()) ||
    f.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  const pinMutation = useMutation({
    mutationFn: async () => {
      const file = files.find((f) => f.id === selectedFileId);
      if (!file) throw new Error("File not found");

      return base44.entities.WorkspaceItem.create({
        owner_email: user?.email,
        workspace_group: workspaceGroup || "Ungrouped",
        file_id: file.id,
        file_url: file.file_url,
        original_name: file.original_name,
        file_type: file.file_type,
        file_size: file.file_size,
        pinned_from_vault: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-items"] });
      toast.success("File pinned to workspace");
      setSelectedFileId(null);
      setWorkspaceGroup("");
      onOpenChange(false);
    },
  });

  const handlePin = () => {
    if (!selectedFileId) {
      toast.error("Please select a file");
      return;
    }
    pinMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Pin File from Vault</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-group">Workspace Group (optional)</Label>
              <Input
                id="workspace-group"
                value={workspaceGroup}
                onChange={(e) => setWorkspaceGroup(e.target.value)}
                placeholder="e.g., Grant Submission 2024"
              />
            </div>

            <div className="space-y-2">
              <Label>Select File from Vault</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vault files..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="border rounded-md overflow-y-auto max-h-64">
              {filteredFiles.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No files found</div>
              ) : (
                <div className="divide-y">
                  {filteredFiles.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => setSelectedFileId(file.id)}
                      className={`w-full p-3 text-left hover:bg-muted flex items-center gap-3 transition-colors ${
                        selectedFileId === file.id ? "bg-muted" : ""
                      }`}
                    >
                      <div className="text-xs text-muted-foreground min-w-[60px]">{file.file_type?.toUpperCase() || "FILE"}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.original_name}</p>
                        {file.display_name && (
                          <p className="text-xs text-muted-foreground truncate">{file.display_name}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handlePin} disabled={!selectedFileId || pinMutation.isPending}>
            Pin to Workspace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}