import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Type, PenTool, X, Check } from "lucide-react";

const COLORS = ["#000000", "#1e40af", "#dc2626", "#16a34a", "#7c3aed"];
const FONTS = ["Arial", "Georgia", "Courier New", "Times New Roman", "Brush Script MT", "Lucida Handwriting"];

export default function SignatureDialog({ open, onOpenChange, onApply }) {
  const [mode, setMode] = useState("draw");
  const [color, setColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState("Brush Script MT");
  const [typedText, setTypedText] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (open && mode === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = 400;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [open, mode]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedUrl(url);
    }
  };

  const getSignature = () => {
    if (mode === "draw" && canvasRef.current) return canvasRef.current.toDataURL("image/png");
    if (mode === "type" && typedText) {
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 100;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = color;
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.fillText(typedText, canvas.width / 2, canvas.height / 2 + 8);
      return canvas.toDataURL("image/png");
    }
    if (mode === "upload" && uploadedUrl) return uploadedUrl;
    return null;
  };

  const handleApply = () => {
    const sig = getSignature();
    if (sig) {
      onApply(sig);
      onOpenChange(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Signature</DialogTitle></DialogHeader>
        <Tabs value={mode} onValueChange={setMode}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="draw" className="gap-1"><PenTool className="h-4 w-4" /> Draw</TabsTrigger>
            <TabsTrigger value="type" className="gap-1"><Type className="h-4 w-4" /> Type</TabsTrigger>
            <TabsTrigger value="upload" className="gap-1"><Upload className="h-4 w-4" /> Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="space-y-3">
            <div className="flex items-center gap-2">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)} className={`h-6 w-6 rounded-full border-2 ${color === c ? "border-primary" : "border-transparent"}`} style={{ backgroundColor: c }} />
              ))}
              <Button variant="outline" size="sm" onClick={clearCanvas} className="ml-auto">Clear</Button>
            </div>
            <canvas ref={canvasRef} className="border rounded-lg cursor-crosshair w-full touch-none" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
          </TabsContent>

          <TabsContent value="type" className="space-y-3">
            <Input value={typedText} onChange={(e) => setTypedText(e.target.value)} placeholder="Type your signature" />
            <div className="flex items-center gap-2 flex-wrap">
              <Label className="text-sm">Font:</Label>
              <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="text-sm border rounded px-2 py-1">
                {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <Label className="text-sm ml-2">Size:</Label>
              <input type="range" min="16" max="48" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-24" />
              <div className="flex items-center gap-1 ml-auto">{COLORS.map((c) => <button key={c} onClick={() => setColor(c)} className={`h-5 w-5 rounded-full border-2 ${color === c ? "border-primary" : "border-transparent"}`} style={{ backgroundColor: c }} />)}</div>
            </div>
            {typedText && <div className="border rounded-lg p-4 text-center" style={{ fontFamily, fontSize, color }}>{typedText}</div>}
          </TabsContent>

          <TabsContent value="upload" className="space-y-3">
            <Input type="file" accept="image/*" onChange={handleFileUpload} />
            {uploadedUrl && <img src={uploadedUrl} alt="Signature" className="border rounded-lg max-h-32 mx-auto" />}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleApply} disabled={!getSignature()} className="gap-1"><Check className="h-4 w-4" /> Apply Signature</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}