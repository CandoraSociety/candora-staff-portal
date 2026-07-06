import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CONTENT_BLOCK_TYPES, createEmptyBlock } from "@/lib/lmsConstants";
import { Plus, X } from "lucide-react";

export default function ContentBlockPalette({ onAdd }) {
  const [open, setOpen] = useState(false);

  const handleSelect = (type) => {
    onAdd(createEmptyBlock(type));
    setOpen(false);
  };

  return (
    <div className="relative">
      <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => setOpen(!open)}>
        <Plus className="w-3.5 h-3.5 mr-1" /> Add Content Block
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute z-40 mt-1 w-full bg-popover border rounded-lg shadow-lg p-2 grid grid-cols-2 gap-1.5">
            {CONTENT_BLOCK_TYPES.map(bt => {
              const Icon = bt.icon;
              return (
                <button
                  key={bt.value}
                  onClick={() => handleSelect(bt.value)}
                  className="flex items-start gap-2 p-2 rounded-md hover:bg-muted text-left transition-colors"
                >
                  <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium">{bt.label}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">{bt.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}