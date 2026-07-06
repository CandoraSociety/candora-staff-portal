import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, Package, Plus, Clock, FileText, HelpCircle,
  Layers, TrendingUp, ArrowRight, Sparkles,
} from "lucide-react";
import {
  MODULE_CATEGORIES, getModuleStatus, getModuleCategory, getModuleStats,
} from "@/lib/lmsConstants";

export default function LMSDashboard() {
  const { data: modules = [] } = useQuery({
    queryKey: ["lms-modules"],
    queryFn: () => base44.entities.TrainingModule.list("-updated_date"),
  });

  const { data: programs = [] } = useQuery({
    queryKey: ["lms-programs"],
    queryFn: () => base44.entities.TrainingProgram.list("-updated_date"),
  });

  const publishedModules = modules.filter(m => m.status === "published");
  const draftModules = modules.filter(m => m.status === "draft");
  const publishedPrograms = programs.filter(p => p.status === "published");

  // Category breakdown
  const categoryCounts = MODULE_CATEGORIES.map(cat => ({
    ...cat,
    count: modules.filter(m => m.category === cat.value).length,
  })).filter(c => c.count > 0);

  // Recent modules
  const recentModules = modules.slice(0, 5);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Training Authoring Platform</h1>
          <p className="text-sm text-muted-foreground mt-1">Design, build, organize, and deliver unlimited training programs</p>
        </div>
        <div className="flex gap-2">
          <Link to="/lms/modules"><Button variant="outline"><BookOpen className="w-4 h-4 mr-2" /> Module Library</Button></Link>
          <Link to="/lms/modules/new"><Button><Plus className="w-4 h-4 mr-2" /> Create Module</Button></Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <BookOpen className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold">{modules.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Total Modules</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <Package className="w-5 h-5 text-purple-500" />
              <span className="text-2xl font-bold">{programs.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Training Programs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold">{publishedModules.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Published Modules</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <Layers className="w-5 h-5 text-amber-500" />
              <span className="text-2xl font-bold">{draftModules.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Drafts in Progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Content breakdown + recent modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category breakdown */}
        <Card className="lg:col-span-1">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-3">Modules by Category</h3>
            {categoryCounts.length === 0 ? (
              <p className="text-sm text-muted-foreground/60 italic">No modules yet.</p>
            ) : (
              <div className="space-y-2">
                {categoryCounts.map(cat => {
                  const pct = modules.length > 0 ? (cat.count / modules.length) * 100 : 0;
                  return (
                    <div key={cat.value}>
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span>{cat.label}</span>
                        <span className="text-muted-foreground">{cat.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${cat.color.split(" ")[0]}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent modules */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Recent Modules</h3>
              <Link to="/lms/modules" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {recentModules.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground mb-3">No modules yet. Create your first training module to get started.</p>
                <Link to="/lms/modules/new"><Button size="sm"><Plus className="w-3.5 h-3.5 mr-1" /> Create Module</Button></Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentModules.map(mod => {
                  const stats = getModuleStats(mod);
                  const status = getModuleStatus(mod.status);
                  const cat = getModuleCategory(mod.category);
                  return (
                    <Link key={mod.id} to={`/lms/modules/${mod.id}/edit`} className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cat.color}`}>
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{mod.title}</p>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span>{stats.chapters} ch · {stats.blocks} blocks</span>
                          {stats.quizBlocks > 0 && <span className="flex items-center gap-0.5"><HelpCircle className="w-3 h-3" /> {stats.quizBlocks}</span>}
                          {mod.duration_minutes > 0 && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {mod.duration_minutes}m</span>}
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${status.color}`}>{status.label}</Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Getting started guide */}
      {modules.length === 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">How to build training on this platform</h3>
                <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
                  <li>Create <strong>Modules</strong> — reusable learning units with chapters, sections, and content blocks</li>
                  <li>Build <strong>Programs</strong> — curated collections of modules with learning paths and prerequisites</li>
                  <li>Assign <strong>Learners</strong> to programs and track their progress</li>
                </ol>
                <p className="text-xs text-muted-foreground mt-2">Modules are reusable — build once, use across unlimited programs.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}