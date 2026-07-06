import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Pencil, Trash2, Layers, Search, Clock, Users, ListOrdered, GitBranch
} from "lucide-react";
import ProgramEditorDialog from "./ProgramEditorDialog";
import {
  PROGRAM_CATEGORIES, PROGRAM_STATUSES,
  getProgramCategory, getProgramStatus,
} from "@/lib/trainingModuleConstants";

export default function ProgramBuilderTab() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [search, setSearch] = useState("");

  const { data: programs = [] } = useQuery({
    queryKey: ["training-programs"],
    queryFn: () => base44.entities.TrainingProgram.list("-updated_date"),
  });

  const filtered = programs.filter(p =>
    !search ||
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase()) ||
    p.target_audience?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (prog) => {
    if (!confirm(`Delete "${prog.title}"? This cannot be undone.`)) return;
    await base44.entities.TrainingProgram.delete(prog.id);
    qc.invalidateQueries({ queryKey: ["training-programs"] });
  };

  const handleSave = async () => {
    qc.invalidateQueries({ queryKey: ["training-programs"] });
    setDialogOpen(false);
    setEditingProgram(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Program Builder</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Assemble modules into structured training programs — linear sequences or multi-track paths</p>
        </div>
        <Button onClick={() => { setEditingProgram(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> New Program
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PROGRAM_STATUSES.map(s => {
          const count = programs.filter(p => p.status === s.value).length;
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search programs by title, description, or audience..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-9 pl-8 pr-3 rounded-md border border-input bg-transparent text-sm"
        />
      </div>

      {/* Programs grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Layers className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground mb-1">{programs.length === 0 ? "No programs yet." : "No programs match your search."}</p>
            <p className="text-xs text-muted-foreground mb-4">
              {programs.length === 0 ? "Create a program to organize modules into a learning path." : "Try adjusting your search."}
            </p>
            {programs.length === 0 && (
              <Button onClick={() => { setEditingProgram(null); setDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Create First Program
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(prog => {
            const cat = getProgramCategory(prog.category);
            const status = getProgramStatus(prog.status);
            const moduleCount = prog.module_entries?.length || 0;
            const trackCount = prog.structure_type === "tracks"
              ? new Set(prog.module_entries?.map(e => e.track_name || "Default")).size
              : 0;
            return (
              <Card key={prog.id} className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => { setEditingProgram(prog); setDialogOpen(true); }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="outline" className={`text-[10px] ${cat.color}`}>{cat.label}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${status.color}`}>{status.label}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    {prog.structure_type === "tracks" ? <GitBranch className="w-4 h-4 text-indigo-500" /> : <ListOrdered className="w-4 h-4 text-blue-500" />}
                    <h3 className="font-semibold text-sm truncate">{prog.title}</h3>
                  </div>
                  {prog.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{prog.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Layers className="w-3 h-3" /> {moduleCount} module{moduleCount !== 1 ? "s" : ""}
                    </span>
                    {prog.structure_type === "tracks" && trackCount > 0 && (
                      <span className="flex items-center gap-0.5">
                        <GitBranch className="w-3 h-3" /> {trackCount} track{trackCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {prog.estimated_duration_hours > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" /> {prog.estimated_duration_hours}h
                      </span>
                    )}
                    {prog.target_audience && (
                      <span className="flex items-center gap-0.5 truncate">
                        <Users className="w-3 h-3" /> {prog.target_audience}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEditingProgram(prog); setDialogOpen(true); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(prog); }}>
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
        <ProgramEditorDialog
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); setEditingProgram(null); }}
          onSave={handleSave}
          editingProgram={editingProgram}
        />
      )}
    </div>
  );
}