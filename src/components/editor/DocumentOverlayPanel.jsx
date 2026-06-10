import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Type, Image as ImageIcon, RotateCw, Crop } from "lucide-react";
import { toast } from "sonner";
import AssetPickerDialog from "./AssetPickerDialog";

export default function DocumentOverlayPanel({ ctx, canvas, onApply }) {
  const [activeTab, setActiveTab] = useState("header");
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [assetContext, setAssetContext] = useState("");

  // Header states
  const [headerText, setHeaderText] = useState("");
  const [headerFontSize, setHeaderFontSize] = useState(14);
  const [headerColor, setHeaderColor] = useState("#000000");
  const [headerAlign, setHeaderAlign] = useState("left");
  const [headerLogoUrl, setHeaderLogoUrl] = useState(null);

  // Footer states
  const [footerText, setFooterText] = useState("");
  const [footerFontSize, setFooterFontSize] = useState(12);
  const [footerColor, setFooterColor] = useState("#555555");
  const [footerAlign, setFooterAlign] = useState("center");
  const [footerLogoUrl, setFooterLogoUrl] = useState(null);

  // Watermark states
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [watermarkColor, setWatermarkColor] = useState("#cccccc");
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.15);
  const [watermarkImageUrl, setWatermarkImageUrl] = useState(null);

  // Cover page states
  const [coverTitle, setCoverTitle] = useState("");
  const [coverSubtitle, setCoverSubtitle] = useState("");
  const [coverBg, setCoverBg] = useState("#ffffff");
  const [coverTextColor, setCoverTextColor] = useState("#000000");
  const [coverLogoUrl, setCoverLogoUrl] = useState(null);

  // Page numbers
  const [pageNumFormat, setpageNumFormat] = useState("Page {n}");
  const [pageNumPos, setpageNumPos] = useState("bottom-center");
  const [pageNumSize, setpageNumSize] = useState(12);

  // Page operations
  const [customW, setCustomW] = useState(816);
  const [customH, setCustomH] = useState(1056);
  const [selectedSize, setSelectedSize] = useState({ label: "Letter (8.5×11\")", w: 816, h: 1056 });

  const PAGE_SIZES = [
    { label: "Letter (8.5×11\")", w: 816, h: 1056 },
    { label: "Legal (8.5×14\")", w: 816, h: 1344 },
    { label: "A4 (210×297mm)", w: 794, h: 1123 },
    { label: "A3 (297×420mm)", w: 1123, h: 1587 },
    { label: "Custom", w: 0, h: 0 },
  ];

  const openAssetPicker = (context) => {
    setAssetContext(context);
    setShowAssetPicker(true);
  };

  const handleAssetSelect = (url) => {
    if (assetContext === "header-logo") setHeaderLogoUrl(url);
    else if (assetContext === "footer-logo") setFooterLogoUrl(url);
    else if (assetContext === "watermark-img") setWatermarkImageUrl(url);
    else if (assetContext === "cover-logo") setCoverLogoUrl(url);
    setShowAssetPicker(false);
  };

  const applyHeader = () => {
    if (!ctx || !canvas) return;
    ctx.save();
    const x = headerAlign === "left" ? 20 : headerAlign === "right" ? canvas.width - 20 : canvas.width / 2;
    ctx.fillStyle = headerColor;
    ctx.font = `${headerFontSize}px Inter, sans-serif`;
    ctx.textAlign = headerAlign;
    ctx.textBaseline = "top";

    if (headerLogoUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 10, 4, 60, 30);
        ctx.fillText(headerText, x, 8);
        ctx.restore();
        onApply?.();
      };
      img.src = headerLogoUrl;
    } else {
      ctx.fillText(headerText, x, 8);
      ctx.restore();
      onApply?.();
    }
    toast.success("Header applied");
  };

  const applyFooter = () => {
    if (!ctx || !canvas) return;
    ctx.save();
    const y = canvas.height - 20;
    const x = footerAlign === "left" ? 20 : footerAlign === "right" ? canvas.width - 20 : canvas.width / 2;
    ctx.fillStyle = footerColor;
    ctx.font = `${footerFontSize}px Inter, sans-serif`;
    ctx.textAlign = footerAlign;
    ctx.textBaseline = "bottom";

    if (footerLogoUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 10, canvas.height - 36, 50, 24);
        ctx.fillText(footerText, x, y);
        ctx.restore();
        onApply?.();
      };
      img.src = footerLogoUrl;
    } else {
      ctx.fillText(footerText, x, y);
      ctx.restore();
      onApply?.();
    }
    toast.success("Footer applied");
  };

  const applyWatermark = () => {
    if (!ctx || !canvas) return;
    ctx.save();
    ctx.globalAlpha = watermarkOpacity;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = watermarkColor;
    ctx.font = `bold ${Math.floor(canvas.width / 10)}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (watermarkImageUrl) {
      const img = new Image();
      img.onload = () => {
        const w = canvas.width * 0.5;
        const h = (img.height / img.width) * w;
        ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
        ctx.restore();
        onApply?.();
      };
      img.src = watermarkImageUrl;
    } else {
      ctx.fillText(watermarkText, 0, 0);
      ctx.restore();
      onApply?.();
    }
    toast.success("Watermark applied");
  };

  const applyCoverPage = () => {
    if (!ctx || !canvas) return;
    ctx.save();
    ctx.fillStyle = coverBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = coverTextColor;
    ctx.font = `bold ${Math.floor(canvas.width / 18)}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(coverTitle, canvas.width / 2, canvas.height / 2 - 30);

    ctx.font = `${Math.floor(canvas.width / 26)}px Inter, sans-serif`;
    ctx.fillText(coverSubtitle, canvas.width / 2, canvas.height / 2 + 20);

    if (coverLogoUrl) {
      const img = new Image();
      img.onload = () => {
        const lw = Math.min(canvas.width * 0.3, 200);
        const lh = (img.height / img.width) * lw;
        ctx.drawImage(img, (canvas.width - lw) / 2, canvas.height / 4 - lh / 2, lw, lh);
        ctx.restore();
        onApply?.();
      };
      img.src = coverLogoUrl;
    } else {
      ctx.restore();
      onApply?.();
    }
    toast.success("Cover page applied");
  };

  const applyPageNumbers = () => {
    if (!ctx || !canvas) return;
    const posMap = {
      "bottom-center": { x: canvas.width / 2, y: canvas.height - 10, align: "center" },
      "bottom-left": { x: 20, y: canvas.height - 10, align: "left" },
      "bottom-right": { x: canvas.width - 20, y: canvas.height - 10, align: "right" },
      "top-center": { x: canvas.width / 2, y: pageNumSize + 6, align: "center" },
    };
    const pos = posMap[pageNumPos];
    ctx.save();
    ctx.fillStyle = "#555555";
    ctx.font = `${pageNumSize}px Inter, sans-serif`;
    ctx.textAlign = pos.align;
    ctx.fillText(pageNumFormat.replace("{n}", "1"), pos.x, pos.y);
    ctx.restore();
    onApply?.();
    toast.success("Page numbers applied");
  };

  const applyRotation = () => {
    if (!ctx || !canvas) return;
    const tmp = document.createElement("canvas");
    tmp.width = canvas.height;
    tmp.height = canvas.width;
    const tCtx = tmp.getContext("2d");
    tCtx.translate(tmp.width / 2, tmp.height / 2);
    tCtx.rotate(Math.PI / 2);
    tCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    canvas.width = tmp.width;
    canvas.height = tmp.height;
    ctx.drawImage(tmp, 0, 0);
    onApply?.();
    toast.success("Rotated 90° clockwise");
  };

  const applyResize = () => {
    if (!ctx || !canvas) return;
    const w = selectedSize.label === "Custom" ? customW : selectedSize.w;
    const h = selectedSize.label === "Custom" ? customH : selectedSize.h;
    const tmp = document.createElement("canvas");
    tmp.width = w;
    tmp.height = h;
    const tCtx = tmp.getContext("2d");
    tCtx.drawImage(canvas, 0, 0, w, h);
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(tmp, 0, 0);
    onApply?.();
    toast.success(`Resized to ${selectedSize.label}`);
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="header">Header</TabsTrigger>
            <TabsTrigger value="footer">Footer</TabsTrigger>
            <TabsTrigger value="watermark">Watermark</TabsTrigger>
          </TabsList>

          <TabsContent value="header" className="space-y-3 mt-3">
            <div>
              <Label className="text-xs">Text</Label>
              <Input value={headerText} onChange={(e) => setHeaderText(e.target.value)} placeholder="Header text" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Font Size</Label>
                <Input type="number" value={headerFontSize} onChange={(e) => setHeaderFontSize(Number(e.target.value))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Color</Label>
                <Input type="color" value={headerColor} onChange={(e) => setHeaderColor(e.target.value)} className="mt-1 h-9" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Alignment</Label>
              <div className="flex gap-2 mt-1">
                <Button variant={headerAlign === "left" ? "default" : "outline"} size="sm" onClick={() => setHeaderAlign("left")}>Left</Button>
                <Button variant={headerAlign === "center" ? "default" : "outline"} size="sm" onClick={() => setHeaderAlign("center")}>Center</Button>
                <Button variant={headerAlign === "right" ? "default" : "outline"} size="sm" onClick={() => setHeaderAlign("right")}>Right</Button>
              </div>
            </div>
            <div>
              <Label className="text-xs">Logo (optional)</Label>
              <Button variant="outline" size="sm" onClick={() => openAssetPicker("header-logo")} className="w-full mt-1 gap-2">
                <ImageIcon className="h-4 w-4" />
                {headerLogoUrl ? "Change Logo" : "Add Logo"}
              </Button>
            </div>
            <Button onClick={applyHeader} className="w-full">Apply Header</Button>
          </TabsContent>

          <TabsContent value="footer" className="space-y-3 mt-3">
            <div>
              <Label className="text-xs">Text</Label>
              <Input value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="Footer text" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Font Size</Label>
                <Input type="number" value={footerFontSize} onChange={(e) => setFooterFontSize(Number(e.target.value))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Color</Label>
                <Input type="color" value={footerColor} onChange={(e) => setFooterColor(e.target.value)} className="mt-1 h-9" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Alignment</Label>
              <div className="flex gap-2 mt-1">
                <Button variant={footerAlign === "left" ? "default" : "outline"} size="sm" onClick={() => setFooterAlign("left")}>Left</Button>
                <Button variant={footerAlign === "center" ? "default" : "outline"} size="sm" onClick={() => setFooterAlign("center")}>Center</Button>
                <Button variant={footerAlign === "right" ? "default" : "outline"} size="sm" onClick={() => setFooterAlign("right")}>Right</Button>
              </div>
            </div>
            <div>
              <Label className="text-xs">Logo (optional)</Label>
              <Button variant="outline" size="sm" onClick={() => openAssetPicker("footer-logo")} className="w-full mt-1 gap-2">
                <ImageIcon className="h-4 w-4" />
                {footerLogoUrl ? "Change Logo" : "Add Logo"}
              </Button>
            </div>
            <Button onClick={applyFooter} className="w-full">Apply Footer</Button>
          </TabsContent>

          <TabsContent value="watermark" className="space-y-3 mt-3">
            <div>
              <Label className="text-xs">Text</Label>
              <Input value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} placeholder="Watermark text" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Color</Label>
                <Input type="color" value={watermarkColor} onChange={(e) => setWatermarkColor(e.target.value)} className="mt-1 h-9" />
              </div>
              <div>
                <Label className="text-xs">Opacity</Label>
                <Input type="range" min="0.05" max="0.8" step="0.05" value={watermarkOpacity} onChange={(e) => setWatermarkOpacity(Number(e.target.value))} className="mt-2" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Or use image</Label>
              <Button variant="outline" size="sm" onClick={() => openAssetPicker("watermark-img")} className="w-full mt-1 gap-2">
                <ImageIcon className="h-4 w-4" />
                {watermarkImageUrl ? "Change Image" : "Select Image"}
              </Button>
            </div>
            <Button onClick={applyWatermark} className="w-full">Apply Watermark</Button>
          </TabsContent>

          <TabsContent value="cover" className="space-y-3 mt-3">
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={coverTitle} onChange={(e) => setCoverTitle(e.target.value)} placeholder="Document title" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Subtitle</Label>
              <Input value={coverSubtitle} onChange={(e) => setCoverSubtitle(e.target.value)} placeholder="Subtitle or date" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Background</Label>
                <Input type="color" value={coverBg} onChange={(e) => setCoverBg(e.target.value)} className="mt-1 h-9" />
              </div>
              <div>
                <Label className="text-xs">Text Color</Label>
                <Input type="color" value={coverTextColor} onChange={(e) => setCoverTextColor(e.target.value)} className="mt-1 h-9" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Logo (optional)</Label>
              <Button variant="outline" size="sm" onClick={() => openAssetPicker("cover-logo")} className="w-full mt-1 gap-2">
                <ImageIcon className="h-4 w-4" />
                {coverLogoUrl ? "Change Logo" : "Add Logo"}
              </Button>
            </div>
            <Button onClick={applyCoverPage} className="w-full">Apply Cover Page</Button>
          </TabsContent>

          <TabsContent value="pagenums" className="space-y-3 mt-3">
            <div>
              <Label className="text-xs">Format</Label>
              <Input value={pageNumFormat} onChange={(e) => setpageNumFormat(e.target.value)} placeholder="Use {n} for number" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Position</Label>
              <select value={pageNumPos} onChange={(e) => setpageNumPos(e.target.value)} className="w-full mt-1 p-2 border rounded-md">
                <option value="bottom-center">Bottom Center</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-right">Bottom Right</option>
                <option value="top-center">Top Center</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Font Size</Label>
              <Input type="number" value={pageNumSize} onChange={(e) => setpageNumSize(Number(e.target.value))} className="mt-1" />
            </div>
            <Button onClick={applyPageNumbers} className="w-full">Apply Page Numbers</Button>
          </TabsContent>

          <TabsContent value="pageops" className="space-y-3 mt-3">
            <div>
              <Label className="text-xs">Rotate Page</Label>
              <Button onClick={applyRotation} className="w-full mt-1 gap-2">
                <RotateCw className="h-4 w-4" />
                Rotate 90° Clockwise
              </Button>
            </div>
            <div>
              <Label className="text-xs">Resize Page</Label>
              <select
                value={selectedSize.label}
                onChange={(e) => setSelectedSize(PAGE_SIZES.find((s) => s.label === e.target.value))}
                className="w-full mt-1 p-2 border rounded-md"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s.label} value={s.label}>{s.label}</option>
                ))}
              </select>
              {selectedSize.label === "Custom" && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input type="number" placeholder="Width" value={customW} onChange={(e) => setCustomW(Number(e.target.value))} />
                  <Input type="number" placeholder="Height" value={customH} onChange={(e) => setCustomH(Number(e.target.value))} />
                </div>
              )}
              <Button onClick={applyResize} className="w-full mt-2 gap-2">
                <Crop className="h-4 w-4" />
                Resize
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AssetPickerDialog
        open={showAssetPicker}
        onOpenChange={setShowAssetPicker}
        onSelect={handleAssetSelect}
        assetType={assetContext.includes("logo") ? "logo" : "image"}
      />
    </>
  );
}