// Stub — full implementation comes in Section #4
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function FileSortingDialog({ files = [], open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sort Files</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground py-4 text-center">
          File sorting coming soon — {files.length} file(s) pending.
        </p>
      </DialogContent>
    </Dialog>
  );
}