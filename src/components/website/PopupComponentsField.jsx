import { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Images, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import BrandAssetPickerDialog from "@/components/website/BrandAssetPickerDialog";

// The pieces that go into the pop-up image: the logo, the sunflower mark, a
// photo of the team. They are uploaded here (publicly stored, since the website
// is public) and handed to the AI image creator as references.
export default function PopupComponentsField({ components = [], onChange }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState("");

  const upload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      const uploaded = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
        uploaded.push({ name: file.name.replace(/\.[^.]+$/, ""), url: file_url });
      }
      onChange([...components, ...uploaded]);
    } catch (err) {
      setError(err.message || "That component could not be uploaded.");
    } finally {
      setUploading(false);
    }
  };

  const remove = (index) => onChange(components.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      <Label>Components to use in the image</Label>
      <p className="text-xs text-muted-foreground">
        Upload the pieces the image should include — the logo, a mark, a photo. The AI image creator
        reproduces them in the pop-up image.
      </p>

      {components.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {components.map((component, index) => (
            <div
              key={`${component.url}-${index}`}
              className="relative w-24 rounded-lg border border-border bg-muted/40 overflow-hidden"
            >
              <img src={component.url} alt={component.name || ""} className="w-full h-16 object-contain p-1" />
              <p className="px-1.5 pb-1 text-[10px] text-muted-foreground truncate">{component.name}</p>
              <button
                type="button"
                onClick={() => remove(index)}
                title="Remove component"
                className="absolute top-1 right-1 rounded-md bg-white/90 p-0.5 text-muted-foreground hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

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
          {uploading ? "Uploading…" : "Upload components"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setPickerOpen(true)} className="gap-1.5">
          <Images className="w-3.5 h-3.5" /> Brand assets
        </Button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={upload} />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <BrandAssetPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPick={(url, name) => {
          onChange([...components, { name: name || "Brand asset", url }]);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}