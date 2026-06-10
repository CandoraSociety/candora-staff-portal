import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Folder, Plus, Trash2, Download, ExternalLink, X, ChevronDown, ChevronRight } from "lucide-react";
import { getFileExtension, getFileTypeStyle } from "@/lib/fileHelpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function WorkspaceGroup({ groupName, items = [], vaultFiles = [], onDelete, onUngroup }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const deleteItemMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkspaceItem.delete(id),
    onSuccess: () => {
      toast.success("Item removed");
      onDelete?.();
    },
  });

  const handleRemove = (itemId) => {
    if (window.confirm("Remove this item from your workspace?")) {
      deleteItemMutation.mutate(itemId);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 border-b bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
              <Folder className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">{groupName}</h2>
            </button>
            <Badge variant="secondary">{items.length} item{items.length !== 1 ? "s" : ""}</Badge>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-4">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No items in this group</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const ext = getFileExtension(item.original_name);
                const style = getFileTypeStyle(ext);
                return (
                  <div key={item.id} className="p-3 border rounded-lg hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${style.bg}`}>
                        <Folder className={`h-5 w-5 ${style.color}`} />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRemove(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="font-medium text-sm truncate">
                          {item.label || item.original_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {ext.toUpperCase()} • {item.file_size ? `${(item.file_size / 1024).toFixed(1)} KB` : "Unknown"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => window.open(item.file_url, "_blank")}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => window.open(`/filemanager/view?id=${item.file_id}`, "_blank")}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}