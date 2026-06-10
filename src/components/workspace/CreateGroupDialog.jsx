import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

export default function CreateGroupDialog({ open, onOpenChange }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [groupName, setGroupName] = useState("");

  const createGroupMutation = useMutation({
    mutationFn: async () => {
      // Workspace groups are implicit - just create items with the group name
      // This dialog just validates and closes, actual grouping happens when adding items
      return { name: groupName };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-items"] });
      toast.success(`Group "${groupName}" created`);
      setGroupName("");
      onOpenChange(false);
    },
  });

  const handleSave = () => {
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }
    createGroupMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Grant Submission 2024"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={createGroupMutation.isPending}>Create Group</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}