import React from "react";
import { Undo2, Redo2, Trash2 } from "lucide-react";
import { DRAW_TOOLS } from "@/lib/editorConstants";
import { Button } from "@/components/ui/button";

export default function EditorToolbar({ tool, setTool, setShowSignatureDialog, undo, redo, clearCanvas }) {
  return (
    <div className="w-14 border-r bg-card flex flex-col items-center py-3 gap-1 shrink-0 hidden sm:flex">
      {DRAW_TOOLS.map(({ id, icon: Icon, label }, i) => (
        <React.Fragment key={id}>
          {(i === 1 || i === 4 || i === 7 || i === 9) && <div className="h-px w-8 bg-border my-1" />}
          <button
            onClick={() => id === "sign" ? setShowSignatureDialog(true) : setTool(id)}
            className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors ${
              tool === id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </button>
        </React.Fragment>
      ))}
      <div className="h-px w-8 bg-border my-2" />
      <button onClick={undo} className="h-9 w-9 rounded-lg hover:bg-muted flex items-center justify-center" title="Undo">
        <Undo2 className="h-4 w-4" />
      </button>
      <button onClick={redo} className="h-9 w-9 rounded-lg hover:bg-muted flex items-center justify-center" title="Redo">
        <Redo2 className="h-4 w-4" />
      </button>
      <button onClick={clearCanvas} className="h-9 w-9 rounded-lg hover:bg-muted flex items-center justify-center" title="Clear">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}