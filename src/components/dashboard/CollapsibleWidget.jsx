import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function CollapsibleWidget({ title, icon: Icon, children, defaultOpen = true, headerExtra }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-primary" />}
          <h2 className="font-heading text-base font-bold">{title}</h2>
          {headerExtra}
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isOpen ? "" : "rotate-180"}`} />
      </button>
      {isOpen && <div className="p-4 pt-3">{children}</div>}
    </div>
  );
}