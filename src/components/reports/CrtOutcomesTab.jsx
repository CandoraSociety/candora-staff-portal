import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users, CheckCircle2, Briefcase, Target, Calendar, TrendingUp,
  Filter, X, RefreshCw, FileSpreadsheet, Navigation,
} from "lucide-react";

// Outcome codes that appear in the CRT Placement Outcome / 90 Day Outcome columns.
const OUTCOME_LABELS = {
  "E-RF": "E-RF — Employed, Related Field",
  "E-UF": "E-UF — Employed, Unrelated Field",
  "E-PT": "E-PT — Employed, Part-time",
  "SE": "SE — Self-Employed",
  "UE-LFW": "UE-LFW — Looking for Work",
  "UE-NLF": "UE-NLF — Not in Labour Force",
  "FTT": "FTT — Further Training",
  "AoP": "AoP — Active on Program",
  "UTC": "UTC — Unable to Contact",
  "P": "P — Projected",
  "C": "C — Cancelled",
};

const EMPLOYED = ["E-RF", "E-UF", "SE"];

// Parse CRT date strings (MM/DD/YY or MM/DD/YYYY) into a Date for range filtering.
const parseCrtDate = (s) => {
  if (!s) return null;
  const m = String(s).match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) {
    let y = +m[3]; if (y < 100) y += 2000;
    const d = new Date(y, +m[1] - 1, +m[2]);
    return isNaN(d) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d) ? null : d;
};

const isCeis = (r) =>
  r.service_element === "CEIS" ||
  (r.ceis_dea && !["", "no", "n"].includes(String(r.ceis_dea).trim().toLowerCase()));
const isWd = (r) => r.service_element === "WD";
const isYes = (v) => ["yes", "y"].includes(String(v || "").trim().toLowerCase());

