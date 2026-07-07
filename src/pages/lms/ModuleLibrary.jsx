import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus, BookOpen, Search, ChevronRight, ChevronDown, FolderOpen,
} from "lucide-react";
import {
  MODULE_CATEGORIES, MODULE_STATUSES, DIFFICULTY_LEVELS,
  getModuleCategory, getDifficulty, getModuleStatus,
} from "@/lib/lmsConstants";
import ModuleCard from "@/components/lms/ModuleCard";

export default function ModuleLibrary() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [groupBy, setGroupBy] = useState("none");
  const [collapsedGroups, setCollapsedGroups] = useState({});
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

  const GROUP_OPTIONS = [
    { value: "none", label: "No grouping" },
    { value: "program", label: "Program" },
    { value: "category", label: "Category" },
    { value: "status", label: "Status" },
    { value: "difficulty", label: "Difficulty" },
  ];

  const groupLabelMap = {
    category: MODULE_CATEGORIES,
    status: MODULE_STATUSES,
    difficulty: DIFFICULTY_LEVELS,
  };

  const grouped = useMemo(() => {
    if (groupBy === "none") return null;
    const groups = {};
    if (groupBy === "program") {
      filtered.forEach(m => {
        const key = m.program_id || "no_program";
        if (!groups[key]) groups[key] = [];
        groups[key].push(m);
      });
      const progOrder = programs
        .map(p => p.id)
        .filter(k => groups[k]);
      if (groups.no_program) progOrder.push("no_program");
      return progOrder.map(key => {
        const prog = programs.find(p => p.id === key);
        return {
          key,
          label: key === "no_program" ? "No Program" : (prog?.title || "Unknown Program"),
          color: "",
          modules: groups[key],
        };
      });
    }
    filtered.forEach(m => {
      const key = m[groupBy] || "uncategorized";
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    const labelSource = groupLabelMap[groupBy] || [];
    const orderedKeys = labelSource.map(o => o.value).filter(k => groups[k]);
    if (groups.uncategorized) orderedKeys.push("uncategorized");
    return orderedKeys.map(key => {
      const meta = labelSource.find(o => o.value === key);
      return {
        key,
        label: meta?.label || (key === "uncategorized" ? "Uncategorized" : key),
        color: meta?.color || "",
        modules: groups[key],
      };
    });
  }, [filtered, groupBy, programs]);

  const toggleGroup = (key) => {
    setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

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
        <select value={groupBy} onChange={e => setGroupBy(e.target.value)} className="h-9 rounded-md border border-input bg-transparent text-sm px-3">
          {GROUP_OPTIONS.map(o => <option key={o.value} value={o.value}>Group by: {o.label}</option>)}
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
      ) : grouped ? (
        <div className="space-y-4">
          {grouped.map(group => (
            <div key={group.key}>
              <button
                onClick={() => toggleGroup(group.key)}
                className="w-full flex items-center gap-2 mb-3 group-header"
              >
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${collapsedGroups[group.key] ? "-rotate-90" : ""}`} />
                <FolderOpen className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">{group.label}</span>
                <Badge variant="secondary" className="text-[10px]">{group.modules.length}</Badge>
                <div className="flex-1 h-px bg-border ml-2" />
              </button>
              {!collapsedGroups[group.key] && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-6">
                  {group.modules.map(mod => (
                    <ModuleCard key={mod.id} mod={mod} usageCount={usageMap[mod.id] || 0} onDelete={handleDelete} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(mod => (
            <ModuleCard key={mod.id} mod={mod} usageCount={usageMap[mod.id] || 0} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}