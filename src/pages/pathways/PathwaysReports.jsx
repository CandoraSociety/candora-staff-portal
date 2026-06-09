import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, CheckCircle2, Briefcase, Target, Calendar, TrendingUp, 
  Filter, FileBarChart, Play, Save, Trash2, DollarSign, Award, X
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, differenceInMonths } from "date-fns";
import ReportSummary from "@/components/reports/ReportSummary";
import StaffMonthlyReports from "@/components/reports/StaffMonthlyReports";
import DataReportsSidebar from "@/components/reports/DataReportsSidebar";
import { DEMOGRAPHIC_FILTERS, getDateRange, REPORT_SECTIONS } from "@/components/reports/DataReportsSidebar";

const SERVICE_STREAMS = {
  direct_to_employment: "DEA",
  pathways: "Pathways",
  casual: "Casual",
  external_referral: "External Referral",
  internal_referral: "Internal Referral",
};

const EMPLOYMENT_STATUS_LABELS = {
  "E-RF": "E-RF — Employed, Related Field",
  "E-UF": "E-UF — Employed, Unrelated Field",
  "E-PT": "E-PT — Employed, Part-time",
  "UE": "UE — Unemployed",
  "UE-LFW": "UE-LFW — Looking for Work",
  "UE-S": "UE-S — Unemployed, Seasonal",
  "NA": "NA — Not Available",
  "no_contact": "No Contact",
  "UTC": "UTC — Unable to Contact",
};

function calculateOutcomes(clients, dateRange) {
  const { startDate, endDate, label } = dateRange;
  
  const pathwaysStarters = clients.filter(c => 
    c.service_type === "pathways" && 
    c.service_start_date && 
    new Date(c.service_start_date) >= startDate && 
    new Date(c.service_start_date) < endDate
  );
  
  const deaStarters = clients.filter(c => 
    c.service_type === "direct_to_employment" && 
    c.service_start_date && 
    new Date(c.service_start_date) >= startDate && 
    new Date(c.service_start_date) < endDate
  );
  
  const pathwaysCompleters = clients.filter(c => 
    c.service_type === "pathways" && 
    c.completion_date && 
    new Date(c.completion_date) >= startDate && 
    new Date(c.completion_date) < endDate
  );
  
  const deaCompleters = clients.filter(c => 
    c.service_type === "direct_to_employment" && 
    c.completion_date && 
    new Date(c.completion_date) >= startDate && 
    new Date(c.completion_date) < endDate
  );
  
  const employmentOutcomes = clients.filter(c => 
    c.employment_start_date && 
    new Date(c.employment_start_date) >= startDate && 
    new Date(c.employment_start_date) < endDate
  );
  
  const followups90Day = clients.filter(c => 
    c.followup_90day_date && 
    new Date(c.followup_90day_date) >= startDate && 
    new Date(c.followup_90day_date) < endDate
  );
  
  const followupsCompleted = followups90Day.filter(c => c.followup_90day_status);
  const followupsPending = followups90Day.filter(c => !c.followup_90day_status);
  
  const employmentStatusBreakdown = {};
  followups90Day.forEach(c => {
    const status = c.followup_90day_status || "no_contact";
    employmentStatusBreakdown[status] = (employmentStatusBreakdown[status] || 0) + 1;
  });
  
  const activeClients = clients.filter(c => c.status === "active");
  const activeByStream = {};
  activeClients.forEach(c => {
    const stream = c.service_type || "unknown";
    activeByStream[stream] = (activeByStream[stream] || 0) + 1;
  });
  
  const totalClients = clients.length;
  const activeCount = activeClients.length;
  const closedCount = clients.filter(c => c.status === "closed").length;
  
  return {
    dateRangeLabel: label,
    pathwaysStarters: pathwaysStarters.length,
    deaStarters: deaStarters.length,
    pathwaysCompleters: pathwaysCompleters.length,
    deaCompleters: deaCompleters.length,
    employmentOutcomes: employmentOutcomes.length,
    followups90Day: {
      total: followups90Day.length,
      completed: followupsCompleted.length,
      pending: followupsPending.length,
      statusBreakdown: employmentStatusBreakdown,
    },
    activeByStream,
    totalClients,
    activeCount,
    closedCount,
  };
}

