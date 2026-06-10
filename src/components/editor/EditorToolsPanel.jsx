import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ZoomIn, ZoomOut, LayoutTemplate } from "lucide-react";
import { COLORS, HIGHLIGHT_COLORS, SIZES } from "@/lib/editorConstants";
import DocumentOverlayPanel from "./DocumentOverlayPanel";

export default function EditorToolsPanel({
  rightPanel,
  setRightPanel,
  tool,
  color,
  setColor,
  size,
  setSize,
  zoom,
  setZoom,
  textInput,
  setTextInput,
  stickyText,
  setStickyText,
  addText,
  fileKind,
  ctx,
  canvas,
  pushHistory,
}) {
  return (
    <div className="w-56 border-l bg-card shrink-0 flex flex-col overflow-hidden hidden sm:flex">
      <div className="flex border-b shrink-0">
        <button
          onClick={() => setRightPanel("tools")}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            rightPanel === "tools" ? "border-b-2 border-primary" : "hover:bg-muted"
          }`}
        >
          Tools
        </button>
        <button
          onClick={() => setRightPanel("overlays")}
          className={`flex-1 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
            rightPanel === "overlays" ? "border-b-2 border-primary" : "hover:bg-muted"
          }`}
        >
          <LayoutTemplate className="h-3 w-3" />
          Page
        </button>
      </div>

      {rightPanel === "tools" && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div>
            <Label className="text-xs">Color</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {(tool === "highlight" ? HIGHLIGHT_COLORS : COLORS).map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full border-2 transition-all ${
                    color === c ? "border-primary scale-110" : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs">Size</Label>
            <div className="flex items-center gap-2 mt-1.5">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`rounded-full bg-foreground transition-all ${
                    size === s ? "scale-110 ring-2 ring-primary" : "hover:scale-105"
                  }`}
                  style={{ width: s + 12, height: s + 12 }}
                />
              ))}
            </div>
          </div>

          {fileKind === "image" && (
            <div>
              <Label className="text-xs">Zoom</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}>
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.min(4, z + 0.25))}>
                  <ZoomIn className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {tool === "text" && (
            <div>
              <Label className="text-xs">Text</Label>
              <Input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter text..."
                className="mt-1.5"
              />
              <Button onClick={addText} className="w-full mt-2" size="sm">
                Add Text
              </Button>
            </div>
          )}

          {tool === "sticky" && (
            <div>
              <Label className="text-xs">Note</Label>
              <Input
                value={stickyText}
                onChange={(e) => setStickyText(e.target.value)}
                placeholder="Short note..."
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">Click on canvas to place</p>
            </div>
          )}
        </div>
      )}

      {rightPanel === "overlays" && (
        <DocumentOverlayPanel
          ctx={ctx}
          canvas={canvas}
          onApply={() => {
            pushHistory(ctx, canvas);
          }}
        />
      )}
    </div>
  );
}