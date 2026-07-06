import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  UserPlus, ShieldCheck, HeartHandshake, HardHat, HandHeart, Lock,
  Check, Clock, Layers, HelpCircle,
} from "lucide-react";
import {
  MODULE_CATEGORIES, getModuleCategory,
} from "@/lib/trainingModuleConstants";
import { MODULE_TEMPLATES } from "@/lib/moduleTemplates";

const ICON_MAP = {
  UserPlus, ShieldCheck, HeartHandshake, HardHat, HandHeart, Lock,
};

export default function ModuleTemplatePicker({ open, onClose, onSelect }) {
  const [selectedId, setSelectedId] = useState(null);

  const selected = MODULE_TEMPLATES.find(t => t.id === selectedId);

  const handleApply = () => {
    if (!selected) return;
    onSelect(selected.template);
    setSelectedId(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setSelectedId(null); onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Choose a Module Template</DialogTitle>
          <p className="text-sm text-muted-foreground">Start with a pre-built structure you can customize. Great for first-time module creators.</p>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-3 pr-1">
          {MODULE_TEMPLATES.map(tmpl => {
            const Icon = ICON_MAP[tmpl.icon] || Layers;
            const cat = getModuleCategory(tmpl.category);
            const isSelected = selectedId === tmpl.id;
            return (
              <div
                key={tmpl.id}
                onClick={() => setSelectedId(tmpl.id)}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-primary/40 bg-card"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${cat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{tmpl.name}</h3>
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{tmpl.description}</p>
                    <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                      <Badge variant="outline" className={`text-[10px] ${cat.color}`}>{cat.label}</Badge>
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" /> {tmpl.duration_minutes}min
                      </span>
                      {tmpl.template?.slides?.length > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Layers className="w-3 h-3" /> {tmpl.template.slides.length} slides
                        </span>
                      )}
                      {tmpl.template?.quiz_questions?.length > 0 && (
                        <span className="flex items-center gap-0.5">
                          <HelpCircle className="w-3 h-3" /> {tmpl.template.quiz_questions.length} quiz Qs
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isSelected && selected?.template && (
                  <div className="mt-3 ml-13 pl-1 space-y-2">
                    {selected.template.learning_objectives?.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground mb-1">Learning Objectives:</p>
                        <ul className="text-xs text-muted-foreground space-y-0.5 ml-3">
                          {selected.template.learning_objectives.slice(0, 3).map((o, i) => (
                            <li key={i} className="list-disc list-outside"> {o}</li>
                          ))}
                          {selected.template.learning_objectives.length > 3 && (
                            <li className="list-disc list-outside italic">+ {selected.template.learning_objectives.length - 3} more...</li>
                          )}
                        </ul>
                      </div>
                    )}
                    {selected.template.slides?.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground mb-1">Slides:</p>
                        <div className="flex flex-wrap gap-1">
                          {selected.template.slides.map((s, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] font-normal">
                              {i + 1}. {s.title?.slice(0, 25)}{s.title?.length > 25 ? "..." : ""}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter className="border-t pt-3 mt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleApply} disabled={!selectedId}>
            <Check className="w-4 h-4 mr-1" /> Use This Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}