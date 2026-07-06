import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, Package, Clock, Layers, ChevronRight, Search,
} from "lucide-react";
import {
  PROGRAM_CATEGORIES, getProgramCategory, getDifficulty, getModuleStatus,
} from "@/lib/lmsConstants";

export default function Programs() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: programs = [] } = useQuery({
    queryKey: ["lms-programs"],
    queryFn: () => base44.entities.TrainingProgram.list("-updated_date"),
  });

  const filtered = programs.filter(p => {
    if (!search) return true;
    return p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
  });

  const handleDelete = async (prog) => {
    if (!confirm(`Delete "${prog.title}"? This cannot be undone.`)) return;
    await base44.entities.TrainingProgram.delete(prog.id);
    qc.invalidateQueries({ queryKey: ["lms-programs"] });
  };

  const handleCreate = async () => {
    const created = await base44.entities.TrainingProgram.create({
      title: "Untitled Program",
      description: "",
      category: "onboarding",
      status: "draft",
      version: 1,
      learning_paths: [],
    });
    qc.invalidateQueries({ queryKey: ["lms-programs"] });
    // For now, just reload to show it in the list
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link to="/lms" className="hover:underline">Dashboard</Link>
            <ChevronRight className="w-3 h-3" />
            <span>Programs</span>
          </div>
          <h1 className="text-2xl font-bold">Training Programs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Curated collections of reusable modules with learning paths and prerequisites</p>
        </div>
        <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" /> Create Program</Button>
      </div>

      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search programs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-9 pl-8 pr-3 rounded-md border border-input bg-transparent text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground mb-1">{programs.length === 0 ? "No programs yet." : "No programs match your search."}</p>
            <p className="text-xs text-muted-foreground mb-4">
              {programs.length === 0 ? "Create a training program to organize modules into learning paths." : "Try a different search."}
            </p>
            {programs.length === 0 && <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" /> Create First Program</Button>}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(prog => {
            const cat = getProgramCategory(prog.category);
            const status = getModuleStatus(prog.status);
            const diff = getDifficulty(prog.difficulty);
            const paths = prog.learning_paths || [];
            const totalModules = paths.reduce((sum, p) => sum + (p.module_entries || []).length, 0);
            return (
              <Card key={prog.id} className="hover:shadow-md transition-shadow group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="outline" className={`text-[10px] ${cat.color}`}>{cat.label}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${status.color}`}>{status.label}</Badge>
                  </div>
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">{prog.title}</h3>
                  {prog.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{prog.description}</p>}
                  <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    <span className={diff.color}>{diff.label}</span>
                    {prog.estimated_duration_hours > 0 && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {prog.estimated_duration_hours}h</span>}
                    {paths.length > 0 && <span className="flex items-center gap-0.5"><Layers className="w-3 h-3" /> {paths.length} path(s)</span>}
                    {totalModules > 0 && <span>{totalModules} module(s)</span>}
                  </div>
                  <div className="flex justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(prog)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {programs.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              <strong>Coming next:</strong> Visual curriculum designer with drag-and-drop module mapping, prerequisite connections, branching learning paths, and program validation — will be built on top of these programs.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}