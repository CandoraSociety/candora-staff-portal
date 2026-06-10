import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

export default function SignatureDialog({ open, onOpenChange, onSave, existingSignature }) {
  const [name, setName] = React.useState(existingSignature?.name || "");
  const [title, setTitle] = React.useState(existingSignature?.title || "");
  const [imageData, setImageData] = React.useState(existingSignature?.imageData || null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageData(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave({ name, title, imageData });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Signature</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Your title" />
          </div>
          <div>
            <Label>Signature Image (optional)</Label>
            <Input type="file" accept="image/*" onChange={handleFileUpload} />
            {imageData && (
              <div className="mt-2 p-2 border rounded bg-muted">
                <img src={imageData} alt="Signature" className="h-16 mx-auto" />
                <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setImageData(null)}><X className="h-4 w-4 mr-2" /> Remove</Button>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Signature</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}