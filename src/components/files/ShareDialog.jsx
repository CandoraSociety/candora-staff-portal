import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Copy, Check, Mail } from "lucide-react";
import { toast } from "sonner";

export default function ShareDialog({ file, open, onOpenChange }) {
  const [emails, setEmails] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  const shareUrl = file?.file_url || "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = () => {
    const emailList = emails.split(",").map((e) => e.trim()).filter((e) => e);
    if (emailList.length === 0) {
      toast.error("Please enter at least one email");
      return;
    }
    toast.success(`Shared with ${emailList.length} recipient(s)`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share File</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>Share Link</Label>
            <div className="flex gap-2 mt-1">
              <Input value={shareUrl} readOnly className="flex-1" />
              <Button variant="outline" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div>
            <Label>Share via Email</Label>
            <Input
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="email1@example.com, email2@example.com"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Separate multiple emails with commas</p>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}><X className="h-4 w-4 mr-2" /> Cancel</Button>
            <Button onClick={handleShare}><Mail className="h-4 w-4 mr-2" /> Share</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}