export default function PathwaysReports() {
  const [activeTab, setActiveTab] = useState("data");
  const [dataReportsState, setDataReportsState] = useState({
    dateField: "service_start_date",
    datePreset: "fiscal_year",
    customDateFrom: "",
    customDateTo: "",
    filters: {},
    selectedSections: REPORT_SECTIONS.filter(s => s.default).map(s => s.key),
    demographicOptions: REPORT_SECTIONS.find(s => s.key === "client_demographics")?.subOptions?.filter(o => o.default).map(o => o.key) || [],
  });
  const [dataResults, setDataResults] = useState(null);
  
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['pathways-clients'],
    queryFn: () => base44.entities.Client.list("-created_date", 1000),
  });
  
  const { data: financialRecords = [] } = useQuery({
    queryKey: ['pathways-financials'],
    queryFn: () => base44.entities.FinancialRecord.list("-date", 2000),
  });

  // Outcomes tab state
  const [outcomesFilters, setOutcomesFilters] = useState({
    assignedWorker: "all",
    serviceType: "all",
    status: "all",
    dateRangeType: "fiscal",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    startDate: "",
    endDate: "",
  });

  const hasActiveFilters = outcomesFilters.assignedWorker !== "all" || 
    outcomesFilters.serviceType !== "all" || 
    outcomesFilters.status !== "all" || 
    outcomesFilters.dateRangeType !== "fiscal";

  const clearOutcomesFilters = () => {
    setOutcomesFilters({
      assignedWorker: "all",
      serviceType: "all",
      status: "all",
      dateRangeType: "fiscal",
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      startDate: "",
      endDate: "",
    });
  };

  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate, label;

    if (outcomesFilters.dateRangeType === "all") {
      startDate = new Date(2000, 0, 1);
      endDate = new Date(2100, 0, 1);
      label = "All Time";
    } else if (outcomesFilters.dateRangeType === "calendar") {
      startDate = new Date(outcomesFilters.year, 0, 1);
      endDate = new Date(outcomesFilters.year + 1, 0, 1);
      label = `Calendar Year ${outcomesFilters.year}`;
    } else if (outcomesFilters.dateRangeType === "fiscal") {
      const fiscalStart = outcomesFilters.year <= now.getFullYear() 
        ? new Date(outcomesFilters.year, 3, 1) 
        : new Date(outcomesFilters.year - 1, 3, 1);
      const fiscalEnd = new Date(outcomesFilters.year + 1, 3, 1);
      startDate = fiscalStart;
      endDate = fiscalEnd;
      label = `Fiscal Year ${outcomesFilters.year}-${String(fiscalEnd.getFullYear()).slice(2)}`;
    } else if (outcomesFilters.dateRangeType === "month") {
      const year = outcomesFilters.year;
      const month = outcomesFilters.month - 1;
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 1);
      label = `${startDate.toLocaleString('default', { month: 'long' })} ${year}`;
    } else if (outcomesFilters.dateRangeType === "custom" && outcomesFilters.startDate && outcomesFilters.endDate) {
      startDate = new Date(outcomesFilters.startDate);
      endDate = new Date(outcomesFilters.endDate);
      endDate.setDate(endDate.getDate() + 1);
      label = `${outcomesFilters.startDate} to ${outcomesFilters.endDate}`;
    } else {
      const fiscalStart = new Date(now.getFullYear() - (now.getMonth() < 3 ? 1 : 0), 3, 1);
      const fiscalEnd = new Date(now.getFullYear() + (now.getMonth() >= 3 ? 1 : 0), 3, 1);
      startDate = fiscalStart;
      endDate = fiscalEnd;
      label = `Fiscal Year ${fiscalStart.getFullYear()}-${String(fiscalEnd.getFullYear()).slice(2)}`;
    }

    return { startDate, endDate, label };
  };

  const assignedWorkers = useMemo(() => {
    const workers = new Set(clients.map(c => c.assigned_worker_name).filter(Boolean));
    return Array.from(workers).sort();
  }, [clients]);

  // Data Reports handlers
  const handleRunDataReport = (state) => {
    setDataReportsState(state);
    
    // Enrich clients with financial data
    const financialMap = {};
    financialRecords?.forEach(rec => {
      if (!rec.client_id) return;
      if (!financialMap[rec.client_id]) financialMap[rec.client_id] = { exposure: 0, placement: 0, supports: 0 };
      const amt = rec.amount || 0;
      if (rec.record_type === "exposure_course") financialMap[rec.client_id].exposure += amt;
      else if (rec.record_type === "paid_external_placement") financialMap[rec.client_id].placement += amt;
      else if (rec.record_type === "employment_supports") financialMap[rec.client_id].supports += amt;
    });
    
    let data = clients.map(c => ({
      ...c,
      _fin_exposure: financialMap[c.id]?.exposure || 0,
      _fin_placement: financialMap[c.id]?.placement || 0,
      _fin_supports: financialMap[c.id]?.supports || 0,
    }));
    
    // Apply filters
    Object.entries(state.filters).forEach(([key, filterValue]) => {
      if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) return;
      if (Array.isArray(filterValue)) {
        data = data.filter(c => filterValue.includes(c[key]));
      } else if (typeof filterValue === "boolean") {
        data = data.filter(c => c[key] === filterValue);
      } else {
        data = data.filter(c => c[key]?.toString().toLowerCase().includes(filterValue.toLowerCase()));
      }
    });
    
    // Apply date range
    if (state.datePreset !== "none") {
      const range = getDateRange(state.datePreset, state.customDateFrom, state.customDateTo);
      data = data.filter(c => {
        const d = c[state.dateField];
        if (!d) return false;
        if (range.from && d < range.from) return false;
        if (range.to && d > range.to) return false;
        return true;
      });
    }
    
    setDataResults(data);
  };

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      if (outcomesFilters.assignedWorker !== "all" && c.assigned_worker_name !== outcomesFilters.assignedWorker) return false;
      if (outcomesFilters.serviceType !== "all" && c.service_type !== outcomesFilters.serviceType) return false;
      if (outcomesFilters.status !== "all" && c.status !== outcomesFilters.status) return false;
      return true;
    });
  }, [clients, outcomesFilters]);

  const dateRange = getDateRange();
  const outcomes = calculateOutcomes(filteredClients, dateRange);

  if (clientsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-7xl mx-auto">
        <TabsList className="mb-6">
          <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
          <TabsTrigger value="data">Data Reports</TabsTrigger>
          <TabsTrigger value="staff">Staff Monthly Reports</TabsTrigger>
        </TabsList>

        {/* TAB 1: OUTCOMES */}
        <TabsContent value="outcomes">
          <div className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filters</span>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <div className="flex-1 min-w-[180px] space-y-1">
                    <label className="text-xs text-muted-foreground">Assigned Worker</label>
                    <Select value={outcomesFilters.assignedWorker} onValueChange={(v) => setOutcomesFilters(prev => ({ ...prev, assignedWorker: v }))}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All workers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Workers</SelectItem>
                        {assignedWorkers.map(worker => (
                          <SelectItem key={worker} value={worker}>{worker}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1 min-w-[180px] space-y-1">
                    <label className="text-xs text-muted-foreground">Service Type</label>
                    <Select value={outcomesFilters.serviceType} onValueChange={(v) => setOutcomesFilters(prev => ({ ...prev, serviceType: v }))}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All streams" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Streams</SelectItem>
                        <SelectItem value="pathways">Pathways</SelectItem>
                        <SelectItem value="direct_to_employment">DEA</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="external_referral">External Referral</SelectItem>
                        <SelectItem value="internal_referral">Internal Referral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1 min-w-[180px] space-y-1">
                    <label className="text-xs text-muted-foreground">Client Status</label>
                    <Select value={outcomesFilters.status} onValueChange={(v) => setOutcomesFilters(prev => ({ ...prev, status: v }))}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1 min-w-[180px] space-y-1">
                    <label className="text-xs text-muted-foreground">Date Range</label>
                    <Select value={outcomesFilters.dateRangeType} onValueChange={(v) => setOutcomesFilters(prev => ({ ...prev, dateRangeType: v }))}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
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
                  {(outcomesFilters.dateRangeType === "calendar" || outcomesFilters.dateRangeType === "fiscal" || outcomesFilters.dateRangeType === "month") && (
                    <div className="flex-1 min-w-[180px] space-y-1">
                      <Label className="text-xs">Year</Label>
                      <Select value={String(outcomesFilters.year)} onValueChange={(v) => setOutcomesFilters(prev => ({ ...prev, year: parseInt(v) }))}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 4 + i).map(year => (
                            <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {outcomesFilters.dateRangeType === "month" && (
                    <div className="flex-1 min-w-[180px] space-y-1">
                      <Label className="text-xs">Month</Label>
                      <Select value={String(outcomesFilters.month)} onValueChange={(v) => setOutcomesFilters(prev => ({ ...prev, month: parseInt(v) }))}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>{month}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {outcomesFilters.dateRangeType === "custom" && (
                    <>
                      <div className="flex-1 min-w-[180px] space-y-1">
                        <Label className="text-xs">Start Date</Label>
                        <Input type="date" value={outcomesFilters.startDate} onChange={(e) => setOutcomesFilters(prev => ({ ...prev, startDate: e.target.value }))} className="h-9" />
                      </div>
                      <div className="flex-1 min-w-[180px] space-y-1">
                        <Label className="text-xs">End Date</Label>
                        <Input type="date" value={outcomesFilters.endDate} onChange={(e) => setOutcomesFilters(prev => ({ ...prev, endDate: e.target.value }))} className="h-9" />
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold">Program Outcomes</h2>
                <p className="text-sm text-muted-foreground">{outcomes.dateRangeLabel}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{outcomes.totalClients} Clients</Badge>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearOutcomesFilters}>
                    <X className="w-3 h-3 mr-1" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pathways Starters</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{outcomes.pathwaysStarters}</div>
                  <p className="text-xs text-muted-foreground mt-1">Started in {outcomes.dateRangeLabel}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">DEA Starters</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{outcomes.deaStarters}</div>
                  <p className="text-xs text-muted-foreground mt-1">Started in {outcomes.dateRangeLabel}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pathways Completers</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{outcomes.pathwaysCompleters}</div>
                  <p className="text-xs text-muted-foreground mt-1">Completed in {outcomes.dateRangeLabel}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">DEA Completers</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{outcomes.deaCompleters}</div>
                  <p className="text-xs text-muted-foreground mt-1">Completed in {outcomes.dateRangeLabel}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Employment Outcomes</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{outcomes.employmentOutcomes}</div>
                  <p className="text-xs text-muted-foreground mt-1">Clients gained employment in {outcomes.dateRangeLabel}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Client Status</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{outcomes.activeCount}</div>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-600">{outcomes.closedCount}</div>
                      <p className="text-xs text-muted-foreground">Closed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>90-Day Follow-up Outcomes</CardTitle>
                  </div>
                  <Badge variant={outcomes.followups90Day.pending > 0 ? "secondary" : "default"}>
                    {outcomes.followups90Day.completed}/{outcomes.followups90Day.total} Completed
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(outcomes.followups90Day.statusBreakdown).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">
                        {EMPLOYMENT_STATUS_LABELS[status] || status}
                      </span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                  {Object.keys(outcomes.followups90Day.statusBreakdown).length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-full">
                      No 90-day follow-ups recorded for this period.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Active Clients by Stream</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(outcomes.activeByStream).map(([stream, count]) => (
                    <div key={stream} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">
                        {SERVICE_STREAMS[stream] || stream}
                      </span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                  {Object.keys(outcomes.activeByStream).length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-full">
                      No active clients.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: DATA REPORTS */}
        <TabsContent value="data">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-1">
              <DataReportsSidebar
                clients={clients}
                dateField={dataReportsState.dateField}
                setDateField={(v) => setDataReportsState(prev => ({ ...prev, dateField: v }))}
                datePreset={dataReportsState.datePreset}
                setDatePreset={(v) => setDataReportsState(prev => ({ ...prev, datePreset: v }))}
                customDateFrom={dataReportsState.customDateFrom}
                setCustomDateFrom={(v) => setDataReportsState(prev => ({ ...prev, customDateFrom: v }))}
                customDateTo={dataReportsState.customDateTo}
                setCustomDateTo={(v) => setDataReportsState(prev => ({ ...prev, customDateTo: v }))}
                filters={dataReportsState.filters}
                setFilters={(v) => setDataReportsState(prev => ({ ...prev, filters: typeof v === 'function' ? v(prev.filters) : v }))}
                selectedSections={dataReportsState.selectedSections}
                setSelectedSections={(v) => setDataReportsState(prev => ({ ...prev, selectedSections: typeof v === 'function' ? v(prev.selectedSections) : v }))}
                demographicOptions={dataReportsState.demographicOptions}
                setDemographicOptions={(v) => setDataReportsState(prev => ({ ...prev, demographicOptions: typeof v === 'function' ? v(prev.demographicOptions) : v }))}
                onRunReport={() => handleRunDataReport(dataReportsState)}
              />
            </div>
            
            {/* Right Area - Results */}
            <div className="lg:col-span-3">
              <ReportSummary
                clients={clients}
                financialRecords={financialRecords}
                results={dataResults}
                selectedSections={dataReportsState.selectedSections}
                demographicOptions={dataReportsState.demographicOptions}
                dateRange={getDateRange(dataReportsState.datePreset, dataReportsState.customDateFrom, dataReportsState.customDateTo)}
                appliedFilters={dataReportsState.filters}
                allClients={clients}
                demographicFilters={DEMOGRAPHIC_FILTERS}
                onClear={() => setDataResults(null)}
              />
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: STAFF MONTHLY REPORTS */}
        <TabsContent value="staff">
          <StaffMonthlyReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}