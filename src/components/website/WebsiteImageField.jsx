import { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Images, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BrandAssetPickerDialog from "@/components/website/BrandAssetPickerDialog";

// One image field for Website Studio: upload a file, choose an approved brand
// asset, or paste a link. Uploads go to public storage because the website is
// public — anyone with the link can open them.
export default function WebsiteImageField({ label = "Image", value, onChange, hint }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState("");

  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      onChange(file_url);
    } catch (err) {
      setError(err.message || "The image could not be uploaded.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {value ? (
        <div className="relative w-full max-w-xs rounded-lg border border-border bg-muted/40 overflow-hidden">
          <img src={value} alt="" className="w-full h-32 object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            title="Remove image"
            className="absolute top-1.5 right-1.5 rounded-md bg-white/90 p-1 text-muted-foreground hover:text-destructive"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="gap-1.5"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {uploading ? "Uploading…" : value ? "Replace image" : "Upload image"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setPickerOpen(true)} className="gap-1.5">
          <Images className="w-3.5 h-3.5" /> Brand assets
        </Button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={upload} />
      </div>

      <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="…or paste an image link" />

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}

      <BrandAssetPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPick={(url) => {
          onChange(url);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}