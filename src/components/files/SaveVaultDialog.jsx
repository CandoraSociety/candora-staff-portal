import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { ACCESS_LEVELS } from "@/lib/fileHelpers";
import CategorySelector from "./CategorySelector";

export default function SaveVaultDialog({ open, onOpenChange, onSave, fileUrl, originalName }) {
  const [displayName, setDisplayName] = useState(originalName?.replace(/\.[^/.]+$/, "") || "");
  const [category, setCategory] = useState("to_be_sorted");
  const [accessLevel, setAccessLevel] = useState("universal");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave({ displayName, category, accessLevel, description });
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Save to Vault</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Display Name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="File name" />
          </div>
          <div>
            <Label>Category</Label>
            <CategorySelector value={category} onChange={setCategory} className="w-full" />
          </div>
          <div>
            <Label>Access Level</Label>
            <Select value={accessLevel} onValueChange={setAccessLevel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ACCESS_LEVELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || !displayName}>{isSaving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : "Save to Vault"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}