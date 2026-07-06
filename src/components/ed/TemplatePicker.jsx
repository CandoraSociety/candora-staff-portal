import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeftRight, UserPlus, TrendingUp, Zap, Check, Layers } from "lucide-react";
import { TRAINING_TEMPLATES, getTemplatesForPlanType } from "@/lib/trainingTemplates";

const ICON_MAP = {
  ArrowLeftRight,
  UserPlus,
  TrendingUp,
  Zap,
};

export default function TemplatePicker({ open, onClose, plan, onApply }) {
  const [selectedId, setSelectedId] = useState(null);

  const planType = plan?.plan_type || "onboarding";
  const recommended = getTemplatesForPlanType(planType);
  const other = TRAINING_TEMPLATES.filter(t => !recommended.includes(t));
  const selected = TRAINING_TEMPLATES.find(t => t.id === selectedId);

  const handleClose = () => {
    setSelectedId(null);
    onClose();
  };

  const handleApply = () => {
    if (!selected) return;
    onApply(selected.items);
    setSelectedId(null);
    handleClose();
  };

  const TemplateCard = ({ template }) => {
    const Icon = ICON_MAP[template.icon] || Layers;
    const isSelected = selectedId === template.id;
    return (
      <button
        type="button"
        onClick={() => setSelectedId(template.id)}
        className={`text-left p-4 rounded-lg border-2 transition-all ${template.color} ${isSelected ? "ring-2 ring-primary" : "hover:border-primary/40"}`}
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/70 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold">{template.name}</h4>
              {isSelected && <Check className="w-4 h-4 text-green-600 shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{template.description}</p>
            <p className="text-xs font-medium text-muted-foreground mt-2">{template.items.length} activities</p>
          </div>
        </div>
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Start from a Template
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {recommended.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Recommended for {planType.replace(/_/g, " ")}
              </Label>
              <div className="grid grid-cols-1 gap-3 mt-2">
                {recommended.map(t => <TemplateCard key={t.id} template={t} />)}
              </div>
            </div>
          )}

          {other.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Other Templates
              </Label>
              <div className="grid grid-cols-1 gap-3 mt-2">
                {other.map(t => <TemplateCard key={t.id} template={t} />)}
              </div>
            </div>
          )}

          {selected && (
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Preview: {selected.items.length} activities
              </p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {selected.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs py-1">
                    <span className="w-2 h-2 rounded-full bg-primary/40 shrink-0" />
                    <span className="font-medium">{item.title}</span>
                    <span className="text-muted-foreground">· {item.phase.replace(/_/g, " ")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Template activities are added alongside any existing items. You can edit or delete individual activities after applying.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleApply} disabled={!selected}>
            <Check className="w-4 h-4 mr-1" /> Apply Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}