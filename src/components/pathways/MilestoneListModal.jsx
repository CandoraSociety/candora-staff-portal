import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function MilestoneListModal({ title, items, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm" style={{ color: "hsl(231,64%,20%)" }}>{title}</h3>
            <span className="text-xs text-slate-400">({items.length})</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto p-4 space-y-2">
          {items.length === 0 && <p className="text-center text-sm text-slate-400 py-8">No items in this category.</p>}
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-md p-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-slate-700">{item.clientName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">{item.title}</span>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", item.urgencyClass)}>
                    {item.urgencyLabel}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Due: {item.dateStr}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose} className="w-full">Close</Button>
        </div>
      </div>
    </div>
  );
}