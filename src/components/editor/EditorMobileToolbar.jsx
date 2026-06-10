import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Undo2, Redo2, Trash2, Palette } from "lucide-react";
import { DRAW_TOOLS, COLORS, HIGHLIGHT_COLORS, SIZES } from "@/lib/editorConstants";

export default function EditorMobileToolbar({
  tool,
  setTool,
  setShowSignatureDialog,
  undo,
  redo,
  clearCanvas,
  showMobilePanel,
  setShowMobilePanel,
  color,
  setColor,
  size,
  setSize,
}) {
  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-card border-t shadow-lg">
      {showMobilePanel && (
        <div className="p-3 border-b max-h-52 overflow-y-auto space-y-3">
          <div>
            <Label className="text-xs">Color</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {(tool === "highlight" ? HIGHLIGHT_COLORS : COLORS).map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full border-2 ${
                    color === c ? "border-primary" : "border-transparent"
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
                  className={`rounded-full bg-foreground ${size === s ? "ring-2 ring-primary" : ""}`}
                  style={{ width: s + 12, height: s + 12 }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center px-2 py-1 gap-0.5 overflow-x-auto">
        {DRAW_TOOLS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => id === "sign" ? setShowSignatureDialog(true) : setTool(id)}
            className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center ${
              tool === id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
        <div className="w-px h-8 bg-border mx-1" />
        <button onClick={undo} className="h-10 w-10 shrink-0 rounded-lg hover:bg-muted flex items-center justify-center">
          <Undo2 className="h-4 w-4" />
        </button>
        <button onClick={redo} className="h-10 w-10 shrink-0 rounded-lg hover:bg-muted flex items-center justify-center">
          <Redo2 className="h-4 w-4" />
        </button>
        <button onClick={clearCanvas} className="h-10 w-10 shrink-0 rounded-lg hover:bg-muted flex items-center justify-center">
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => setShowMobilePanel(!showMobilePanel)}
          className="h-10 w-10 shrink-0 rounded-lg hover:bg-muted flex items-center justify-center ml-2"
        >
          <Palette className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}