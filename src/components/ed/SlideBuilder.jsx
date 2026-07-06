import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, Copy, ChevronUp, ChevronDown, Play, X,
  ChevronLeft, ChevronRight, Layout, FileText, AlignLeft, Image as ImageIcon, Monitor
} from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "image"],
    [{ align: [] }],
    [{ color: [] }, { background: [] }],
    ["clean"],
  ],
};

const LAYOUTS = [
  { value: "title_bullets", label: "Title + Bullets", icon: AlignLeft },
  { value: "title_content", label: "Title + Rich Text", icon: FileText },
  { value: "title_only", label: "Title Only", icon: Layout },
  { value: "section_divider", label: "Section Divider", icon: Layout },
  { value: "image_with_caption", label: "Image + Caption", icon: ImageIcon },
];

function emptySlide(order = 0) {
  return {
    id: crypto.randomUUID(),
    title: "",
    layout: "title_bullets",
    bullets: [""],
    content_html: "",
    speaker_notes: "",
    background_image_url: "",
    image_caption: "",
    sort_order: order,
  };
}

export default function SlideBuilder({ slides = [], onChange }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [preview, setPreview] = useState(false);

  const current = slides[selectedIdx] || null;

  const addSlide = () => {
    const newSlide = emptySlide(slides.length);
    onChange([...slides, newSlide]);
    setSelectedIdx(slides.length);
  };

  const duplicateSlide = (idx) => {
    const orig = slides[idx];
    if (!orig) return;
    const copy = { ...orig, id: crypto.randomUUID(), title: orig.title + " (Copy)" };
    const arr = [...slides];
    arr.splice(idx + 1, 0, copy);
    onChange(arr);
    setSelectedIdx(idx + 1);
  };

  const deleteSlide = (idx) => {
    if (slides.length <= 1) {
      onChange([emptySlide(0)]);
      setSelectedIdx(0);
      return;
    }
    const arr = slides.filter((_, i) => i !== idx);
    onChange(arr);
    setSelectedIdx(Math.max(0, idx - 1));
  };

  const moveSlide = (idx, dir) => {
    const ni = idx + dir;
    if (ni < 0 || ni >= slides.length) return;
    const arr = [...slides];
    [arr[idx], arr[ni]] = [arr[ni], arr[idx]];
    onChange(arr);
    setSelectedIdx(ni);
  };

  const updateSlide = (idx, field, value) => {
    const arr = [...slides];
    arr[idx] = { ...arr[idx], [field]: value };
    onChange(arr);
  };

  const updateBullet = (idx, bIdx, value) => {
    const bullets = [...(slides[idx].bullets || [])];
    bullets[bIdx] = value;
    updateSlide(idx, "bullets", bullets);
  };

  const addBullet = (idx) => {
    const bullets = [...(slides[idx].bullets || []), ""];
    updateSlide(idx, "bullets", bullets);
  };

  const removeBullet = (idx, bIdx) => {
    const bullets = (slides[idx].bullets || []).filter((_, i) => i !== bIdx);
    updateSlide(idx, "bullets", bullets);
  };

  if (slides.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <Monitor className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground mb-3">No slides yet. Create your first slide to start building a presentation.</p>
        <Button onClick={addSlide}><Plus className="w-4 h-4 mr-1" /> Add First Slide</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={addSlide}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Slide
          </Button>
          {current && (
            <Button size="sm" variant="ghost" onClick={() => duplicateSlide(selectedIdx)}>
              <Copy className="w-3.5 h-3.5 mr-1" /> Duplicate
            </Button>
          )}
        </div>
        <Button size="sm" variant="secondary" onClick={() => setPreview(true)} disabled={slides.length === 0}>
          <Play className="w-3.5 h-3.5 mr-1" /> Preview
        </Button>
      </div>

      <div className="flex gap-3" style={{ minHeight: "420px" }}>
        {/* Slide list / thumbnails */}
        <div className="w-44 shrink-0 space-y-2 overflow-y-auto pr-1" style={{ maxHeight: "500px" }}>
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              onClick={() => setSelectedIdx(idx)}
              className={`border-2 rounded-lg p-2 cursor-pointer transition-colors bg-card ${
                idx === selectedIdx ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-primary/40"
              }`}
            >
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[10px] font-bold text-muted-foreground">{idx + 1}</span>
                <span className="text-[10px] text-muted-foreground truncate flex-1">{LAYOUTS.find(l => l.value === slide.layout)?.label || "Slide"}</span>
              </div>
              <div className="bg-muted/40 rounded p-2 min-h-[48px]">
                <p className="text-[11px] font-medium line-clamp-2 leading-tight">{slide.title || "Untitled slide"}</p>
                {slide.bullets?.length > 0 && slide.layout === "title_bullets" && (
                  <p className="text-[9px] text-muted-foreground mt-1 line-clamp-2">
                    {slide.bullets.filter(b => b.trim()).length} bullet(s)
                  </p>
                )}
              </div>
              <div className="flex items-center gap-0.5 mt-1 justify-end">
                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); moveSlide(idx, -1); }} disabled={idx === 0}>
                  <ChevronUp className="w-3 h-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); moveSlide(idx, 1); }} disabled={idx === slides.length - 1}>
                  <ChevronDown className="w-3 h-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-5 w-5 text-destructive" onClick={(e) => { e.stopPropagation(); deleteSlide(idx); }}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full" onClick={addSlide}>
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>

        {/* Slide editor */}
        {current && (
          <div className="flex-1 border rounded-lg p-4 space-y-3 overflow-y-auto" style={{ maxHeight: "500px" }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">Slide {selectedIdx + 1} of {slides.length}</span>
              <Badge variant="outline" className="text-[10px]">{LAYOUTS.find(l => l.value === current.layout)?.label}</Badge>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Slide Title</label>
              <input
                type="text"
                value={current.title}
                onChange={e => updateSlide(selectedIdx, "title", e.target.value)}
                placeholder="Enter slide title..."
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm font-medium"
              />
            </div>

            {/* Layout selector */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Layout</label>
              <div className="flex flex-wrap gap-1.5">
                {LAYOUTS.map(lay => {
                  const LayIcon = lay.icon;
                  return (
                    <button
                      key={lay.value}
                      onClick={() => updateSlide(selectedIdx, "layout", lay.value)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                        current.layout === lay.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-input text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <LayIcon className="w-3 h-3" /> {lay.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content based on layout */}
            {current.layout === "title_bullets" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-muted-foreground">Bullet Points</label>
                  <Button size="sm" variant="ghost" className="h-6" onClick={() => addBullet(selectedIdx)}>
                    <Plus className="w-3 h-3 mr-1" /> Add Bullet
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {(current.bullets || []).map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-primary/15 text-primary text-[10px] flex items-center justify-center shrink-0">•</span>
                      <input
                        type="text"
                        value={bullet}
                        onChange={e => updateBullet(selectedIdx, bIdx, e.target.value)}
                        placeholder={`Bullet point ${bIdx + 1}`}
                        className="flex-1 h-8 rounded-md border border-input bg-transparent px-2.5 text-sm"
                      />
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0" onClick={() => removeBullet(selectedIdx, bIdx)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  {(current.bullets || []).length === 0 && (
                    <p className="text-xs text-muted-foreground/60 italic">No bullets yet. Click "Add Bullet".</p>
                  )}
                </div>
              </div>
            )}

            {current.layout === "title_content" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Content</label>
                <div className="border rounded-md overflow-hidden">
                  <ReactQuill
                    theme="snow"
                    value={current.content_html || ""}
                    onChange={html => updateSlide(selectedIdx, "content_html", html)}
                    modules={quillModules}
                    style={{ minHeight: "150px" }}
                  />
                </div>
              </div>
            )}

            {(current.layout === "title_only" || current.layout === "section_divider") && (
              <div className="bg-muted/30 border rounded-lg p-6 text-center">
                <p className="text-xs text-muted-foreground">
                  {current.layout === "section_divider"
                    ? "This slide type displays only the title as a full-screen section break."
                    : "This slide type displays only the title — useful for transitions or emphasis."}
                </p>
              </div>
            )}

            {current.layout === "image_with_caption" && (
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Image URL</label>
                  <input
                    type="text"
                    value={current.background_image_url || ""}
                    onChange={e => updateSlide(selectedIdx, "background_image_url", e.target.value)}
                    placeholder="Paste image URL..."
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  />
                </div>
                {current.background_image_url && (
                  <img src={current.background_image_url} alt="" className="max-h-32 rounded-md border object-cover" />
                )}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Caption</label>
                  <input
                    type="text"
                    value={current.image_caption || ""}
                    onChange={e => updateSlide(selectedIdx, "image_caption", e.target.value)}
                    placeholder="Image caption..."
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Speaker notes */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Speaker Notes</label>
              <textarea
                value={current.speaker_notes || ""}
                onChange={e => updateSlide(selectedIdx, "speaker_notes", e.target.value)}
                placeholder="Notes for the presenter (not shown to learners)..."
                rows={3}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Preview overlay */}
      {preview && (
        <SlidePreview slides={slides} onClose={() => setPreview(false)} />
      )}
    </div>
  );
}

function SlidePreview({ slides, onClose }) {
  const [idx, setIdx] = useState(0);
  const slide = slides[idx];

  const next = () => setIdx(i => Math.min(slides.length - 1, i + 1));
  const prev = () => setIdx(i => Math.max(0, i - 1));

  if (!slide) return null;

  const isDivider = slide.layout === "section_divider" || slide.layout === "title_only";

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white/70 hover:text-white z-10" onClick={onClose}>
        <X className="w-8 h-8" />
      </button>

      {/* Slide canvas */}
      <div
        className="bg-white rounded-lg shadow-2xl flex flex-col justify-center p-12 relative overflow-hidden"
        style={{ width: "960px", height: "540px", maxWidth: "95vw", maxHeight: "80vh" }}
        onClick={e => e.stopPropagation()}
      >
        {slide.background_image_url && slide.layout === "image_with_caption" ? (
          <>
            <img src={slide.background_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 text-center text-white">
              {slide.title && <h2 className="text-3xl font-bold mb-4">{slide.title}</h2>}
              {slide.image_caption && <p className="text-lg opacity-90">{slide.image_caption}</p>}
            </div>
          </>
        ) : isDivider ? (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-slate-800">{slide.title || "Untitled"}</h2>
          </div>
        ) : (
          <div className="space-y-4">
            {slide.title && <h2 className="text-3xl font-bold text-slate-800 border-b-2 border-primary pb-2">{slide.title}</h2>}
            {slide.layout === "title_bullets" && slide.bullets?.filter(b => b.trim()).length > 0 && (
              <ul className="space-y-2">
                {slide.bullets.filter(b => b.trim()).map((b, i) => (
                  <li key={i} className="text-lg text-slate-700 flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2.5 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
            {slide.layout === "title_content" && slide.content_html && (
              <div className="text-slate-700" dangerouslySetInnerHTML={{ __html: slide.content_html }} />
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4" onClick={e => e.stopPropagation()}>
        <Button variant="outline" size="icon" onClick={prev} disabled={idx === 0} className="bg-white">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="text-white/80 text-sm">{idx + 1} / {slides.length}</span>
        <Button variant="outline" size="icon" onClick={next} disabled={idx === slides.length - 1} className="bg-white">
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}