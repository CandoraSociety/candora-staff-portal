import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Pencil, Trash2, BookOpen, Clock, Search, FileText, Video, Presentation, File, HelpCircle, Layers, MousePointerClick
} from "lucide-react";
import ModuleEditorDialog from "./ModuleEditorDialog";
import {
  MODULE_CATEGORIES, MODULE_STATUSES,
  getModuleCategory, getContentType, getDifficulty, getModuleStatus,
} from "@/lib/trainingModuleConstants";

const CONTENT_ICONS = {
  rich_text: FileText, presentation: Presentation, video: Video,
  document: File, interactive: MousePointerClick, quiz: HelpCircle, mixed: Layers,
};

export default function ModuleBuilderTab() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const { data: modules = [] } = useQuery({
    queryKey: ["training-modules"],
    queryFn: () => base44.entities.TrainingModule.list("-updated_date"),
  });

  const filtered = modules.filter(m => {
    const matchSearch = !search ||
      m.title?.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase()) ||
      m.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchCat = filterCategory === "all" || m.category === filterCategory;
    return matchSearch && matchCat;
  });

  const handleDelete = async (mod) => {
    if (!confirm(`Delete "${mod.title}"? This cannot be undone.`)) return;
    await base44.entities.TrainingModule.delete(mod.id);
    qc.invalidateQueries({ queryKey: ["training-modules"] });
  };

  const handleSave = async () => {
    qc.invalidateQueries({ queryKey: ["training-modules"] });
    setDialogOpen(false);
    setEditingModule(null);
  };

  return (
    <div className="space-y-4">
      {/* Header + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Module Builder</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create reusable training modules with rich content, slides, videos, and quizzes</p>
        </div>
        <Button onClick={() => { setEditingModule(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> New Module
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {MODULE_STATUSES.map(s => {
          const count = modules.filter(m => m.status === s.value).length;
          return (
            <Card key={s.value}>
              <CardContent className="p-3 flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}>
                  <span className="text-xs font-bold">{count}</span>
                </div>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search modules by title, description, or tag..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-md border border-input bg-transparent text-sm"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent text-sm px-3"
        >
          <option value="all">All Categories</option>
          {MODULE_CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Module grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground mb-1">{modules.length === 0 ? "No modules yet." : "No modules match your filters."}</p>
            <p className="text-xs text-muted-foreground mb-4">
              {modules.length === 0 ? "Build your first training module with rich text, slides, videos, and quizzes." : "Try adjusting your search or filter."}
            </p>
            {modules.length === 0 && (
              <Button onClick={() => { setEditingModule(null); setDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Create First Module
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(mod => {
            const cat = getModuleCategory(mod.category);
            const status = getModuleStatus(mod.status);
            const diff = getDifficulty(mod.difficulty);
            const cType = getContentType(mod.content_type);
            const ContentIcon = CONTENT_ICONS[cType.value] || FileText;
            return (
              <Card key={mod.id} className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => { setEditingModule(mod); setDialogOpen(true); }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="outline" className={`text-[10px] ${cat.color}`}>{cat.label}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${status.color}`}>{status.label}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <ContentIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <h3 className="font-semibold text-sm truncate">{mod.title}</h3>
                  </div>
                  {mod.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{mod.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    <span className={diff.color}>{diff.label}</span>
                    {mod.duration_minutes > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" /> {mod.duration_minutes}min
                      </span>
                    )}
                    {mod.file_attachments?.length > 0 && (
                      <span className="flex items-center gap-0.5">
                        <FileText className="w-3 h-3" /> {mod.file_attachments.length} file{mod.file_attachments.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    {mod.quiz_questions?.length > 0 && (
                      <span className="flex items-center gap-0.5">
                        <HelpCircle className="w-3 h-3" /> {mod.quiz_questions.length} Q
                      </span>
                    )}
                  </div>
                  <div className="flex justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEditingModule(mod); setDialogOpen(true); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(mod); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {dialogOpen && (
        <ModuleEditorDialog
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); setEditingModule(null); }}
          onSave={handleSave}
          editingModule={editingModule}
        />
      )}
    </div>
  );
}