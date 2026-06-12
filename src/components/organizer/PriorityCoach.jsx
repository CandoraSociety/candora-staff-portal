import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, X, Check, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function PriorityCoach({ priorities = [], focusToday, onClose, onPlanReady }) {
  const [step, setStep] = useState(1);
  const [selectedPriorities, setSelectedPriorities] = useState([]);
  const [rankedPriorities, setRankedPriorities] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState({});
  const [customTasks, setCustomTasks] = useState("");
  const [planType, setPlanType] = useState("summary");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);

  const handleSelectPriority = (id) => {
    if (selectedPriorities.includes(id)) {
      setSelectedPriorities(selectedPriorities.filter(pid => pid !== id));
    } else {
      setSelectedPriorities([...selectedPriorities, id]);
    }
  };

  const handleRankPriority = (id, direction) => {
    const idx = rankedPriorities.indexOf(id);
    if (idx === -1) return;
    const newRanked = [...rankedPriorities];
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= newRanked.length) return;
    [newRanked[idx], newRanked[newIdx]] = [newRanked[newIdx], newRanked[idx]];
    setRankedPriorities(newRanked);
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      const selectedPriorityData = priorities.filter(p => selectedPriorities.includes(p.id));
      const allTasks = selectedPriorityData.flatMap(p =>
        p.tasks.filter(t => selectedTasks[p.id]?.includes(t.id)).map(t => ({ priority: p.title, task: t.text }))
      );

      const prompt = `
        Focus: ${focusToday || "Not specified"}
        Selected Priorities (in order): ${rankedPriorities.map(id => priorities.find(p => p.id === id)?.title).join(" > ")}
        Tasks to complete: ${allTasks.map(t => `${t.priority}: ${t.task}`).join(" | ")}
        Custom tasks: ${customTasks}
        
        Generate a ${planType === "detailed" ? "detailed step-by-step" : "concise"} daily plan.
        Return JSON: { "ai_plan": "markdown formatted plan with clear sections and actionable steps" }
      `;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            ai_plan: { type: "string" }
          }
        }
      });

      const plan = {
        id: `plan_${Date.now()}`,
        created_at: new Date().toISOString(),
        focus: focusToday,
        detailed: planType === "detailed",
        ai_plan: result.ai_plan,
        priorities: selectedPriorityData.map(p => ({ id: p.id, title: p.title })),
      };

      setGeneratedPlan(plan);
      onPlanReady(plan);
      setStep(5);
    } catch (error) {
      console.error("Failed to generate plan:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Select priorities to work on today:</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {priorities.map(p => (
                <div
                  key={p.id}
                  onClick={() => handleSelectPriority(p.id)}
                  className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                    selectedPriorities.includes(p.id) ? "bg-primary/10 border-primary" : "bg-muted/30 hover:bg-muted/50"
                  } border`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPriorities.includes(p.id)}
                    onChange={() => {}}
                    className="rounded"
                  />
                  <span className="text-sm">{p.title}</span>
                </div>
              ))}
            </div>
            <Button onClick={() => setStep(2)} disabled={selectedPriorities.length === 0} className="w-full">
              Next <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Rank your priorities (most important first):</p>
            <div className="space-y-2">
              {selectedPriorities.map((id, idx) => {
                const p = priorities.find(pri => pri.id === id);
                return (
                  <div key={id} className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
                    <span className="text-sm font-medium w-6">{idx + 1}.</span>
                    <span className="text-sm flex-1">{p?.title}</span>
                    <Button variant="outline" size="sm" onClick={() => handleRankPriority(id, "up")} disabled={idx === 0}>↑</Button>
                    <Button variant="outline" size="sm" onClick={() => handleRankPriority(id, "down")} disabled={idx === selectedPriorities.length - 1}>↓</Button>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button onClick={() => { setRankedPriorities(selectedPriorities); setStep(3); }} className="flex-1">
                Next <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Select tasks for each priority:</p>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {priorities.filter(p => selectedPriorities.includes(p.id)).map(p => (
                <div key={p.id} className="space-y-1">
                  <p className="text-xs font-medium">{p.title}</p>
                  {p.tasks.map(t => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTasks(prev => ({
                        ...prev,
                        [p.id]: prev[p.id]?.includes(t.id) ? prev[p.id].filter(id => id !== t.id) : [...(prev[p.id] || []), t.id]
                      }))}
                      className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs ${
                        selectedTasks[p.id]?.includes(t.id) ? "bg-primary/10" : "hover:bg-muted/30"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTasks[p.id]?.includes(t.id) || false}
                        onChange={() => {}}
                      />
                      <span className={t.done ? "line-through text-muted-foreground" : ""}>{t.text}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
              <Button onClick={() => setStep(4)} className="flex-1">
                Next <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Add custom tasks (optional):</p>
            <Textarea
              placeholder="Any other tasks you want to include..."
              value={customTasks}
              onChange={(e) => setCustomTasks(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="space-y-2">
              <p className="text-sm font-medium">Plan detail level:</p>
              <div className="flex gap-2">
                <Button
                  variant={planType === "summary" ? "default" : "outline"}
                  onClick={() => setPlanType("summary")}
                  className="flex-1"
                >
                  Summary
                </Button>
                <Button
                  variant={planType === "detailed" ? "default" : "outline"}
                  onClick={() => setPlanType("detailed")}
                  className="flex-1"
                >
                  Detailed
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">Back</Button>
              <Button onClick={handleGeneratePlan} disabled={isGenerating} className="flex-1">
                {isGenerating ? <Sparkles className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                Generate Plan
              </Button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              <span className="font-medium">Plan Generated!</span>
            </div>
            {generatedPlan && (
              <div className="p-3 rounded-md bg-muted/30 text-sm">
                <p className="text-muted-foreground mb-2">{generatedPlan.focus && `Focus: ${generatedPlan.focus}`}</p>
                <div className="prose prose-sm max-w-none">
                  {generatedPlan.ai_plan}
                </div>
              </div>
            )}
            <Button onClick={onClose} className="w-full">Done</Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={true} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Priority Coach
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map(s => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
          {renderStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}