import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, FileText, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { getFileExtension, getFileTypeStyle, canAccessFile } from "@/lib/fileHelpers";

export default function PinFromVaultDialog({ open, onOpenChange }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");

  const { data: files = [] } = useQuery({
    queryKey: ["vault-files-pin"],
    queryFn: async () => {
      const all = await base44.entities.File.list("-created_date", 200);
      return all.filter((f) => canAccessFile(f, user));
    },
    enabled: open,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["workspace-groups"],
    queryFn: async () => {
      const all = await base44.entities.WorkspaceItem.list("-created_date", 100);
      const filtered = all.filter((w) => w.owner_email === user?.email && w.workspace_group);
      const unique = [...new Set(filtered.map((w) => w.workspace_group))];
      return unique;
    },
    enabled: open,
  });

  const pinMutation = useMutation({
    mutationFn: async (file) => {
      await base44.entities.WorkspaceItem.create({
        owner_email: user?.email,
        workspace_group: selectedGroup,
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
      onOpenChange(false);
    },
  });

  const filteredFiles = files.filter((f) => (f.display_name || f.original_name || "").toLowerCase().includes(search.toLowerCase()));

  const handlePin = (file) => {
    if (!selectedGroup) {
      toast.error("Please select or create a workspace group first");
      return;
    }
    pinMutation.mutate(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Pin File from Vault</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Select Workspace Group</Label>
            <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
              <option value="">Choose a group...</option>
              {groups.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vault files..." className="pl-9" />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredFiles.slice(0, 20).map((file) => {
              const ext = getFileExtension(file.original_name);
              const style = getFileTypeStyle(ext);
              return (
                <div key={file.id} className="flex items-center gap-3 p-2 border rounded-lg hover:bg-muted cursor-pointer" onClick={() => handlePin(file)}>
                  <div className={`h-8 w-8 rounded flex items-center justify-center ${style.bg}`}><FileText className={`h-4 w-4 ${style.color}`} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.display_name || file.original_name}</p>
                    <p className="text-xs text-muted-foreground">{file.category?.replace(/_/g, " ") || "Uncategorized"}</p>
                  </div>
                  <Check className="h-4 w-4 text-muted-foreground opacity-0 hover:opacity-100" />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}