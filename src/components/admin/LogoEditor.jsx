import { useRef, useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Type, Eraser, RotateCcw, Download, Save, Minus, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";

const FILTERS = [
  { label: "None", value: "none" },
  { label: "Grayscale", value: "grayscale(100%)" },
  { label: "Sepia", value: "sepia(80%)" },
  { label: "Invert", value: "invert(100%)" },
  { label: "Brightness", value: "brightness(1.4)" },
  { label: "Contrast", value: "contrast(1.5)" },
  { label: "Saturate", value: "saturate(2)" },
];

const COLORS = ["#000000", "#ffffff", "#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"];

export default function LogoEditor({ open, onClose, logoUrl, onSave }) {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState("draw");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(4);
  const [filter, setFilter] = useState("none");
  const [textInput, setTextInput] = useState("");
  const [textPos, setTextPos] = useState(null);
  const [fontSize, setFontSize] = useState(24);
  const [drawing, setDrawing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const lastPos = useRef(null);
  const baseImageRef = useRef(null); // store the original Image for filter reapplication

  const loadImageOntoCanvas = (canvas, imgEl, filterVal) => {
    const ctx = canvas.getContext("2d");
    canvas.width = imgEl.naturalWidth || 400;
    canvas.height = imgEl.naturalHeight || 400;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (filterVal && filterVal !== "none") ctx.filter = filterVal;
    ctx.drawImage(imgEl, 0, 0);
    ctx.filter = "none";
    setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  };

  // Stable callback ref — only fires when the DOM node mounts/unmounts, not on every render
  const setCanvasRef = useCallback((node) => {
    canvasRef.current = node;
  }, []);

  // Load image onto canvas when dialog opens
  useEffect(() => {
    if (!open) {
      setHistory([]);
      baseImageRef.current = null;
      setFilter("none");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas || !logoUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      baseImageRef.current = img;
      loadImageOntoCanvas(canvas, img, "none");
    };
    img.src = logoUrl + (logoUrl.includes('?') ? '&' : '?') + '_t=' + Date.now();
  }, [open, logoUrl]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const pushHistory = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    setHistory(h => [...h.slice(-19), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  };

  const undo = () => {
    if (history.length < 2) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const prev = history[history.length - 2];
    ctx.putImageData(prev, 0, 0);
    setHistory(h => h.slice(0, -1));
  };

  const onMouseDown = (e) => {
    if (tool === "text") {
      const pos = getPos(e);
      setTextPos(pos);
      return;
    }
    pushHistory();
    setDrawing(true);
    lastPos.current = getPos(e);
  };

  const onMouseMove = (e) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === "erase" ? null : color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.globalCompositeOperation = tool === "erase" ? "destination-out" : "source-over";
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
    lastPos.current = pos;
  };

  const onMouseUp = () => setDrawing(false);

  const placeText = () => {
    if (!textInput.trim() || !textPos) return;
    pushHistory();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(textInput, textPos.x, textPos.y);
    setTextInput("");
    setTextPos(null);
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    setSaving(true);
    try {
      // Bake CSS filter into the export canvas
      let exportCanvas = canvas;
      if (filter && filter !== "none") {
        exportCanvas = document.createElement("canvas");
        exportCanvas.width = canvas.width;
        exportCanvas.height = canvas.height;
        const ctx2 = exportCanvas.getContext("2d");
        ctx2.filter = filter;
        ctx2.drawImage(canvas, 0, 0);
        ctx2.filter = "none";
      }
      const blob = await new Promise(res => exportCanvas.toBlob(res, "image/png"));
      const { file_url } = await base44.integrations.Core.UploadFile({ file: blob });
      onSave(file_url);
      onClose();
    } catch {
      alert("Failed to save logo");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const a = document.createElement("a");
    a.download = "logo-edited.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>Edit Logo</DialogTitle>
        </DialogHeader>

        <div className="flex gap-0 h-[560px]">
          {/* Toolbar */}
          <div className="w-48 flex-shrink-0 border-r bg-muted/30 p-3 flex flex-col gap-4 overflow-y-auto">
            {/* Tools */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Tool</p>
              <div className="flex flex-col gap-1">
                {[
                  { id: "draw", icon: Pencil, label: "Draw" },
                  { id: "erase", icon: Eraser, label: "Erase" },
                  { id: "text", icon: Type, label: "Text" },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTool(t.id)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors ${tool === t.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  >
                    <t.icon className="w-3.5 h-3.5" /> {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Color</p>
              <div className="grid grid-cols-4 gap-1 mb-1.5">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-md border-2 transition-transform ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-7 rounded cursor-pointer border-0" />
            </div>

            {/* Brush size */}
            {(tool === "draw" || tool === "erase") && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Size: {brushSize}px</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setBrushSize(s => Math.max(1, s - 2))} className="p-1 rounded hover:bg-muted"><Minus className="w-3 h-3" /></button>
                  <input type="range" min={1} max={40} value={brushSize} onChange={e => setBrushSize(+e.target.value)} className="flex-1" />
                  <button onClick={() => setBrushSize(s => Math.min(40, s + 2))} className="p-1 rounded hover:bg-muted"><Plus className="w-3 h-3" /></button>
                </div>
              </div>
            )}

            {/* Text options */}
            {tool === "text" && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Text</p>
                <input
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder="Type text…"
                  className="w-full text-sm border rounded px-2 py-1 bg-background"
                />
                <p className="text-xs text-muted-foreground">Size: {fontSize}px</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setFontSize(s => Math.max(8, s - 4))} className="p-1 rounded hover:bg-muted"><Minus className="w-3 h-3" /></button>
                  <input type="range" min={8} max={96} value={fontSize} onChange={e => setFontSize(+e.target.value)} className="flex-1" />
                  <button onClick={() => setFontSize(s => Math.min(96, s + 4))} className="p-1 rounded hover:bg-muted"><Plus className="w-3 h-3" /></button>
                </div>
                {textPos && (
                  <Button size="sm" className="w-full" onClick={placeText} disabled={!textInput.trim()}>
                    Place Text
                  </Button>
                )}
                {!textPos && <p className="text-xs text-muted-foreground italic">Click on the canvas to place</p>}
              </div>
            )}

            {/* Filter */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Filter</p>
              <div className="flex flex-col gap-0.5">
                {FILTERS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={`text-left px-2 py-1 rounded text-xs transition-colors ${filter === f.value ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-auto flex flex-col gap-1.5">
              <Button variant="outline" size="sm" onClick={undo} className="gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> Undo
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
                <Download className="w-3.5 h-3.5" /> Download
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                <Save className="w-3.5 h-3.5" /> {saving ? "Saving…" : "Save Logo"}
              </Button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto bg-[#f0f0f0] flex items-center justify-center">
            <canvas
              ref={setCanvasRef}
              className="max-w-full max-h-full object-contain shadow-lg"
              style={{ cursor: "crosshair", imageRendering: "pixelated", filter: filter !== "none" ? filter : undefined }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onTouchStart={onMouseDown}
              onTouchMove={onMouseMove}
              onTouchEnd={onMouseUp}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}