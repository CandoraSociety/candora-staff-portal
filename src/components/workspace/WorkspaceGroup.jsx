import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ExternalLink, FolderOpen } from "lucide-react";
import { getFileIcon } from "@/lib/fileHelpers";

export default function WorkspaceGroup({ group, onDeleteItem }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{group.name}</CardTitle>
            <Badge variant="secondary">{group.items.length}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {group.items.map((item) => (
            <div key={item.id} className="border rounded-lg p-3 hover:shadow-sm transition-shadow group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getFileIcon(item.file_type)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.original_name}</p>
                    {item.label && <p className="text-xs text-muted-foreground truncate">{item.label}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.file_url && (
                    <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted">
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </a>
                  )}
                  <button onClick={() => onDeleteItem(item.id)} className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted">
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                </div>
              </div>
              {item.notes && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{item.notes}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}