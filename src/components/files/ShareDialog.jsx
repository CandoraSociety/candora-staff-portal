import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function ShareDialog({ open, onOpenChange, file }) {
  const [copied, setCopied] = useState(false);

  if (!file) return null;

  const shareUrl = `${window.location.origin}/filemanager/view?id=${file.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share File</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label>File</Label>
            <p className="text-sm font-medium mt-1">{file.display_name || file.original_name}</p>
          </div>
          <div>
            <Label>Share Link</Label>
            <div className="flex gap-2 mt-1">
              <Input value={shareUrl} readOnly className="flex-1" />
              <Button onClick={handleCopy} size="icon">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Share this link with others to give them access to this file.
            </p>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}