import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Check, FileText } from "lucide-react";
import { getFileExtension, getFileTypeStyle, canAccessFile } from "@/lib/fileHelpers";
import { useAuth } from "@/lib/AuthContext";

export default function FilePickerGrid({ open, selectedFileIds = [], onToggle, onClose }) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const { data: files = [] } = useQuery({
    queryKey: ["files-picker"],
    queryFn: async () => {
      const all = await base44.entities.File.list("-created_date", 500);
      return all.filter((f) => canAccessFile(f, user));
    },
    enabled: open,
  });

  const filteredFiles = files.filter((f) => {
    const q = search.toLowerCase();
    return (f.display_name || f.original_name || "").toLowerCase().includes(q);
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex items-center gap-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files..." className="flex-1 border-0 focus-visible:ring-0" />
          <button onClick={onClose}><Search className="h-4 w-4 rotate-45" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
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
                    className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${isSelected ? "border-primary bg-primary/5" : "hover:border-primary"}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${style.bg}`}><FileText className={`h-5 w-5 ${style.color}`} /></div>
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

        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
}