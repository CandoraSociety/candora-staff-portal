import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Check, FileText } from "lucide-react";
import { getFileExtension, getFileTypeStyle } from "@/lib/fileHelpers";

export default function FilePickerGrid({ open, files = [], selectedFileIds = [], onToggle, onClose }) {
  const [search, setSearch] = useState("");

  const filteredFiles = files.filter((f) => {
    const q = search.toLowerCase();
    return (
      (f.display_name || f.original_name || "").toLowerCase().includes(q) ||
      (f.category || "").toLowerCase().includes(q)
    );
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Files</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredFiles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No files found</p>
          ) : (
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
              {filteredFiles.map((file) => {
                const isSelected = selectedFileIds.includes(file.id);
                const ext = getFileExtension(file.original_name);
                const style = getFileTypeStyle(ext);
                return (
                  <div
                    key={file.id}
                    onClick={() => onToggle(file.id)}
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

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}