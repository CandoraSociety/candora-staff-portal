import { useState } from "react";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ENTRY_TYPES = [
  { value: "motion", label: "Motion" },
  { value: "resolution", label: "Resolution" },
  { value: "action_item", label: "Action Item" },
  { value: "discussion", label: "Discussion" },
  { value: "information", label: "Information" },
  { value: "dissent", label: "Dissent" },
  { value: "abstention", label: "Abstention" },
  { value: "in_camera", label: "In Camera" },
];

const MOTION_RESULTS = [
  { value: "", label: "—" },
  { value: "carried", label: "Carried" },
  { value: "defeated", label: "Defeated" },
  { value: "tabled", label: "Tabled" },
  { value: "withdrawn", label: "Withdrawn" },
];

export default function MinuteEntryForm({ entry, onSave, onCancel }) {
  const [type, setType] = useState(entry?.entry_type || "motion");
  const [content, setContent] = useState(entry?.content || "");
  const [movedBy, setMovedBy] = useState(entry?.moved_by || "");
  const [secondedBy, setSecondedBy] = useState(entry?.seconded_by || "");
  const [motionResult, setMotionResult] = useState(entry?.motion_result || "");
  const [assignedTo, setAssignedTo] = useState(entry?.action_assigned_to || "");
  const [dueDate, setDueDate] = useState(entry?.action_due_date || "");

  const isMotion = type === "motion" || type === "resolution";
  const isAction = type === "action_item";

  const handleSave = () => {
    const data = {
      entry_type: type,
      content,
      ...(isMotion ? { moved_by: movedBy, seconded_by: secondedBy, motion_result: motionResult } : {}),
      ...(isAction ? { action_assigned_to: assignedTo, action_due_date: dueDate } : {}),
    };
    onSave(data);
  };

  return (
    <div className="border border-primary/30 rounded-lg p-3 bg-primary/5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-primary">New Entry</span>
        <button onClick={onCancel} className="text-muted-foreground hover:text-destructive">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div>
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Type</label>
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="w-full border border-input rounded-md px-2 py-1 text-xs bg-background h-7 mt-0.5"
        >
          {ENTRY_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          {type === "motion" ? "Motion Text" : type === "resolution" ? "Resolution Text" : "Description"}
        </label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={2}
          className="w-full border border-input rounded-md px-2 py-1 text-xs bg-background resize-y mt-0.5"
          placeholder="Enter details..."
        />
      </div>

      {isMotion && (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Moved By</label>
            <Input value={movedBy} onChange={e => setMovedBy(e.target.value)} className="h-7 text-xs mt-0.5" placeholder="Name" />
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Seconded By</label>
            <Input value={secondedBy} onChange={e => setSecondedBy(e.target.value)} className="h-7 text-xs mt-0.5" placeholder="Name" />
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Result</label>
            <select
              value={motionResult}
              onChange={e => setMotionResult(e.target.value)}
              className="w-full border border-input rounded-md px-2 py-1 text-xs bg-background h-7 mt-0.5"
            >
              {MOTION_RESULTS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {isAction && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Assigned To</label>
            <Input value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="h-7 text-xs mt-0.5" placeholder="Name" />
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Due Date</label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="h-7 text-xs mt-0.5" />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-1.5 pt-1">
        <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs">Cancel</Button>
        <Button size="sm" onClick={handleSave} className="h-7 text-xs gap-1">
          <Check className="w-3.5 h-3.5" /> Save Entry
        </Button>
      </div>
    </div>
  );
}