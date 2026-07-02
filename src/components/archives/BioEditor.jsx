import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import RichTextEditor from "./RichTextEditor";
import { Upload, Loader2 } from "lucide-react";

const ROLES = [
  { value: "executive_director", label: "Executive Director" },
  { value: "board_chair", label: "Board Chair" },
  { value: "board_member", label: "Board Member" },
  { value: "founder", label: "Founder" },
  { value: "key_staff", label: "Key Staff" },
  { value: "community_champion", label: "Community Champion" },
  { value: "other", label: "Other" },
];

export default function BioEditor({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial || {
        person_name: "", role_title: "executive_director", role_label: "",
        term_start: "", term_end: "", is_current: false,
        bio_content: "", photo_url: "", highlights: [],
      });
    }
  }, [open, initial]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      update("photo_url", file_url);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!form.person_name?.trim()) return;
    onSave({
      ...form,
      highlights: Array.isArray(form.highlights) ? form.highlights : String(form.highlights || "").split("\n").filter(Boolean),
    });
  };

  const highlightsText = Array.isArray(form.highlights) ? form.highlights.join("\n") : (form.highlights || "");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Bio" : "Add Bio"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Full Name *</Label>
            <Input value={form.person_name || ""} onChange={e => update("person_name", e.target.value)} placeholder="e.g. Jane Doe" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Role *</Label>
              <Select value={form.role_title || "executive_director"} onValueChange={v => update("role_title", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Custom Role Label</Label>
              <Input value={form.role_label || ""} onChange={e => update("role_label", e.target.value)} placeholder="e.g. Founding ED" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Term Start</Label>
              <Input type="date" value={form.term_start || ""} onChange={e => update("term_start", e.target.value)} />
            </div>
            <div>
              <Label>Term End</Label>
              <Input type="date" value={form.term_end || ""} onChange={e => update("term_end", e.target.value)} disabled={form.is_current} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_current || false} onCheckedChange={v => update("is_current", v)} />
            <Label>Currently in this role</Label>
          </div>
          <div>
            <Label>Photo</Label>
            <div className="flex items-center gap-3">
              {form.photo_url && <img src={form.photo_url} alt="" className="w-16 h-16 rounded-full object-cover" />}
              <label>
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                <Button variant="outline" size="sm" disabled={uploading} asChild>
                  <span>{uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}Upload Photo</span>
                </Button>
              </label>
            </div>
          </div>
          <div>
            <Label>Biography</Label>
            <RichTextEditor value={form.bio_content} onChange={v => update("bio_content", v)} placeholder="Full biography..." />
          </div>
          <div>
            <Label>Key Highlights (one per line)</Label>
            <Textarea value={highlightsText} onChange={e => update("highlights", e.target.value.split("\n"))} placeholder="Achievement one&#10;Achievement two" rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.person_name?.trim()}>{initial ? "Save Changes" : "Add Bio"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}