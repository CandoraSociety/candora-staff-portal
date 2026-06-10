import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

export default function CreateGroupDialog({ open, onOpenChange }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const createGroupMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.WorkspaceItem.create({
        owner_email: user?.email,
        workspace_group: name,
        original_name: "Group starter",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-items"] });
      toast.success("Workspace group created");
      setName("");
      setDescription("");
      onOpenChange(false);
    },
  });

  const handleCreate = () => {
    if (!name.trim()) return;
    setIsCreating(true);
    createGroupMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Create Workspace Group</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Group Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Grant Submission 2024" />
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Purpose of this workspace group" className="h-20" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={isCreating || !name.trim()}>{isCreating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating...</> : "Create Group"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}