import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CONTENT_BLOCK_TYPES, createEmptyBlock } from "@/lib/lmsConstants";
import { Plus, X } from "lucide-react";

export default function ContentBlockPalette({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [newPage, setNewPage] = useState(false);

  const handleSelect = (type) => {
    const block = createEmptyBlock(type);
    if (newPage) block.page_break_before = true;
    onAdd(block);
    setOpen(false);
  };

  return (
    <div>
      <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => setOpen(!open)}>
        <Plus className="w-3.5 h-3.5 mr-1" /> Add Content Block
      </Button>

      {open && (
        <div className="mt-2 w-full bg-popover border rounded-lg shadow-sm p-2 grid grid-cols-2 gap-1.5">
          <label className="col-span-2 flex items-center gap-2 text-xs cursor-pointer p-1 rounded hover:bg-muted/50">
            <input type="checkbox" checked={newPage} onChange={e => setNewPage(e.target.checked)} className="w-3.5 h-3.5 rounded" />
            <span className="text-muted-foreground">Start on a new page</span>
          </label>
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
          <button
            onClick={() => setOpen(false)}
            className="col-span-2 text-xs text-muted-foreground hover:text-foreground mt-1 text-center"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}