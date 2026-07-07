import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pencil, Trash2, Clock, HelpCircle, Layers, Package,
} from "lucide-react";
import { getModuleCategory, getDifficulty, getModuleStatus, getModuleStats } from "@/lib/lmsConstants";

export default function ModuleCard({ mod, usageCount, onDelete }) {
  const cat = getModuleCategory(mod.category);
  const status = getModuleStatus(mod.status);
  const diff = getDifficulty(mod.difficulty);
  const stats = getModuleStats(mod);

  return (
    <Card key={mod.id} className="cursor-pointer hover:shadow-md transition-shadow group">
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
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDelete(mod)}><Trash2 className="w-3.5 h-3.5" /></Button>
      </div>
    </Card>
  );
}