import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Sparkles, List, LayoutGrid, ChevronDown, ChevronUp, Eye, EyeOff, Check, Trash2, CheckSquare, CalendarDays, Zap, Flag } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { format, addDays } from "date-fns";

export default function NotesTab({ notes = [], onChange, onAddTasks, onAddWeeklyItems, onAddPriorities }) {
  const [newNote, setNewNote] = useState("");
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [expandedNotes, setExpandedNotes] = useState({});
  // Pending actionable items extracted from the most recent note
  const [pendingItems, setPendingItems] = useState(null);

  const weekStart = (() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  })();

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    const rawEntry = newNote.trim();
    const newNoteObj = {
      id: `note_${Date.now()}`,
      raw_entry: rawEntry,
      subject: "Processing...",
      formatted: "AI is organizing this note...",
      created_at: new Date().toISOString(),
    };

    onChange([...notes, newNoteObj]);
    setNewNote("");
    setIsOrganizing(true);

    try {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
      const dateListStr = weekDates.map((d, i) => `${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i]} ${format(d, "yyyy-MM-dd")}`).join(", ");

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Organize this brain dump note into a clear subject heading and formatted content. Also extract any actionable items.

Today is ${todayStr}. The current week's dates are: ${dateListStr}.

For each actionable item, determine:
- type: "priority" for broader objectives, goals, or strategic initiatives that are not single to-dos but rather ongoing focus areas with potential sub-steps; "task" for general to-dos with no specific date; "scheduled" for items tied to a date/time
- text: concise description
- scheduled_date: YYYY-MM-DD (only for "scheduled" type — resolve relative days like "Tuesday", "tomorrow", "Thursday")
- time: HH:MM format if a time is mentioned, otherwise empty string (only for "scheduled" type)
- priority_level: "critical", "high", "medium", or "low" (only for "priority" type — how important/urgent this objective is)
- due_date: YYYY-MM-DD if a deadline is mentioned (only for "priority" type, optional)
- notes: any additional context for this item

Return JSON with "subject" (short title), "formatted" (markdown content), and "actionable_items" (array).

Note: "${rawEntry}"`,
        response_json_schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            formatted: { type: "string" },
            actionable_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["task", "scheduled", "priority"] },
                  text: { type: "string" },
                  scheduled_date: { type: "string" },
                  time: { type: "string" },
                  priority_level: { type: "string", enum: ["critical", "high", "medium", "low"] },
                  due_date: { type: "string" },
                  notes: { type: "string" }
                }
              }
            }
          }
        }
      });

      onChange(currentNotes => currentNotes.map(n =>
        n.id === newNoteObj.id
          ? { ...n, subject: result.subject, formatted: result.formatted }
          : n
      ));

      // Show actionable items for confirmation
      if (result.actionable_items && result.actionable_items.length > 0) {
        const itemsWithSelection = result.actionable_items.map((item, idx) => ({
          ...item,
          id: `ai_${Date.now()}_${idx}`,
          selected: true,
        }));
        setPendingItems(itemsWithSelection);
      }
    } catch (error) {
      onChange(currentNotes => currentNotes.map(n =>
        n.id === newNoteObj.id
          ? { ...n, subject: "Unprocessed", formatted: rawEntry }
          : n
      ));
    } finally {
      setIsOrganizing(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedNotes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const deleteNote = (id) => {
    onChange(notes.filter(n => n.id !== id));
  };

  const toggleItemSelection = (itemId) => {
    setPendingItems(prev => prev?.map(item =>
      item.id === itemId ? { ...item, selected: !item.selected } : item
    ));
  };

  const updateItemField = (itemId, field, value) => {
    setPendingItems(prev => prev?.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const confirmItems = () => {
    if (!pendingItems) return;
    const selected = pendingItems.filter(i => i.selected);

    const newTasks = selected
      .filter(i => i.type === "task")
      .map(item => ({
        id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        text: item.text,
        done: false,
        created_at: new Date().toISOString(),
        notes: item.notes || "",
      }));

    const newWeeklyItems = selected
      .filter(i => i.type === "scheduled")
      .map(item => ({
        id: `wp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        text: item.text,
        scheduled_date: item.scheduled_date,
        time: item.time || "",
        done: false,
        notes: item.notes || "",
        status: "scheduled",
        reminder_sent: false,
      }));

    const newPriorities = selected
      .filter(i => i.type === "priority")
      .map(item => ({
        id: `prio_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: item.text,
        priority_level: item.priority_level || "medium",
        due_date: item.due_date || "",
        tasks: [],
        created_at: new Date().toISOString(),
      }));

    if (newTasks.length > 0 && onAddTasks) onAddTasks(newTasks);
    if (newWeeklyItems.length > 0 && onAddWeeklyItems) onAddWeeklyItems(newWeeklyItems);
    if (newPriorities.length > 0 && onAddPriorities) onAddPriorities(newPriorities);

    setPendingItems(null);
  };

  const dismissItems = () => {
    setPendingItems(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Brain Dump Notes</h3>
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="h-7 px-2"
          >
            <List className="w-3 h-3" />
          </Button>
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("card")}
            className="h-7 px-2"
          >
            <LayoutGrid className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Dump your thoughts here... AI will organize them and extract actionable items for Tasks & Weekly Planner"
          className="min-h-[80px] resize-none"
          disabled={isOrganizing}
        />
        <div className="flex justify-end">
          <Button onClick={handleAddNote} disabled={!newNote.trim() || isOrganizing} size="sm">
            {isOrganizing ? <Sparkles className="w-3 h-3 mr-1 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
            {isOrganizing ? "Organizing..." : "Add Note"}
          </Button>
        </div>
      </div>

      {/* Actionable Items Confirmation Panel */}
      {pendingItems && pendingItems.length > 0 && (
        <Card className="border-violet-300 bg-violet-50/30">
          <CardContent className="p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-600" />
              <span className="text-sm font-semibold text-violet-700">
                I've identified {pendingItems.length} actionable item{pendingItems.length !== 1 ? "s" : ""} from your note
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Select which items to add to your Tasks and Weekly Planner. Adjust dates/times as needed.
            </p>

            <div className="space-y-2">
              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-2 p-2 rounded-lg border transition-colors ${
                    item.selected ? "border-violet-300 bg-white" : "border-border bg-muted/30 opacity-60"
                  }`}
                >
                  <button
                    onClick={() => toggleItemSelection(item.id)}
                    className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      item.selected
                        ? "bg-violet-600 border-violet-600 text-white"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {item.selected && <Check className="w-3 h-3" />}
                  </button>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      {item.type === "task" ? (
                        <Badge variant="secondary" className="text-xs gap-0.5">
                          <CheckSquare className="w-2.5 h-2.5" /> Task
                        </Badge>
                      ) : item.type === "scheduled" ? (
                        <Badge variant="secondary" className="text-xs gap-0.5 bg-blue-100 text-blue-700">
                          <CalendarDays className="w-2.5 h-2.5" /> Scheduled
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs gap-0.5 bg-amber-100 text-amber-700">
                          <Flag className="w-2.5 h-2.5" /> Priority
                        </Badge>
                      )}
                      <Input
                        value={item.text}
                        onChange={(e) => updateItemField(item.id, "text", e.target.value)}
                        className="h-7 text-xs flex-1"
                        disabled={!item.selected}
                      />
                    </div>
                    {item.type === "scheduled" && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="date"
                          value={item.scheduled_date || ""}
                          onChange={(e) => updateItemField(item.id, "scheduled_date", e.target.value)}
                          className="h-7 text-xs w-auto"
                          disabled={!item.selected}
                        />
                        <Input
                          type="time"
                          value={item.time || ""}
                          onChange={(e) => updateItemField(item.id, "time", e.target.value)}
                          className="h-7 text-xs w-auto"
                          disabled={!item.selected}
                        />
                      </div>
                    )}
                    {item.type === "priority" && (
                      <div className="flex items-center gap-2">
                        <select
                          value={item.priority_level || "medium"}
                          onChange={(e) => updateItemField(item.id, "priority_level", e.target.value)}
                          disabled={!item.selected}
                          className="h-7 text-xs rounded-md border border-input bg-transparent px-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="critical">Critical</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                        <Input
                          type="date"
                          value={item.due_date || ""}
                          onChange={(e) => updateItemField(item.id, "due_date", e.target.value)}
                          placeholder="Due date"
                          className="h-7 text-xs w-auto"
                          disabled={!item.selected}
                        />
                      </div>
                    )}
                    <Input
                      value={item.notes || ""}
                      onChange={(e) => updateItemField(item.id, "notes", e.target.value)}
                      placeholder="Notes (optional)"
                      className="h-7 text-xs"
                      disabled={!item.selected}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={dismissItems} className="text-xs">
                Dismiss
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPendingItems(prev => prev?.map(i => ({ ...i, selected: true })))}
                  className="text-xs"
                >
                  Select All
                </Button>
                <Button
                  size="sm"
                  onClick={confirmItems}
                  disabled={!pendingItems.some(i => i.selected)}
                  className="text-xs gap-1"
                >
                  <Check className="w-3 h-3" />
                  Confirm & Add ({pendingItems.filter(i => i.selected).length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No notes yet. Start brain dumping!
        </div>
      ) : (
        <div className={viewMode === "list" ? "space-y-2" : "grid grid-cols-2 gap-3"}>
          {notes.map((note) => (
            <Card key={note.id} className={viewMode === "card" ? "" : "hover:bg-muted/30 transition-colors"}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">{note.subject}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{note.raw_entry}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleExpand(note.id)}>
                      {expandedNotes[note.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteNote(note.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                {expandedNotes[note.id] && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <div>
                      <p className="text-xs font-medium mb-1">Original:</p>
                      <p className="text-xs text-muted-foreground">{note.raw_entry}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1">Organized:</p>
                      <div className="text-xs prose prose-sm max-w-none">
                        <ReactMarkdown>{note.formatted}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}