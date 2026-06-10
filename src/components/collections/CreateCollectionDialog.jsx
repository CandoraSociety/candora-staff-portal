import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

const COLOR_OPTIONS = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#10b981", label: "Green" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#ef4444", label: "Red" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
];

export default function CreateCollectionDialog({ open, onOpenChange, onCreate }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [isCreating, setIsCreating] = useState(false);

  const createCollectionMutation = useMutation({
    mutationFn: async () => {
      const newCollection = await base44.entities.Collection.create({
        name,
        description,
        color,
        status: "active",
        file_ids: [],
        owner_email: user?.email,
      });
      return newCollection;
    },
    onSuccess: (newCollection) => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Collection created");
      setName("");
      setDescription("");
      setColor("#3b82f6");
      onCreate?.(newCollection);
      onOpenChange(false);
    },
  });

  const handleCreate = () => {
    if (!name.trim()) return;
    setIsCreating(true);
    createCollectionMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Create Collection</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Collection Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Grant Submission 2024" />
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Purpose of this collection" className="h-20" />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={`h-8 w-8 rounded-full border-2 transition-transform ${
                    color === c.value ? "border-primary scale-110" : "border-border"
                  }`}
                  style={{ background: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={isCreating || !name.trim()}>{isCreating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating...</> : "Create Collection"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}