export default function CrtOutcomesTab() {
  const [serviceFilter, setServiceFilter] = useState("all");
  const [dateRangeType, setDateRangeType] = useState("fiscal");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pull the live CRT Client Data sheet (active workbook) — this is the
  // source of truth for outcomes, not the local client entity fields.
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["crt-client-rows-outcomes"],
    queryFn: () => base44.functions.invoke("getCrtWorkbookRows", {}),
    staleTime: 5 * 60 * 1000,
  });

  const rows = data?.data?.rows || data?.rows || [];
  const fileName = data?.data?.file_name || data?.file_name || "";

  const dateRange = useMemo(() => {
    const now = new Date();
    let startDateObj, endDateObj, label;
    if (dateRangeType === "all") {
      startDateObj = new Date(2000, 0, 1); endDateObj = new Date(2100, 0, 1); label = "All Time";
    } else if (dateRangeType === "calendar") {
      startDateObj = new Date(year, 0, 1); endDateObj = new Date(year + 1, 0, 1); label = `Calendar Year ${year}`;
    } else if (dateRangeType === "fiscal") {
      const fs = year <= now.getFullYear() ? new Date(year, 3, 1) : new Date(year - 1, 3, 1);
      startDateObj = fs; endDateObj = new Date(fs.getFullYear() + 1, 3, 1);
      label = `Fiscal Year ${fs.getFullYear()}-${String(fs.getFullYear() + 1).slice(2)}`;
    } else if (dateRangeType === "month") {
      startDateObj = new Date(year, month - 1, 1); endDateObj = new Date(year, month, 1);
      label = `${startDateObj.toLocaleString("default", { month: "long" })} ${year}`;
    } else if (dateRangeType === "custom" && startDate && endDate) {
      startDateObj = new Date(startDate); endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      label = `${startDate} to ${endDate}`;
    } else {
      const fs = new Date(now.getFullYear() - (now.getMonth() < 3 ? 1 : 0), 3, 1);
      startDateObj = fs; endDateObj = new Date(now.getFullYear() + (now.getMonth() >= 3 ? 1 : 0), 3, 1);
      label = `Fiscal Year ${fs.getFullYear()}-${String(fs.getFullYear() + 1).slice(2)}`;
    }
    return { startDateObj, endDateObj, label };
  }, [dateRangeType, year, month, startDate, endDate]);

  const inRange = (dateStr) => {
    const d = parseCrtDate(dateStr);
    if (!d) return false;
    return d >= dateRange.startDateObj && d < dateRange.endDateObj;
  };

  const scoped = useMemo(() => {
    if (serviceFilter === "ceis") return rows.filter(isCeis);
    if (serviceFilter === "wd") return rows.filter(isWd);
    return rows;
  }, [rows, serviceFilter]);

  const outcomes = useMemo(() => {
    const wdStarters = scoped.filter((r) => isWd(r) && inRange(r.service_start_date)).length;
    const ceisStarters = scoped.filter((r) => isCeis(r) && inRange(r.dea_start_date)).length;

    const wdComplete = scoped.filter(
      (r) => isWd(r) && r.service_outcome === "Complete" && inRange(r.service_outcome_date || r.eda_completion_date)
    ).length;
    const ceisComplete = scoped.filter(
      (r) => isCeis(r) && r.service_outcome === "Complete" && inRange(r.service_outcome_date || r.eda_completion_date)
    ).length;
    const cancelled = scoped.filter(
      (r) => r.service_outcome === "Cancelled" && inRange(r.service_outcome_date)
    ).length;

    const placementRows = scoped.filter(
      (r) => r.placement_outcome && r.placement_outcome !== "P" && inRange(r.placement_outcome_date)
    );
    const day90Rows = scoped.filter(
      (r) => r.day90_outcome && r.day90_outcome !== "P" && inRange(r.day90_outcome_date)
    );
    const serviceNavRows = scoped.filter(
      (r) => isYes(r.service_nav_support) && inRange(r.service_nav_billing_month)
    );

    const placementEmployed = placementRows.filter((r) => EMPLOYED.includes(r.placement_outcome)).length;
    const day90Employed = day90Rows.filter((r) => EMPLOYED.includes(r.day90_outcome)).length;

    const placementBreakdown = {};
    placementRows.forEach((r) => { const k = r.placement_outcome; placementBreakdown[k] = (placementBreakdown[k] || 0) + 1; });
    const day90Breakdown = {};
    day90Rows.forEach((r) => { const k = r.day90_outcome; day90Breakdown[k] = (day90Breakdown[k] || 0) + 1; });

    const byElement = {
      WD: scoped.filter(isWd).length,
      CEIS: scoped.filter(isCeis).length,
      Other: scoped.filter((r) => !isWd(r) && !isCeis(r)).length,
    };

    return {
      wdStarters, ceisStarters, wdComplete, ceisComplete, cancelled,
      placementEmployed, day90Employed, placementBreakdown, day90Breakdown,
      serviceNav: serviceNavRows.length, byElement, totalClients: scoped.length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoped, dateRange]);

  const hasActiveFilters = serviceFilter !== "all" || dateRangeType !== "fiscal";
  const clearFilters = () => {
    setServiceFilter("all");
    setDateRangeType("fiscal");
    setYear(new Date().getFullYear());
    setMonth(new Date().getMonth() + 1);
    setStartDate("");
    setEndDate("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Source banner */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <FileSpreadsheet className="w-4 h-4 text-slate-500" />
          <span>Source: <span className="font-medium text-slate-800">CRT Client Data sheet</span>{fileName ? ` — ${fileName}` : ""}</span>
          <Badge variant="outline">{outcomes.totalClients} clients</Badge>
          {isFetching && <span className="text-xs text-slate-400">refreshing…</span>}
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1">
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh from CRT
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[180px] space-y-1">
              <label className="text-xs text-muted-foreground">Service Element</label>
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All elements" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Elements</SelectItem>
                  <SelectItem value="wd">WD (Pathways)</SelectItem>
                  <SelectItem value="ceis">CEIS (DEA)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[180px] space-y-1">
              <label className="text-xs text-muted-foreground">Date Range</label>
              <Select value={dateRangeType} onValueChange={setDateRangeType}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select range" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="fiscal">Fiscal Year (Apr-Mar)</SelectItem>
                  <SelectItem value="calendar">Calendar Year</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 mt-3 pt-3 border-t flex-wrap">
            {(dateRangeType === "calendar" || dateRangeType === "fiscal" || dateRangeType === "month") && (
              <div className="flex-1 min-w-[180px] space-y-1">
                <Label className="text-xs">Year</Label>
                <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 4 + i).map((yr) => (
                      <SelectItem key={yr} value={String(yr)}>{yr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {dateRangeType === "month" && (
              <div className="flex-1 min-w-[180px] space-y-1">
                <Label className="text-xs">Month</Label>
                <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {dateRangeType === "custom" && (
              <>
                <div className="flex-1 min-w-[180px] space-y-1">
                  <Label className="text-xs">Start Date</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9" />
                </div>
                <div className="flex-1 min-w-[180px] space-y-1">
                  <Label className="text-xs">End Date</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9" />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">Program Outcomes (from CRT)</h2>
          <p className="text-sm text-muted-foreground">{dateRange.label}</p>
        </div>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="w-3 h-3 mr-1" /> Clear Filters
          </Button>
        )}
      </div>

      {/* Starter + completion cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WD Starters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{outcomes.wdStarters}</div>
            <p className="text-xs text-muted-foreground mt-1">Service Start in {dateRange.label}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CEIS (DEA) Starters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{outcomes.ceisStarters}</div>
            <p className="text-xs text-muted-foreground mt-1">DEA Start in {dateRange.label}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WD Completers</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{outcomes.wdComplete}</div>
            <p className="text-xs text-muted-foreground mt-1">Service Outcome Complete in {dateRange.label}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CEIS (DEA) Completers</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{outcomes.ceisComplete}</div>
            <p className="text-xs text-muted-foreground mt-1">Service Outcome Complete in {dateRange.label}</p>
          </CardContent>
        </Card>
      </div>

      {/* Employment + cancelled cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Placement Outcomes (Employed)</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{outcomes.placementEmployed}</div>
            <p className="text-xs text-muted-foreground mt-1">E-RF / E-UF / SE placements in {dateRange.label}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">90-Day Outcomes (Employed)</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{outcomes.day90Employed}</div>
            <p className="text-xs text-muted-foreground mt-1">E-RF / E-UF / SE at 90 days in {dateRange.label}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Navigation</CardTitle>
            <Navigation className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{outcomes.serviceNav}</div>
            <p className="text-xs text-muted-foreground mt-1">Service-nav fee billed in {dateRange.label}</p>
          </CardContent>
        </Card>
      </div>

      {/* Placement outcome breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Placement Outcome Breakdown</CardTitle>
            </div>
            <Badge variant="outline">{Object.values(outcomes.placementBreakdown).reduce((a, b) => a + b, 0)} recorded</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(outcomes.placementBreakdown).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">{OUTCOME_LABELS[status] || status}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
            {Object.keys(outcomes.placementBreakdown).length === 0 && (
              <p className="text-sm text-muted-foreground col-span-full">No placement outcomes recorded for this period.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 90-day outcome breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <CardTitle>90-Day Follow-up Outcome Breakdown</CardTitle>
            </div>
            <Badge variant="outline">{Object.values(outcomes.day90Breakdown).reduce((a, b) => a + b, 0)} recorded</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(outcomes.day90Breakdown).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">{OUTCOME_LABELS[status] || status}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
            {Object.keys(outcomes.day90Breakdown).length === 0 && (
              <p className="text-sm text-muted-foreground col-span-full">No 90-day follow-up outcomes recorded for this period.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* By service element + cancelled */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Clients by Service Element</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">WD (Pathways)</span>
                <Badge variant="outline">{outcomes.byElement.WD}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">CEIS (DEA)</span>
                <Badge variant="outline">{outcomes.byElement.CEIS}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">Other / Unassigned</span>
                <Badge variant="outline">{outcomes.byElement.Other}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled from Program</CardTitle>
            <X className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{outcomes.cancelled}</div>
            <p className="text-xs text-muted-foreground mt-1">Service Outcome "Cancelled" in {dateRange.label}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}