import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { X, Type, Image as ImageIcon, RotateCw } from "lucide-react";
import AssetPickerDialog from "./AssetPickerDialog";

export default function DocumentOverlayPanel({ open, onOpenChange, canvasRef }) {
  const [activeTab, setActiveTab] = useState("header");
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [headerText, setHeaderText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [watermarkText, setWatermarkText] = useState("");
  const [fontSize, setFontSize] = useState(16);
  const [opacity, setOpacity] = useState(0.3);
  const [position, setPosition] = useState("center");
  const [selectedAsset, setSelectedAsset] = useState(null);

  const applyOverlay = (type) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    if (type === "header" && headerText) {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.fillText(headerText, canvas.width / 2, 30);
      ctx.restore();
    }
    
    if (type === "footer" && footerText) {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.fillText(footerText, canvas.width / 2, canvas.height - 20);
      ctx.restore();
    }
    
    if (type === "watermark" && watermarkText) {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.font = `${fontSize * 2}px Arial`;
      ctx.fillStyle = "#808080";
      ctx.textAlign = "center";
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText(watermarkText, 0, 0);
      ctx.restore();
    }

    if (type === "image" && selectedAsset) {
      const img = new Image();
      img.onload = () => {
        const x = position === "left" ? 20 : position === "right" ? canvas.width - 120 : canvas.width / 2 - 50;
        ctx.drawImage(img, x, 20, 100, 100);
      };
      img.src = selectedAsset;
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed right-0 top-0 h-full w-80 bg-card border-l shadow-lg z-50 overflow-y-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Document Tools</h3>
          <button onClick={() => onOpenChange(false)}><X className="h-4 w-4" /></button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="p-4 border-b">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="header" title="Header"><Type className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="footer" title="Footer"><Type className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="watermark" title="Watermark"><Type className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="image" title="Image"><ImageIcon className="h-4 w-4" /></TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="header" className="p-4 space-y-4">
            <div>
              <Label>Header Text</Label>
              <Input value={headerText} onChange={(e) => setHeaderText(e.target.value)} placeholder="Enter header text" />
            </div>
            <div>
              <Label>Font Size: {fontSize}px</Label>
              <Slider value={[fontSize]} onValueChange={(v) => setFontSize(v[0])} min={8} max={48} step={1} />
            </div>
            <div>
              <Label>Opacity: {(opacity * 100).toFixed(0)}%</Label>
              <Slider value={[opacity * 100]} onValueChange={(v) => setOpacity(v[0] / 100)} min={10} max={100} step={10} />
            </div>
            <Button className="w-full" onClick={() => applyOverlay("header")}>Apply Header</Button>
          </TabsContent>

          <TabsContent value="footer" className="p-4 space-y-4">
            <div>
              <Label>Footer Text</Label>
              <Input value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="Enter footer text" />
            </div>
            <div>
              <Label>Font Size: {fontSize}px</Label>
              <Slider value={[fontSize]} onValueChange={(v) => setFontSize(v[0])} min={8} max={48} step={1} />
            </div>
            <div>
              <Label>Opacity: {(opacity * 100).toFixed(0)}%</Label>
              <Slider value={[opacity * 100]} onValueChange={(v) => setOpacity(v[0] / 100)} min={10} max={100} step={10} />
            </div>
            <Button className="w-full" onClick={() => applyOverlay("footer")}>Apply Footer</Button>
          </TabsContent>

          <TabsContent value="watermark" className="p-4 space-y-4">
            <div>
              <Label>Watermark Text</Label>
              <Input value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} placeholder="Enter watermark text" />
            </div>
            <div>
              <Label>Font Size: {fontSize * 2}px</Label>
              <Slider value={[fontSize]} onValueChange={(v) => setFontSize(v[0])} min={16} max={64} step={2} />
            </div>
            <div>
              <Label>Opacity: {(opacity * 100).toFixed(0)}%</Label>
              <Slider value={[opacity * 100]} onValueChange={(v) => setOpacity(v[0] / 100)} min={5} max={50} step={5} />
            </div>
            <Button className="w-full" onClick={() => applyOverlay("watermark")}>Apply Watermark</Button>
          </TabsContent>

          <TabsContent value="image" className="p-4 space-y-4">
            <div>
              <Label>Position</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setShowAssetPicker(true)}>Select Image</Button>
            {selectedAsset && <img src={selectedAsset} alt="Selected" className="w-20 h-20 object-cover rounded border mx-auto" />}
            <Button className="w-full" onClick={() => applyOverlay("image")}>Apply Image</Button>
          </TabsContent>
        </Tabs>

        <div className="p-4 border-t space-y-2">
          <Button variant="outline" className="w-full gap-2" onClick={() => {}}><RotateCw className="h-4 w-4" /> Rotate Page</Button>
        </div>
      </div>

      <AssetPickerDialog open={showAssetPicker} onOpenChange={setShowAssetPicker} onSelect={(url) => { setSelectedAsset(url); setShowAssetPicker(false); }} />
    </>
  );
}