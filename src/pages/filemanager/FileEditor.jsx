import React, { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Download, Undo, Redo, Trash2, Type, Image as ImageIcon, PenSquare, Check, X } from "lucide-react";
import { toast } from "sonner";
import SignatureDialog from "@/components/files/SignatureDialog";

export default function FileEditor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileId = searchParams.get("id");
  const canvasRef = useRef(null);
  const [tool, setTool] = useState("select");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showSignature, setShowSignature] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const { data: file } = useQuery({
    queryKey: ["file", fileId],
    queryFn: () => base44.entities.File.get(fileId),
    enabled: !!fileId,
  });

  const queryClient = useQueryClient();

  const updateFileMutation = useMutation({
    mutationFn: (data) => base44.entities.File.update(fileId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("File updated");
    },
  });

  const saveToCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), dataUrl]);
    setHistoryIndex((prev) => prev + 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = history[historyIndex - 1];
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = history[historyIndex + 1];
    }
  };

  const startDrawing = (e) => {
    if (tool !== "draw") return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || tool !== "draw") return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToCanvas();
    }
  };

  const applySignature = (sigDataUrl) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, canvas.width / 2 - 100, canvas.height / 2 - 50, 200, 100);
      saveToCanvas();
    };
    img.src = sigDataUrl;
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `${file?.display_name || "edited"}-annotated.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  useEffect(() => {
    if (file && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        saveToCanvas();
      };
      img.src = file.file_url;
    }
  }, [file]);

  if (!file) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="flex items-center justify-between p-3 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
            <h1 className="text-lg font-semibold">{file.display_name || file.original_name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <button onClick={() => setTool("select")} className={`h-8 px-3 rounded text-xs ${tool === "select" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>Select</button>
              <button onClick={() => setTool("draw")} className={`h-8 px-3 rounded text-xs ${tool === "draw" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}><PenSquare className="h-3 w-3" /></button>
              <button onClick={() => setShowSignature(true)} className="h-8 px-3 rounded text-xs hover:bg-muted"><Type className="h-3 w-3" /></button>
            </div>
            <div className="flex items-center gap-2 border-l pl-3">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer" />
              <input type="range" min="1" max="20" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-20" />
            </div>
            <Button variant="outline" size="icon" onClick={handleUndo} disabled={historyIndex <= 0}><Undo className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" onClick={handleRedo} disabled={historyIndex >= history.length - 1}><Redo className="h-4 w-4" /></Button>
            <Button size="sm" onClick={handleDownload} className="gap-1"><Download className="h-4 w-4" /> Download</Button>
          </div>
        </div>
      </div>

      <div className="p-6 flex items-center justify-center" style={{ minHeight: "calc(100vh - 140px)" }}>
        <div className="border shadow-lg rounded-lg overflow-hidden bg-white">
          <canvas ref={canvasRef} className="cursor-crosshair" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} />
        </div>
      </div>

      <SignatureDialog open={showSignature} onOpenChange={setShowSignature} onApply={applySignature} />
    </div>
  );
}