import { useState } from "react";
import {
  FileText, Image as ImageIcon, Video, File, Link2, MessageSquare,
  CheckSquare, HelpCircle, ChevronDown, ChevronUp, Table as TableIcon, Plus, Trash2, Presentation, Upload, Loader2, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import {
  CONTENT_BLOCK_TYPES, CALLOUT_VARIANTS, getBlockType,
} from "@/lib/lmsConstants";
import SlideBlockEditor from "@/components/lms/SlideBlockEditor";
import DynamicBlockEditor from "@/components/lms/DynamicBlockEditor";
import RichTextBlockEditor from "@/components/lms/RichTextBlockEditor";

const ICON_MAP = {
  rich_text: FileText, image: ImageIcon, video: Video, pdf: File,
  external_link: Link2, callout: MessageSquare, checklist: CheckSquare,
  knowledge_check: HelpCircle, accordion: ChevronDown, table: TableIcon, slides: Presentation, dynamic: Sparkles,
};

export default function ContentBlockRenderer({ block, onChange, onDelete, onMoveUp, onMoveDown, canMoveUp, canMoveDown }) {
  const blockType = getBlockType(block.type);
  const BlockIcon = ICON_MAP[block.type] || FileText;

  const updateData = (data) => onChange({ ...block, data: { ...block.data, ...data } });

  return (
    <div className="border rounded-lg bg-card overflow-hidden border-l-4 border-l-amber-400">
      {/* Block header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b bg-amber-50/50">
        <div className="flex items-center gap-1.5">
          <BlockIcon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">{blockType.label}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onMoveUp} disabled={!canMoveUp}><ChevronUp className="w-3.5 h-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onMoveDown} disabled={!canMoveDown}><ChevronDown className="w-3.5 h-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      </div>

      {/* Block editor */}
      <div className="p-3">
        <BlockEditor type={block.type} data={block.data || {}} onChange={updateData} />
      </div>
    </div>
  );
}

function BlockEditor({ type, data, onChange }) {
  switch (type) {
    case "rich_text":
      return <RichTextBlockEditor value={data.html || ""} onChange={html => onChange({ html })} />;
    case "image":
      return <ImageBlockEditor data={data} onChange={onChange} />;
    case "video":
      return (
        <div className="space-y-2">
          <div>
            <Label className="text-xs mb-1 block">Video URL (YouTube, Vimeo, or direct link)</Label>
            <Input value={data.url || ""} onChange={e => onChange({ url: e.target.value })} placeholder="https://youtube.com/watch?v=..." className="text-sm h-8" />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Title (optional)</Label>
            <Input value={data.title || ""} onChange={e => onChange({ title: e.target.value })} placeholder="Video title..." className="text-sm h-8" />
          </div>
          {data.url && data.url.includes("youtube") && (
            <div className="aspect-video rounded-md overflow-hidden border">
              <iframe src={data.url.replace("watch?v=", "embed/")} className="w-full h-full" title={data.title || "Video"} allowFullScreen />
            </div>
          )}
        </div>
      );
    case "pdf":
      return (
        <div className="space-y-2">
          <div>
            <Label className="text-xs mb-1 block">PDF URL</Label>
            <Input value={data.url || ""} onChange={e => onChange({ url: e.target.value })} placeholder="https://..." className="text-sm h-8" />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Title (optional)</Label>
            <Input value={data.title || ""} onChange={e => onChange({ title: e.target.value })} placeholder="Document title..." className="text-sm h-8" />
          </div>
          {data.url && <iframe src={data.url} className="w-full h-48 rounded-md border" title={data.title || "PDF"} />}
        </div>
      );
    case "external_link":
      return (
        <div className="space-y-2">
          <div>
            <Label className="text-xs mb-1 block">URL</Label>
            <Input value={data.url || ""} onChange={e => onChange({ url: e.target.value })} placeholder="https://..." className="text-sm h-8" />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Link Label</Label>
            <Input value={data.label || ""} onChange={e => onChange({ label: e.target.value })} placeholder="e.g. Read the full policy document" className="text-sm h-8" />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Description (optional)</Label>
            <Textarea value={data.description || ""} onChange={e => onChange({ description: e.target.value })} rows={2} placeholder="Brief description of what the link contains..." className="text-sm" />
          </div>
        </div>
      );
    case "callout":
      const variant = CALLOUT_VARIANTS.find(v => v.value === data.variant) || CALLOUT_VARIANTS[0];
      return (
        <div className="space-y-2">
          <div className="flex gap-1.5">
            {CALLOUT_VARIANTS.map(v => (
              <button key={v.value} onClick={() => onChange({ variant: v.value })}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${data.variant === v.value ? "bg-primary text-primary-foreground border-primary" : "bg-card border-input text-muted-foreground hover:bg-muted"}`}>
                {v.icon} {v.label}
              </button>
            ))}
          </div>
          <div className={`${variant.color} border rounded-md p-3`}>
            <Input value={data.title || ""} onChange={e => onChange({ title: e.target.value })} placeholder="Callout title..." className={`text-sm h-8 bg-white/50 border-transparent mb-1.5`} />
            <Textarea value={data.content || ""} onChange={e => onChange({ content: e.target.value })} rows={2} placeholder="Callout content..." className={`text-sm bg-white/50 border-transparent`} />
          </div>
        </div>
      );
    case "checklist":
      return (
        <div className="space-y-1.5">
          {(data.items || []).map((item, idx) => (
            <div key={item.id} className="flex items-center gap-2">
              <input type="checkbox" checked={item.checked} onChange={e => {
                const items = [...(data.items || [])];
                items[idx] = { ...items[idx], checked: e.target.checked };
                onChange({ items });
              }} className="w-4 h-4 rounded shrink-0" />
              <Input value={item.text} onChange={e => {
                const items = [...(data.items || [])];
                items[idx] = { ...items[idx], text: e.target.value };
                onChange({ items });
              }} placeholder={`Checklist item ${idx + 1}`} className="text-sm h-8" />
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0" onClick={() => {
                const items = (data.items || []).filter((_, i) => i !== idx);
                onChange({ items });
              }}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          ))}
          <Button size="sm" variant="ghost" onClick={() => onChange({ items: [...(data.items || []), { id: crypto.randomUUID(), text: "", checked: false }] })}>
            <Plus className="w-3 h-3 mr-1" /> Add Item
          </Button>
        </div>
      );
    case "knowledge_check":
      return (
        <div className="space-y-2">
          <div>
            <Label className="text-xs mb-1 block">Question</Label>
            <Input value={data.question || ""} onChange={e => onChange({ question: e.target.value })} placeholder="e.g. What is the correct procedure for..." className="text-sm h-8" />
          </div>
          {(data.options || []).map((opt, oIdx) => (
            <div key={oIdx} className="flex items-center gap-2">
              <button onClick={() => onChange({ correct_index: oIdx })}
                className={`w-4 h-4 rounded-full border-2 shrink-0 ${data.correct_index === oIdx ? "border-green-500 bg-green-500" : "border-slate-300"}`}
                title="Mark as correct" />
              <Input value={opt} onChange={e => {
                const options = [...(data.options || [])];
                options[oIdx] = e.target.value;
                onChange({ options });
              }} placeholder={`Option ${oIdx + 1}`} className="text-sm h-8 flex-1" />
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0" disabled={(data.options || []).length <= 2}
                onClick={() => {
                  const options = (data.options || []).filter((_, i) => i !== oIdx);
                  const newCorrect = oIdx < data.correct_index ? data.correct_index - 1 : (oIdx === data.correct_index ? 0 : data.correct_index);
                  onChange({ options, correct_index: newCorrect });
                }}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <Button size="sm" variant="ghost" onClick={() => onChange({ options: [...(data.options || []), ""] })}>
              <Plus className="w-3 h-3 mr-1" /> Add Option
            </Button>
            <span className="text-[10px] text-muted-foreground">Click circle to mark correct answer</span>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Explanation (shown after answering)</Label>
            <Textarea value={data.explanation || ""} onChange={e => onChange({ explanation: e.target.value })} rows={2} placeholder="Why is this the correct answer?" className="text-sm" />
          </div>
        </div>
      );
    case "accordion":
      return (
        <div className="space-y-2">
          {(data.items || []).map((item, idx) => (
            <div key={item.id} className="border rounded-md p-2 space-y-1.5 bg-muted/20">
              <div className="flex items-center gap-2">
                <Input value={item.title} onChange={e => {
                  const items = [...(data.items || [])];
                  items[idx] = { ...items[idx], title: e.target.value };
                  onChange({ items });
                }} placeholder="Section title..." className="text-sm h-8 font-medium" />
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0" onClick={() => {
                  const items = (data.items || []).filter((_, i) => i !== idx);
                  onChange({ items });
                }}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
              <Textarea value={item.content} onChange={e => {
                const items = [...(data.items || [])];
                items[idx] = { ...items[idx], content: e.target.value };
                onChange({ items });
              }} rows={2} placeholder="Section content (shown when expanded)..." className="text-sm" />
            </div>
          ))}
          <Button size="sm" variant="ghost" onClick={() => onChange({ items: [...(data.items || []), { id: crypto.randomUUID(), title: "", content: "" }] })}>
            <Plus className="w-3 h-3 mr-1" /> Add Section
          </Button>
        </div>
      );
    case "table":
      return (
        <div className="space-y-2">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label className="text-xs mb-1 block">Headers (comma-separated)</Label>
              <Input value={(data.headers || []).join(", ")} onChange={e => {
                const headers = e.target.value.split(",").map(h => h.trim());
                onChange({ headers });
              }} placeholder="Column 1, Column 2, Column 3" className="text-sm h-8" />
            </div>
          </div>
          {(data.rows || []).map((row, rIdx) => (
            <div key={rIdx} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-6 shrink-0">R{rIdx + 1}</span>
              <Input value={row.join(", ")} onChange={e => {
                const rows = [...(data.rows || [])];
                rows[rIdx] = e.target.value.split(",").map(c => c.trim());
                onChange({ rows });
              }} placeholder="Cell 1, Cell 2, Cell 3" className="text-sm h-8 flex-1" />
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0" onClick={() => {
                const rows = (data.rows || []).filter((_, i) => i !== rIdx);
                onChange({ rows });
              }}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          ))}
          <Button size="sm" variant="ghost" onClick={() => onChange({ rows: [...(data.rows || []), Array((data.headers || []).length || 2).fill("")] })}>
            <Plus className="w-3 h-3 mr-1" /> Add Row
          </Button>
          {(data.headers?.length > 0 || data.rows?.length > 0) && (
            <div className="overflow-x-auto border rounded-md">
              <table className="w-full text-sm">
                {data.headers?.length > 0 && (
                  <thead className="bg-muted/50">
                    <tr>{data.headers.map((h, i) => <th key={i} className="px-3 py-1.5 text-left font-medium text-xs border-b">{h}</th>)}</tr>
                  </thead>
                )}
                <tbody>
                  {(data.rows || []).map((row, rIdx) => (
                    <tr key={rIdx} className="border-b last:border-0">
                      {(data.headers || []).map((_, cIdx) => <td key={cIdx} className="px-3 py-1.5">{row[cIdx]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    case "slides":
      return <SlideBlockEditor data={data} onChange={onChange} />;
    case "dynamic":
      return <DynamicBlockEditor data={data} onChange={onChange} />;
    default:
      return <p className="text-xs text-muted-foreground italic">Unknown block type: {type}</p>;
  }
}

function ImageBlockEditor({ data, onChange }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange({ url: file_url });
    } catch {
      // let it bubble
    }
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      {data.url ? (
        <div className="relative group">
          <img src={data.url} alt={data.alt_text || ""} className="max-h-40 rounded-md border" />
          <Button
            size="sm"
            variant="secondary"
            className="absolute top-1 right-1 opacity-90"
            onClick={() => onChange({ url: "" })}
          >
            <Trash2 className="w-3 h-3 mr-1" /> Remove
          </Button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed rounded-lg py-6 cursor-pointer hover:bg-muted/30 transition-colors">
          {uploading ? (
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          ) : (
            <Upload className="w-5 h-5 text-muted-foreground" />
          )}
          <span className="text-xs text-muted-foreground">{uploading ? "Uploading..." : "Click to upload an image"}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => handleFile(e.target.files?.[0])}
            disabled={uploading}
          />
        </label>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs mb-1 block">Caption (optional)</Label>
          <Input value={data.caption || ""} onChange={e => onChange({ caption: e.target.value })} placeholder="Caption..." className="text-sm h-8" />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Alt Text (optional)</Label>
          <Input value={data.alt_text || ""} onChange={e => onChange({ alt_text: e.target.value })} placeholder="Alt text..." className="text-sm h-8" />
        </div>
      </div>
    </div>
  );
}