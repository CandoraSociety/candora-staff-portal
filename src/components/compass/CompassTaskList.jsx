import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, ExternalLink, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const TASK_TYPE_COLORS = {
  new_client:              "bg-blue-100 text-blue-700",
  bit_era_completed:       "bg-orange-100 text-orange-700",
  action_plan_created:     "bg-orange-100 text-orange-700",
  eda_started:             "bg-amber-100 text-amber-700",
  eda_completed:           "bg-green-100 text-green-700",
  eda_cancelled:           "bg-red-100 text-red-700",
  employment_outcome:      "bg-green-100 text-green-700",
  barrier_resolved:        "bg-teal-100 text-teal-700",
  eda_program_completed:   "bg-purple-100 text-purple-700",
  followup_90day:          "bg-cyan-100 text-cyan-700",
  stream_switch:           "bg-purple-100 text-purple-700",
};

const TASK_TYPE_LABELS = {
  new_client:              "New Client",
  bit_era_completed:       "BIT & ERA",
  action_plan_created:     "Action Plan",
  eda_started:             "EDA Started",
  eda_completed:           "EDA Completed",
  eda_cancelled:           "EDA Cancelled",
  employment_outcome:      "Employment",
  barrier_resolved:        "Barrier Resolved",
  eda_program_completed:   "Program Complete",
  followup_90day:          "90-Day Follow-Up",
  stream_switch:           "Stream Switch",
};

function TaskCard({ task, expanded, onToggle, completing, notes, onNotesChange, onMarkComplete, onMarkUncomplete }) {
  const navigate = useNavigate();

  return (
    <Card className={`border ${
      task.status === "completed" ? "border-slate-200 opacity-70" : "border-slate-300 shadow-sm"
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TASK_TYPE_COLORS[task.task_type] || "bg-slate-100 text-slate-600"}`}>
                {TASK_TYPE_LABELS[task.task_type] || task.task_type}
              </span>
              {task.compass_hsid && (
                <span className="text-xs text-slate-400">HSID: {task.compass_hsid}</span>
              )}
              <span className="text-xs text-slate-400">
                {task.created_date ? format(new Date(task.created_date), "MMM d, yyyy h:mm a") : ""}
              </span>
            </div>
            <CardTitle className="text-base font-semibold text-slate-800">{task.title}</CardTitle>
            {task.triggered_by_name && (
              <p className="text-xs text-slate-400 mt-0.5">Triggered by {task.triggered_by_name}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost" size="sm"
              onClick={() => navigate(`/pathways/client/${task.client_id}`)}
              className="text-slate-500 gap-1 text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View Client
            </Button>
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => onToggle(task.id)}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Instructions</p>
            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
              {task.instructions}
            </pre>
          </div>

          {task.status === "pending" && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Completion Notes (optional)
              </p>
              <Textarea
                rows={2}
                placeholder="Add notes about what was entered in Compass..."
                value={notes || ""}
                onChange={e => onNotesChange(task.id, e.target.value)}
                className="text-sm"
              />
              <Button
                onClick={() => onMarkComplete(task)}
                disabled={completing}
                className="gap-2 bg-green-700 hover:bg-green-800 text-white"
              >
                <CheckCircle2 className="w-4 h-4" />
                {completing ? "Marking complete…" : "Mark as Entered in Compass"}
              </Button>
            </div>
          )}

          {task.status === "completed" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">
                  Entered by {task.completed_by_name || task.completed_by} on{" "}
                  {task.completed_date ? format(new Date(task.completed_date), "MMM d, yyyy") : ""}
                </span>
              </div>
              {task.completed_notes && (
                <p className="text-sm text-slate-600 italic">"{task.completed_notes}"</p>
              )}
              <Button
                variant="outline" size="sm"
                onClick={() => onMarkUncomplete(task)}
                className="gap-2 text-slate-500"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Mark as Pending Again
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function CompassTaskList({ tasks: initialTasks, currentUser, onRefresh }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [tab, setTab] = useState("pending");
  const [expanded, setExpanded] = useState({});
  const [completing, setCompleting] = useState({});
  const [notes, setNotes] = useState({});

  // Sync with parent
  const tasksKey = initialTasks.map(t => t.id + t.status).join(",");
  const localKey = tasks.map(t => t.id + t.status).join(",");
  if (tasksKey !== localKey) {
    setTasks(initialTasks);
  }

  const pending   = tasks.filter(t => t.status === "pending");
  const completed = tasks.filter(t => t.status === "completed");
  const shown     = tab === "pending" ? pending : completed;

  const reload = async () => {
    const all = await base44.entities.CompassTask.list("-created_date", 500);
    const filtered = all.filter(t => t.assigned_worker === currentUser?.email);
    setTasks(filtered);
    if (onRefresh) onRefresh(filtered);
  };

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const markComplete = async (task) => {
    setCompleting(prev => ({ ...prev, [task.id]: true }));
    await base44.entities.CompassTask.update(task.id, {
      status: "completed",
      completed_by: currentUser?.email || "",
      completed_by_name: currentUser?.full_name || currentUser?.email || "",
      completed_date: new Date().toISOString().split("T")[0],
      completed_notes: notes[task.id] || "",
    });
    await reload();
    setCompleting(prev => ({ ...prev, [task.id]: false }));
  };

  const markUncomplete = async (task) => {
    await base44.entities.CompassTask.update(task.id, {
      status: "pending",
      completed_by: "",
      completed_by_name: "",
      completed_date: "",
      completed_notes: "",
    });
    await reload();
  };

  return (
    <div>
      <div className="flex gap-1 mb-4 bg-slate-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("pending")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "pending" ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Pending ({pending.length})
        </button>
        <button
          onClick={() => setTab("completed")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "completed" ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Completed ({completed.length})
        </button>
      </div>

      {shown.length === 0 ? (
        <div className="text-center py-10">
          <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
          <p className="text-slate-500 text-sm font-medium">
            {tab === "pending"
              ? "No pending Compass tasks — all caught up!"
              : "No completed tasks yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              expanded={!!expanded[task.id]}
              onToggle={toggleExpand}
              completing={!!completing[task.id]}
              notes={notes[task.id] || ""}
              onNotesChange={(id, val) => setNotes(prev => ({ ...prev, [id]: val }))}
              onMarkComplete={markComplete}
              onMarkUncomplete={markUncomplete}
            />
          ))}
        </div>
      )}
    </div>
  );
}