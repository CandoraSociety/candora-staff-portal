import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, FolderOpen, Pin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import WorkspaceGroup from "@/components/workspace/WorkspaceGroup";
import CreateGroupDialog from "@/components/workspace/CreateGroupDialog";
import PinFromVaultDialog from "@/components/workspace/PinFromVaultDialog";

export default function Workspace() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showPinFromVault, setShowPinFromVault] = useState(false);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["workspace-items", user?.email],
    queryFn: async () => {
      const all = await base44.entities.WorkspaceItem.list("-created_date", 100);
      const filtered = all.filter((w) => w.owner_email === user?.email);
      const grouped = {};
      filtered.forEach((item) => {
        const group = item.workspace_group || "Ungrouped";
        if (!grouped[group]) grouped[group] = [];
        grouped[group].push(item);
      });
      return Object.entries(grouped).map(([name, items]) => ({ name, items }));
    },
    enabled: !!user,
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkspaceItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-items"] });
      toast.success("Item removed from workspace");
    },
  });

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">Organize files by project or task</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPinFromVault(true)} className="gap-2"><Pin className="h-4 w-4" /> Pin from Vault</Button>
          <Button onClick={() => setShowCreateGroup(true)} className="gap-2"><Plus className="h-4 w-4" /> New Group</Button>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No workspace groups yet</p>
          <Button onClick={() => setShowCreateGroup(true)} className="mt-4 gap-2"><Plus className="h-4 w-4" /> Create your first group</Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {groups.map((group) => (
            <WorkspaceGroup key={group.name} group={group} onDeleteItem={deleteItemMutation.mutate} />
          ))}
        </div>
      )}

      <CreateGroupDialog open={showCreateGroup} onOpenChange={setShowCreateGroup} />
      <PinFromVaultDialog open={showPinFromVault} onOpenChange={setShowPinFromVault} />
    </div>
  );
}