import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Pencil, Trash2, BookOpen, Clock, Search, HelpCircle, Layers,
  Package, ChevronRight,
} from "lucide-react";
import {
  MODULE_CATEGORIES, getModuleCategory, getDifficulty, getModuleStatus, getModuleStats,
} from "@/lib/lmsConstants";

export default function ModuleLibrary() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const { data: modules = [] } = useQuery({
    queryKey: ["lms-modules"],
    queryFn: () => base44.entities.TrainingModule.list("-updated_date"),
  });

  const { data: programs = [] } = useQuery({
    queryKey: ["lms-programs"],
    queryFn: () => base44.entities.TrainingProgram.list(),
  });

  // Compute usage map: module_id -> program count
  const usageMap = useMemo(() => {
    const map = {};
    programs.forEach(prog => {
      const paths = prog.learning_paths || [];
      paths.forEach(path => {
        (path.module_entries || []).forEach(entry => {
          if (entry.module_id) map[entry.module_id] = (map[entry.module_id] || 0) + 1;
        });
      });
      if (prog.module_entries) {
        prog.module_entries.forEach(entry => {
          if (entry.module_id) map[entry.module_id] = (map[entry.module_id] || 0) + 1;
        });
      }
    });
    return map;
  }, [programs]);

  const filtered = modules.filter(m => {
    const matchSearch = !search ||
      m.title?.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase()) ||
      m.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchCat = filterCategory === "all" || m.category === filterCategory;
    const matchStatus = filterStatus === "all" || m.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const handleDelete = async (mod) => {
    const usageCount = usageMap[mod.id] || 0;
    const warnMsg = usageCount > 0
      ? `⚠️ This module is used in ${usageCount} program(s). Deleting it will remove it from those programs. Are you sure?`
      : `Delete "${mod.title}"? This cannot be undone.`;
    if (!confirm(warnMsg)) return;
    await base44.entities.TrainingModule.delete(mod.id);
    qc.invalidateQueries({ queryKey: ["lms-modules"] });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link to="/lms" className="hover:underline">Dashboard</Link>
            <ChevronRight className="w-3 h-3" />
            <span>Module Library</span>
          </div>
          <h1 className="text-2xl font-bold">Module Library</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Reusable learning modules — build once, use across unlimited programs</p>
        </div>
        <Link to="/lms/modules/new"><Button><Plus className="w-4 h-4 mr-2" /> Create Module</Button></Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title, description, or tag..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-md border border-input bg-transparent text-sm"
          />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="h-9 rounded-md border border-input bg-transparent text-sm px-3">
          <option value="all">All Categories</option>
          {MODULE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-9 rounded-md border border-input bg-transparent text-sm px-3">
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="review">In Review</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Module grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground mb-1">{modules.length === 0 ? "No modules yet." : "No modules match your filters."}</p>
            <p className="text-xs text-muted-foreground mb-4">
              {modules.length === 0 ? "Create your first reusable learning module with chapters, sections, and content blocks." : "Try adjusting your search or filters."}
            </p>
            {modules.length === 0 && (
              <Link to="/lms/modules/new"><Button><Plus className="w-4 h-4 mr-2" /> Create First Module</Button></Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(mod => {
            const cat = getModuleCategory(mod.category);
            const status = getModuleStatus(mod.status);
            const diff = getDifficulty(mod.difficulty);
            const stats = getModuleStats(mod);
            const usageCount = usageMap[mod.id] || 0;
            return (
              <Card key={mod.id} className="cursor-pointer hover:shadow-md transition-shadow group" >
                <Link to={`/lms/modules/${mod.id}/edit`} className="block">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant="outline" className={`text-[10px] ${cat.color}`}>{cat.label}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${status.color}`}>{status.label}</Badge>
                    </div>
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">{mod.title}</h3>
                    {mod.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{mod.description}</p>}
                    <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                      <span className={diff.color}>{diff.label}</span>
                      {mod.duration_minutes > 0 && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {mod.duration_minutes}m</span>}
                      {stats.chapters > 0 && <span className="flex items-center gap-0.5"><Layers className="w-3 h-3" /> {stats.chapters}ch</span>}
                      {stats.blocks > 0 && <span>{stats.blocks} blocks</span>}
                      {stats.quizBlocks > 0 && <span className="flex items-center gap-0.5"><HelpCircle className="w-3 h-3" /> {stats.quizBlocks}</span>}
                    </div>
                    {usageCount > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <Badge variant="secondary" className="text-[10px]">
                          <Package className="w-2.5 h-2.5 mr-1" /> Used in {usageCount} program{usageCount !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Link>
                <div className="flex justify-end gap-1 px-4 pb-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link to={`/lms/modules/${mod.id}/edit`}><Button size="icon" variant="ghost" className="h-7 w-7"><Pencil className="w-3.5 h-3.5" /></Button></Link>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(mod)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}