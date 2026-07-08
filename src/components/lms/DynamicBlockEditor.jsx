import { useState } from "react";
import RichTextBlockEditor from "@/components/lms/RichTextBlockEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Trash2, ChevronUp, ChevronDown, Type, Image as ImageIcon,
  BarChart3, Loader2, Upload,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const ANIMATIONS = [
  { value: "fade_in", label: "Fade In" },
  { value: "slide_up", label: "Slide Up" },
  { value: "slide_left", label: "Slide In" },
  { value: "drop_in", label: "Drop In" },
  { value: "zoom_in", label: "Zoom In" },
];

const ELEMENT_TYPES = [
  { value: "text", label: "Text", icon: Type },
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "chart", label: "Chart", icon: BarChart3 },
];

export default function DynamicBlockEditor({ data, onChange }) {
  const elements = data.elements || [];

  const update = (elements) => onChange({ elements });
  const updateEl = (idx, patch) => {
    const next = [...elements];
    next[idx] = { ...next[idx], ...patch };
    update(next);
  };
  const addEl = (type) => {
    const newEl = { id: crypto.randomUUID(), type, animation: "fade_in" };
    if (type === "text") newEl.content = "";
    if (type === "image") { newEl.url = ""; newEl.alt_text = ""; }
    if (type === "chart") { newEl.chart_type = "bar"; newEl.chart_title = ""; newEl.chart_data = ""; }
    update([...elements, newEl]);
  };
  const removeEl = (idx) => update(elements.filter((_, i) => i !== idx));
  const moveEl = (idx, dir) => {
    const next = [...elements];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    update(next);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs mb-1 block">Block Title (optional)</Label>
        <Input
          value={data.title || ""}
          onChange={e => onChange({ title: e.target.value })}
          placeholder="e.g. Interactive Walkthrough"
          className="text-sm h-8"
        />
      </div>

      <div className="space-y-2">
        {elements.map((el, idx) => (
          <div key={el.id} className="border rounded-md p-2.5 space-y-2 bg-muted/20">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium text-muted-foreground w-6 shrink-0">#{idx + 1}</span>
              <Badge variant="secondary" className="text-[10px] capitalize">{el.type}</Badge>
              <div className="ml-auto flex items-center gap-0.5">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveEl(idx, -1)} disabled={idx === 0}><ChevronUp className="w-3 h-3" /></Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveEl(idx, 1)} disabled={idx === elements.length - 1}><ChevronDown className="w-3 h-3" /></Button>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeEl(idx)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>

            <ElementEditor element={el} onChange={patch => updateEl(idx, patch)} />

            <div>
              <Label className="text-[10px] mb-0.5 block">Entrance Animation</Label>
              <div className="flex flex-wrap gap-1">
                {ANIMATIONS.map(a => (
                  <button
                    key={a.value}
                    onClick={() => updateEl(idx, { animation: a.value })}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${el.animation === a.value ? "bg-primary text-primary-foreground border-primary" : "bg-card border-input text-muted-foreground hover:bg-muted"}`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {elements.length === 0 && (
        <p className="text-xs text-muted-foreground italic text-center py-2">Add elements below — they'll be revealed one at a time when learners click.</p>
      )}

      <div className="flex gap-1.5">
        {ELEMENT_TYPES.map(et => {
          const Icon = et.icon;
          return (
            <Button key={et.value} size="sm" variant="outline" onClick={() => addEl(et.value)}>
              <Icon className="w-3 h-3 mr-1" /> {et.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function Badge({ variant, className, children }) {
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${variant === "secondary" ? "bg-secondary text-secondary-foreground" : ""} ${className}`}>{children}</span>;
}

function ElementEditor({ element, onChange }) {
  if (element.type === "text") {
    return (
      <RichTextBlockEditor
        value={element.content || ""}
        onChange={html => onChange({ content: html })}
      />
    );
  }

  if (element.type === "image") {
    return <ImageElementEditor element={element} onChange={onChange} />;
  }

  if (element.type === "chart") {
    return <ChartElementEditor element={element} onChange={onChange} />;
  }

  return null;
}

function ImageElementEditor({ element, onChange }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange({ url: file_url });
    } catch {
      // bubble
    }
    setUploading(false);
  };

  return (
    <div className="space-y-1.5">
      {element.url ? (
        <div className="relative">
          <img src={element.url} alt={element.alt_text || ""} className="max-h-32 rounded-md border" />
          <Button size="sm" variant="secondary" className="absolute top-1 right-1 h-6 text-xs" onClick={() => onChange({ url: "" })}>
            <Trash2 className="w-3 h-3 mr-1" /> Remove
          </Button>
        </div>
      ) : (
        <label className="flex items-center justify-center gap-1.5 border-2 border-dashed rounded-md py-4 cursor-pointer hover:bg-muted/30 transition-colors">
          {uploading ? <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" /> : <Upload className="w-4 h-4 text-muted-foreground" />}
          <span className="text-xs text-muted-foreground">{uploading ? "Uploading..." : "Upload image"}</span>
          <input type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} disabled={uploading} />
        </label>
      )}
      <Input
        value={element.alt_text || ""}
        onChange={e => onChange({ alt_text: e.target.value })}
        placeholder="Alt text (optional)"
        className="text-sm h-8"
      />
    </div>
  );
}

function ChartElementEditor({ element, onChange }) {
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        {["bar", "line", "pie"].map(t => (
          <button
            key={t}
            onClick={() => onChange({ chart_type: t })}
            className={`px-2 py-0.5 rounded text-[10px] font-medium border capitalize transition-colors ${element.chart_type === t ? "bg-primary text-primary-foreground border-primary" : "bg-card border-input text-muted-foreground hover:bg-muted"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <Input
        value={element.chart_title || ""}
        onChange={e => onChange({ chart_title: e.target.value })}
        placeholder="Chart title (optional)"
        className="text-sm h-8"
      />
      <div>
        <Label className="text-[10px] mb-0.5 block">Data (one per line: Label, Value)</Label>
        <Textarea
          value={element.chart_data || ""}
          onChange={e => onChange({ chart_data: e.target.value })}
          rows={4}
          placeholder={"January, 42\nFebruary, 55\nMarch, 38"}
          className="text-xs font-mono"
        />
      </div>
    </div>
  );
}