import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Plus, ChevronDown, GitCompare, FileDown, Eye, X, Pencil, Users } from "lucide-react";
import OrgChartSheet from "@/components/orgchart/OrgChartSheet";
import OrgChartCompare from "@/components/orgchart/OrgChartCompare";
import TeamsView from "@/components/orgchart/TeamsView";


// PDF export: use browser print on the chart area
function printSheet(name) {
  const el = document.getElementById("org-chart-print-area");
  if (!el) return;
  const win = window.open("", "_blank");
  win.document.write(`<html><head><title>${name}</title><style>
    body { font-family: sans-serif; }
    * { box-sizing: border-box; }
    @media print { body { margin: 0; } }
  </style></head><body>${el.innerHTML}</body></html>`);
  win.document.close();
  win.focus();
  win.print();
  win.close();
}

export default function EDOrgChart() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // ---- Canonical positions (Tab 0 = Original) ----
  const { data: positions = [] } = useQuery({
    queryKey: ["ed-org"],
    queryFn: () => base44.entities.EDOrgPosition.list(),
  });

  // ---- Scenario sheets ----
  const { data: scenarios = [], refetch: refetchScenarios } = useQuery({
    queryKey: ["ed-org-scenarios"],
    queryFn: () => base44.entities.EDOrgScenario.list(),
    staleTime: 0,
  });

  // ---- Canonical undo/redo restore (called from OrgChartSheet) ----
  const handleUndoRestoreCanonical = async (snapshotPositions) => {
    await Promise.all(positions.map(p => base44.entities.EDOrgPosition.delete(p.id)));
    await Promise.all(snapshotPositions.map(p => {
      const { id, created_date, updated_date, ...rest } = p;
      return base44.entities.EDOrgPosition.create({ ...rest, owner_id: user?.id });
    }));
    qc.invalidateQueries({ queryKey: ["ed-org"] });
  };

  // ---- UI state ----
  const [mode, setMode] = useState("chart"); // "chart" | "teams"
  const [activeTab, setActiveTab] = useState(0); // 0 = original
  const [showSalary, setShowSalary] = useState(true);
  const [showNames, setShowNames] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelected, setCompareSelected] = useState([]);
  const [newSheetDialog, setNewSheetDialog] = useState(false);
  const [newSheetName, setNewSheetName] = useState("");
  const [newSheetSource, setNewSheetSource] = useState("original"); // "original" | scenario id | "blank"
  const [renameDialog, setRenameDialog] = useState(null); // scenario id
  const [renameName, setRenameName] = useState("");

  // Force refresh scenarios when switching tabs to ensure latest data
  useEffect(() => {
    refetchScenarios();
  }, [activeTab]);

  // ---- Canonical CRUD ----
  const saveCanonical = async (form, editId) => {
    // Strip built-in read-only fields before saving
    const { id, created_date, updated_date, created_by_id, ...rest } = form;
    const data = {
      ...rest,
      salary: parseFloat(rest.salary) || 0,
      hourly_rate: parseFloat(rest.hourly_rate) || 0,
      hours_per_week: parseFloat(rest.hours_per_week) || 0,
      weeks_per_year: parseFloat(rest.weeks_per_year) || 0,
      dotted_line_reports_to_id: rest.dotted_line_reports_to_id || null,
      row_number: (rest.row_number !== "" && rest.row_number != null) ? Number(rest.row_number) : null,
    };
    if (editId) await base44.entities.EDOrgPosition.update(editId, data);
    else await base44.entities.EDOrgPosition.create({ ...data, owner_id: user?.id });
    qc.invalidateQueries({ queryKey: ["ed-org"] });
  };

  const deleteCanonical = async (id) => {
    await base44.entities.EDOrgPosition.delete(id);
    qc.invalidateQueries({ queryKey: ["ed-org"] });
  };

  // ---- Scenario CRUD ----
  const createScenario = async () => {
    if (!newSheetName.trim()) return;
    let snapshotPositions = [];
    if (newSheetSource === "original") {
      snapshotPositions = positions.map(p => ({
        id: p.id,
        original_id: p.id,
        title: p.title,
        person_name: p.person_name,
        department: p.department,
        tier: p.tier,
        row_number: (p.row_number !== "" && p.row_number != null) ? Number(p.row_number) : null,
        reports_to_id: p.reports_to_id,
        dotted_line_reports_to_id: p.dotted_line_reports_to_id,
        salary: p.salary,
        hourly_rate: p.hourly_rate,
        hours_per_week: p.hours_per_week,
        weeks_per_year: p.weeks_per_year,
        has_summer_hours: p.has_summer_hours,
        summer_hours_per_week: p.summer_hours_per_week,
        summer_weeks: p.summer_weeks,
        is_vacant: p.is_vacant,
        notes: p.notes,
      }));
    } else if (newSheetSource === "blank") {
      snapshotPositions = [];
    } else {
      // duplicate another scenario
      const src = scenarios.find(s => s.id === newSheetSource);
      if (src) snapshotPositions = (src.positions || []).map(p => ({ ...p }));
    }
    await base44.entities.EDOrgScenario.create({
      name: newSheetName.trim(),
      positions: snapshotPositions,
      owner_id: user?.id,
    });
    await qc.invalidateQueries({ queryKey: ["ed-org-scenarios"] });
    setNewSheetDialog(false);
    setNewSheetName("");
    setNewSheetSource("original");
    // Switch to the new tab (will be last)
    setActiveTab(scenarios.length + 1);
  };

  const saveScenarioPositions = async (scenarioId, newPositions, newRemovedPositions) => {
    const cleanPositions = newPositions.map(p => ({
      ...p,
      row_number: (p.row_number !== "" && p.row_number != null) ? Number(p.row_number) : null,
      reports_to_id: p.reports_to_id || null,
      dotted_line_reports_to_id: p.dotted_line_reports_to_id || null,
    }));
    const updateData = { positions: cleanPositions };
    if (newRemovedPositions !== undefined) updateData.removed_positions = newRemovedPositions;
    await base44.entities.EDOrgScenario.update(scenarioId, updateData);
    qc.invalidateQueries({ queryKey: ["ed-org-scenarios"] });
  };

  const deleteScenario = async (id) => {
    await base44.entities.EDOrgScenario.delete(id);
    qc.invalidateQueries({ queryKey: ["ed-org-scenarios"] });
    if (activeTab > scenarios.length - 1) setActiveTab(0);
  };

  const renameScenario = async () => {
    if (!renameName.trim()) return;
    await base44.entities.EDOrgScenario.update(renameDialog, { name: renameName.trim() });
    qc.invalidateQueries({ queryKey: ["ed-org-scenarios"] });
    setRenameDialog(null);
  };

  // ---- Compare ----
  const allSheets = [
    { id: "original", name: "Original", positions, isScenario: false },
    ...scenarios.map(s => ({ id: s.id, name: s.name, positions: s.positions || [], isScenario: true })),
  ];

  const toggleCompareSheet = (id) => {
    setCompareSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const compareSheetsData = allSheets.filter(s => compareSelected.includes(s.id));

  // ---- Current sheet ----
  const currentScenario = activeTab > 0 ? scenarios[activeTab - 1] : null;

  // ---- PDF export ----
  const handleExportPDF = () => {
    const tabName = activeTab === 0 ? "Original" : (currentScenario?.name || "Scenario");
    printSheet(tabName);
  };

  const handleExportAll = () => {
    allSheets.forEach((sheet, i) => {
      setTimeout(() => printSheet(sheet.name), i * 800);
    });
  };

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-card gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <h1 className="text-xl font-bold mr-3">Org Chart</h1>
          {/* Mode toggle */}
          <div className="flex rounded-md border overflow-hidden">
            <button onClick={() => setMode("chart")} className={`px-3 py-1 text-sm transition-colors ${mode === "chart" ? "bg-accent text-accent-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}>Chart</button>
            <button onClick={() => setMode("teams")} className={`flex items-center gap-1 px-3 py-1 text-sm border-l transition-colors ${mode === "teams" ? "bg-accent text-accent-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}><Users className="w-3.5 h-3.5" /> Teams</button>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Visibility toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Eye className="w-4 h-4" /> View <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Show / Hide</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={showSalary} onCheckedChange={setShowSalary}>
                Salary & Payroll
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={showNames} onCheckedChange={setShowNames}>
                Staff Names
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Compare */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <GitCompare className="w-4 h-4" /> Compare <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Select sheets to compare</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allSheets.map(s => (
                <DropdownMenuCheckboxItem
                  key={s.id}
                  checked={compareSelected.includes(s.id)}
                  onCheckedChange={() => toggleCompareSheet(s.id)}
                >
                  {s.name}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <div className="px-2 py-1">
                <Button
                  size="sm" className="w-full"
                  disabled={compareSelected.length < 2}
                  onClick={() => setCompareMode(true)}
                >
                  Compare {compareSelected.length > 0 ? `(${compareSelected.length})` : ""}
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export PDF */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <FileDown className="w-4 h-4" /> Export <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Save as PDF</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-1 space-y-1">
                <Button size="sm" variant="outline" className="w-full" onClick={handleExportPDF}>
                  Current sheet
                </Button>
                <Button size="sm" variant="outline" className="w-full" onClick={handleExportAll}>
                  All sheets
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tab bar — only in chart mode, placed ABOVE chart so mobile browser chrome can't cover it */}
      {mode === "chart" && (
        <div className="border-b bg-card flex items-center gap-0.5 px-2 py-1 overflow-x-auto shrink-0">
          {/* Original tab */}
          <button
            onClick={() => setActiveTab(0)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-b-md text-sm font-medium border border-t-0 transition-colors whitespace-nowrap ${
              activeTab === 0
                ? "bg-yellow-200 text-yellow-900 border-yellow-300 shadow-md"
                : "bg-yellow-50 text-yellow-800 hover:bg-yellow-100 border-yellow-200"
            }`}
          >
            📋 Original
          </button>

          {/* Scenario tabs */}
          {scenarios.map((s, i) => (
            <div
              key={s.id}
              className={`group flex items-center gap-1 px-3 py-1.5 rounded-b-md text-sm border border-t-0 transition-colors whitespace-nowrap ${
                activeTab === i + 1
                  ? "bg-yellow-200 text-yellow-900 border-yellow-300 shadow-md font-medium"
                  : "bg-yellow-50 text-yellow-800 hover:bg-yellow-100 border-yellow-200"
              }`}
            >
              <button onClick={() => setActiveTab(i + 1)} className="flex items-center gap-1.5">
                🔬 {s.name}
              </button>
              <button
                onClick={() => { setRenameDialog(s.id); setRenameName(s.name); }}
                className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-0.5 rounded"
              >
                <Pencil className="w-2.5 h-2.5" />
              </button>
              <button
                onClick={() => deleteScenario(s.id)}
                className="opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-destructive transition-opacity p-0.5 rounded"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}

          {/* Add new sheet */}
          <button
            onClick={() => setNewSheetDialog(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-b-md text-sm text-yellow-700 hover:text-yellow-900 hover:bg-yellow-100 border border-yellow-200 bg-yellow-50 transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> New Sheet
          </button>

          {/* Legend for scenario tabs */}
          {activeTab > 0 && (
            <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground px-2">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-blue-300 inline-block" /> Unchanged</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-orange-400 inline-block" /> Modified</span>
            </div>
          )}
        </div>
      )}

      {/* Teams mode */}
      {mode === "teams" && (
        <div className="flex-1 overflow-hidden">
          <TeamsView positions={positions} currentUser={user} />
        </div>
      )}

      {/* Chart area */}
      {mode === "chart" && <div className="flex-1 overflow-hidden" id="org-chart-print-area">
        {activeTab === 0 ? (
          <OrgChartSheet
            positions={positions}
            isOriginal
            onSavePosition={saveCanonical}
            onDeletePosition={deleteCanonical}
            onUndoRestoreCanonical={handleUndoRestoreCanonical}
            showSalary={showSalary}
            showNames={showNames}
            originalPositions={positions}
            basePositions={null}
          />
        ) : currentScenario ? (
          <OrgChartSheet
            key={currentScenario.id}
            positions={positions}
            scenarioPositions={currentScenario.positions || []}
            initialRemovedPositions={currentScenario.removed_positions || []}
            onScenarioChange={(newPos, newRemoved) => saveScenarioPositions(currentScenario.id, newPos, newRemoved)}
            isOriginal={false}
            showSalary={showSalary}
            showNames={showNames}
            originalPositions={positions}
            basePositions={positions}
          />
        ) : null}
      </div>}

      {/* New Sheet Dialog */}
      <Dialog open={newSheetDialog} onOpenChange={setNewSheetDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Scenario Sheet</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Sheet name (e.g. Budget Cut Scenario)"
              value={newSheetName}
              onChange={e => setNewSheetName(e.target.value)}
            />
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Start from</label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={newSheetSource === "original"} onChange={() => setNewSheetSource("original")} />
                  <span className="text-sm">Duplicate Original</span>
                </label>
                {scenarios.map(s => (
                  <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={newSheetSource === s.id} onChange={() => setNewSheetSource(s.id)} />
                    <span className="text-sm">Duplicate "{s.name}"</span>
                  </label>
                ))}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={newSheetSource === "blank"} onChange={() => setNewSheetSource("blank")} />
                  <span className="text-sm">Start blank</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewSheetDialog(false)}>Cancel</Button>
              <Button onClick={createScenario} disabled={!newSheetName.trim()}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={!!renameDialog} onOpenChange={v => !v && setRenameDialog(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Rename Sheet</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={renameName} onChange={e => setRenameName(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRenameDialog(null)}>Cancel</Button>
              <Button onClick={renameScenario}>Rename</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Compare overlay */}
      {compareMode && compareSheetsData.length >= 2 && (
        <OrgChartCompare
          sheets={compareSheetsData}
          onClose={() => setCompareMode(false)}
          showSalary={showSalary}
          showNames={showNames}
          originalPositions={positions}
        />
      )}
    </div>
  );
}