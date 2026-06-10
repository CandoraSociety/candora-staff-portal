import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, FileText, Download, MessageSquare } from "lucide-react";
import { getFileExtension, getFileTypeStyle, formatFileSize } from "@/lib/fileHelpers";
import WorkspaceNoteDialog from "./WorkspaceNoteDialog";

export default function WorkspaceGroup({ group, onDeleteItem }) {
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleAddNote = (item) => {
    setSelectedItem(item);
    setShowNoteDialog(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>{group.name}</span>
            <Badge variant="secondary">{group.items.length} items</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {group.items.map((item) => {
              const ext = getFileExtension(item.original_name);
              const style = getFileTypeStyle(ext);
              return (
                <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted transition-colors">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${style.bg}`}><FileText className={`h-4 w-4 ${style.color}`} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.original_name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(item.file_size)}{item.notes && ` · ${item.notes.slice(0, 50)}...`}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleAddNote(item)}><MessageSquare className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(item.file_url, "_blank")}><Download className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDeleteItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <WorkspaceNoteDialog item={selectedItem} open={showNoteDialog} onOpenChange={setShowNoteDialog} />
    </>
  );
}