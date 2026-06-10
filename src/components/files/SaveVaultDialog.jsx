import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, X } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function SaveVaultDialog({ file, open, onOpenChange, onSave }) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("to_be_sorted");
  const [accessLevel, setAccessLevel] = React.useState("universal");

  React.useEffect(() => {
    if (file) {
      setDisplayName(file.display_name || file.original_name || "");
      setDescription(file.description || "");
      setCategory(file.category || "to_be_sorted");
      setAccessLevel(file.access_level || "universal");
    }
  }, [file]);

  const handleSave = () => {
    if (onSave) {
      onSave({ displayName, description, category, accessLevel });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Save to Vault</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>Display Name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="h-20" />
          </div>
          <div>
            <Label>Category</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div>
            <Label>Access Level</Label>
            <Input value={accessLevel} onChange={(e) => setAccessLevel(e.target.value)} />
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}><X className="h-4 w-4 mr-2" /> Cancel</Button>
            <Button onClick={handleSave}><Check className="h-4 w-4 mr-2" /> Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}