import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ACCESS_LEVELS } from "@/lib/fileHelpers";

export default function ShareDialog({ file, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [accessLevel, setAccessLevel] = useState(file?.access_level || "universal");
  const [email, setEmail] = useState("");
  const [authorizedEmails, setAuthorizedEmails] = useState(file?.finance_authorized_emails || []);
  const [isSaving, setIsSaving] = useState(false);

  const updateFileMutation = useMutation({
    mutationFn: (data) => base44.entities.File.update(file.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("Permissions updated");
      onOpenChange(false);
    },
  });

  const handleAddEmail = () => {
    if (email.trim() && !authorizedEmails.includes(email.trim())) {
      setAuthorizedEmails([...authorizedEmails, email.trim()]);
      setEmail("");
    }
  };

  const handleRemoveEmail = (e) => setAuthorizedEmails(authorizedEmails.filter((em) => em !== e));

  const handleSave = async () => {
    if (!file) return;
    setIsSaving(true);
    const updateData = { access_level: accessLevel };
    if (accessLevel === "finance") updateData.finance_authorized_emails = authorizedEmails;
    await updateFileMutation.mutateAsync(updateData);
    setIsSaving(false);
  };

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Share File</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Access Level</Label>
            <Select value={accessLevel} onValueChange={setAccessLevel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ACCESS_LEVELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label} — {l.description}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {accessLevel === "finance" && (
            <div className="space-y-2">
              <Label>Authorized Emails</Label>
              <div className="flex gap-2">
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddEmail())} />
                <Button type="button" variant="outline" onClick={handleAddEmail}><Plus className="h-4 w-4" /></Button>
              </div>
              {authorizedEmails.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {authorizedEmails.map((e) => (
                    <Badge key={e} variant="secondary" className="gap-1">{e}<button onClick={() => handleRemoveEmail(e)}><X className="h-3 w-3" /></button></Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>{isSaving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : "Save Changes"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}