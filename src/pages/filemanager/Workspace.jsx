import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen, Pin, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import WorkspaceGroup from "@/components/workspace/WorkspaceGroup";
import CreateGroupDialog from "@/components/workspace/CreateGroupDialog";
import PinFromVaultDialog from "@/components/workspace/PinFromVaultDialog";

export default function Workspace() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showPinFromVault, setShowPinFromVault] = useState(false);

  const { data: workspaceItems = [], isLoading, refetch } = useQuery({
    queryKey: ["workspace-items", user?.email],
    queryFn: async () => {
      const all = await base44.entities.WorkspaceItem.list("-created_date", 100);
      return all.filter((w) => w.owner_email === user?.email);
    },
    enabled: !!user,
  });

  const { data: vaultFiles = [] } = useQuery({
    queryKey: ["vault-files"],
    queryFn: () => base44.entities.File.list("-created_date", 1000),
  });

  const groupedItems = workspaceItems.reduce((acc, item) => {
    const group = item.workspace_group || "Ungrouped";
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  const handleDelete = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">My Workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">Personal project-based file organization</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPinFromVault(true)} className="gap-2">
            <Pin className="h-4 w-4" />
            Pin from Vault
          </Button>
          <Button onClick={() => setShowCreateGroup(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Group
          </Button>
        </div>
      </div>

      {workspaceItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-6">
              Your workspace is empty. Pin files from the vault or upload new ones to get started.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => setShowPinFromVault(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Pin from Vault
              </Button>
              <a href="/filemanager/upload">
                <Button className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload File
                </Button>
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([groupName, items]) => (
            <WorkspaceGroup
              key={groupName}
              groupName={groupName}
              items={items}
              vaultFiles={vaultFiles}
              onDelete={handleDelete}
              onUngroup={() => {}}
            />
          ))}
        </div>
      )}

      <CreateGroupDialog open={showCreateGroup} onOpenChange={setShowCreateGroup} />
      <PinFromVaultDialog
        open={showPinFromVault}
        onOpenChange={setShowPinFromVault}
        files={vaultFiles}
      />
    </div>
  );
}