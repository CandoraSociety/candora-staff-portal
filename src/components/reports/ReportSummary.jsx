import React, { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileBarChart, Download, Printer, Share2, Trash2, Play, Save, Filter, X, Users, Briefcase, Award, DollarSign } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, differenceInMonths } from "date-fns";
import { toast } from "sonner";

const PIE_COLORS = [
  "#1a237e", "#7c3aed", "#0369a1", "#0891b2", "#059669",
  "#d97706", "#dc2626", "#9333ea", "#64748b", "#1d4ed8",
  "#f59e0b", "#10b981", "#6366f1", "#ec4899", "#8b5cf6",
];

const SERVICE_LABELS = {
  direct_to_employment: "DEA (Direct to Employment)",
  pathways: "Pathways",
  casual: "Casual",
  internal_referral: "Internal Referral",
  external_referral: "External Referral",
  not_eligible: "Not Eligible",
};

const EMP_STATUS_LABELS = {
  "E-RF": "E-RF — Employed, Related Field",
  "E-UF": "E-UF — Employed, Unrelated Field",
  "E-PT": "E-PT — Employed, Part Time",
  "UE": "UE — Unemployed",
  "UE-LFW": "UE-LFW — Looking for Work",
  "UE-S": "UE-S — Unemployed, Student",
  "NA": "NA — Not Applicable",
  "no_contact": "No Contact",
  "UTC": "UTC — Unable to Contact",
};

const SERVICE_TYPE_OPTIONS = [
  { value: "direct_to_employment", label: "DEA" },
  { value: "pathways", label: "Pathways" },
  { value: "casual", label: "Casual" },
  { value: "external_referral", label: "External Referral" },
  { value: "internal_referral", label: "Internal Referral" },
];

const CASE_STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "closed", label: "Closed" },
];

const RESIDENCY_STATUS_OPTIONS = [
  { value: "canadian_citizen", label: "Canadian Citizen" },
  { value: "permanent_resident", label: "Permanent Resident" },
  { value: "protected_person", label: "Protected Person" },
  { value: "convention_refugee", label: "Convention Refugee" },
  { value: "refugee_claimant", label: "Refugee Claimant" },
  { value: "temporary_resident", label: "Temporary Resident" },
  { value: "work_permit", label: "Work Permit" },
  { value: "study_permit", label: "Study Permit" },
  { value: "visitor", label: "Visitor" },
  { value: "other", label: "Other" },
];

const REPORT_SECTIONS = [
  { key: "service_stream", label: "Service Stream Breakdown", default: true },
  { key: "case_program_status", label: "Case & Program Status", default: true },
  { key: "referral_source", label: "Referral Source", default: true },
  { key: "employment_intake", label: "Employment Status at Intake", default: true },
  { key: "employment_post", label: "Post-Completion Employment Status", default: true },
  { key: "employment_90day", label: "90-Day Follow-Up Status", default: true },
  { key: "starters_completers", label: "Program Starters & Completers", default: true },
  { key: "financial_summary", label: "Financial Summary", default: true },
  { key: "barriers", label: "Top Barriers Identified", default: true },
  { key: "client_demographics", label: "Client Demographics", default: false, subOptions: [
    { key: "age_distribution", label: "Age Distribution", default: true },
    { key: "sex_distribution", label: "Sex", default: true },
    { key: "residency_status", label: "Residency Status", default: true },
    { key: "city_distribution", label: "City Distribution", default: true },
    { key: "postal_code_distribution", label: "Postal Code Distribution (FSA)", default: true },
  ]},
];

const ALL_FIELDS = [
  { key: "first_name", label: "First Name", category: "demographic" },
  { key: "last_name", label: "Last Name", category: "demographic" },
  { key: "date_of_birth", label: "Date of Birth", category: "demographic" },
  { key: "phone", label: "Phone", category: "demographic" },
  { key: "email", label: "Email", category: "demographic" },
  { key: "address", label: "Address", category: "demographic" },
  { key: "city", label: "City", category: "demographic" },
  { key: "state", label: "Province", category: "demographic" },
  { key: "zip", label: "Postal Code", category: "demographic" },
  { key: "compass_hsid", label: "Compass HSID#", category: "demographic" },
  { key: "residency_status", label: "Residency Status", category: "demographic" },
  { key: "clb_level", label: "CLB Level", category: "demographic" },
  { key: "employment_status", label: "Employment Status", category: "demographic" },
  { key: "has_vehicle", label: "Has Vehicle", category: "demographic" },
  { key: "referral_source", label: "Referral Source", category: "demographic" },
  { key: "service_type", label: "Service Stream", category: "demographic" },
  { key: "assigned_worker_name", label: "Career Counsellor", category: "demographic" },
  { key: "status", label: "Case Status", category: "demographic" },
  { key: "program_status", label: "Program Status", category: "demographic" },
  { key: "intake_date", label: "Intake Date", category: "date" },
  { key: "service_start_date", label: "Service Start Date", category: "date" },
  { key: "completion_date", label: "Completion Date", category: "date" },
  { key: "employment_start_date", label: "Employment Start Date", category: "date" },
  { key: "followup_90day_date", label: "90-Day Follow-Up Date", category: "date" },
  { key: "post_completion_employment_date", label: "Post-Completion Employment Date", category: "date" },
  { key: "closed_date", label: "Close Date", category: "date" },
  { key: "followup_90day_status", label: "90-Day Employment Status", category: "metric" },
  { key: "post_completion_employment_status", label: "Post-Completion Employment Status", category: "metric" },
  { key: "service_navigation_supports", label: "Service Navigation Supports", category: "metric" },
  { key: "barriers_addressed", label: "Barriers Addressed", category: "metric" },
  { key: "barrier_1", label: "Barrier 1", category: "metric" },
  { key: "barrier_1_status", label: "Barrier 1 Status", category: "metric" },
  { key: "_fin_exposure_course_total", label: "Exposure Course Total ($)", category: "financial", clientFilterable: true },
  { key: "_fin_paid_placement_total", label: "Paid Placement Total ($)", category: "financial", clientFilterable: true },
  { key: "_fin_employment_supports_total", label: "Employment Supports Total ($)", category: "financial", clientFilterable: true },
  { key: "_fin_total_all", label: "Total Direct Costs ($)", category: "financial", clientFilterable: true },
];

const DEMOGRAPHIC_FILTERS = [
  { key: "service_type", label: "Service Stream", type: "multi-select", fixedOptions: SERVICE_TYPE_OPTIONS },
  { key: "status", label: "Case Status", type: "multi-select", fixedOptions: CASE_STATUS_OPTIONS },
  { key: "program_status", label: "Program Status", type: "multi-select" },
  { key: "residency_status", label: "Residency Status", type: "multi-select", fixedOptions: RESIDENCY_STATUS_OPTIONS },
  { key: "clb_level", label: "CLB Level", type: "multi-select" },
  { key: "employment_status", label: "Employment Status", type: "multi-select" },
  { key: "referral_source", label: "Referral Source", type: "multi-select" },
  { key: "assigned_worker_name", label: "Career Counsellor", type: "multi-select" },
  { key: "city", label: "City", type: "text" },
  { key: "has_vehicle", label: "Has Vehicle", type: "select" },
  { key: "barrier_1", label: "Barrier Type", type: "multi-select" },
  { key: "closed_reason", label: "Close Reason", type: "multi-select" },
  { key: "compass_verified", label: "Compass Verified", type: "boolean-select" },
];

const TEMPLATE_KEY = "report_templates_v2";

function loadTemplates() {
  try { return JSON.parse(localStorage.getItem(TEMPLATE_KEY) || "[]"); } catch { return []; }
}

function saveTemplates(t) {
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(t));
}

function getDateRange(preset, customFrom, customTo) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = today.getMonth();

  if (preset === "this_month") {
    return { from: format(startOfMonth(today), "yyyy-MM-dd"), to: format(endOfMonth(today), "yyyy-MM-dd") };
  }
  if (preset === "last_month") {
    const last = subMonths(today, 1);
    return { from: format(startOfMonth(last), "yyyy-MM-dd"), to: format(endOfMonth(last), "yyyy-MM-dd") };
  }
  if (preset === "ytd") {
    return { from: format(startOfYear(today), "yyyy-MM-dd"), to: format(today, "yyyy-MM-dd") };
  }
  if (preset === "fiscal_year") {
    const fiscalStart = mm >= 3 ? new Date(yyyy, 3, 1) : new Date(yyyy - 1, 3, 1);
    const fiscalEnd = new Date(fiscalStart.getFullYear() + 1, 2, 31);
    return { from: format(fiscalStart, "yyyy-MM-dd"), to: format(fiscalEnd, "yyyy-MM-dd") };
  }
  if (preset === "last_fiscal_year") {
    const fiscalStart = mm >= 3 ? new Date(yyyy - 1, 3, 1) : new Date(yyyy - 2, 3, 1);
    const fiscalEnd = new Date(fiscalStart.getFullYear() + 1, 2, 31);
    return { from: format(fiscalStart, "yyyy-MM-dd"), to: format(fiscalEnd, "yyyy-MM-dd") };
  }
  if (preset === "this_year") {
    return { from: `${yyyy}-01-01`, to: `${yyyy}-12-31` };
  }
  return { from: customFrom, to: customTo };
}

function fmt$(n) {
  if (!n && n !== 0) return "";
  return "$" + Number(n).toFixed(2);
}

function getDisplayValue(client, key) {
  if (key === "_duration_months") {
    if (!client.service_start_date) return "";
    return differenceInMonths(new Date(), new Date(client.service_start_date)) + " mo";
  }
  if (key === "_stream_switch_count") {
    return (client.program_stream_switches?.length || 0).toString();
  }
  if (key === "_fin_exposure_course_total") return fmt$(client._fin_exposure || 0);
  if (key === "_fin_paid_placement_total") return fmt$(client._fin_placement || 0);
  if (key === "_fin_employment_supports_total") return fmt$(client._fin_supports || 0);
  if (key === "_fin_total_all") return fmt$((client._fin_exposure || 0) + (client._fin_placement || 0) + (client._fin_supports || 0));
  if (key.startsWith("_inv_")) return "—";

  const v = client[key];
  if (v === undefined || v === null || v === "") return "";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (key === "service_type") return SERVICE_LABELS[v] || v;
  if (key === "clb_level") return v.replace("clb_", "CLB ").replace("native_english_french", "Native");
  if (typeof v === "string" && v.match(/^\d{4}-\d{2}-\d{2}$/)) {
    try { return format(new Date(v), "MMM d, yyyy"); } catch { return v; }
  }
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

export default function ReportSummary({ 
  clients, 
  financialRecords, 
  results,
  selectedSections: parentSelectedSections,
  demographicOptions: parentDemographicOptions,
  onClear,
  onExportCSV,
  dateRange,
  appliedFilters,
  allClients,
  demographicFilters 
}) {
  const reportRef = useRef(null);
  
  // Use parent props if provided, otherwise use local state (backward compatibility)
  const [localSelectedSections, setLocalSelectedSections] = useState(
    REPORT_SECTIONS.filter(s => s.default).map(s => s.key)
  );
  const [localDemographicOptions, setLocalDemographicOptions] = useState(
    REPORT_SECTIONS.find(s => s.key === "client_demographics")?.subOptions?.filter(o => o.default).map(o => o.key) || []
  );
  
  const selectedSections = parentSelectedSections || localSelectedSections;
  const demographicOptions = parentDemographicOptions || localDemographicOptions;

  const { dateFrom, dateTo } = useMemo(() => {
    if (dateRange) return dateRange;
    const range = getDateRange("fiscal_year", "", "");
    return range;
  }, [dateRange]);

  const financialMap = useMemo(() => {
    const map = {};
    financialRecords?.forEach(rec => {
      if (!rec.client_id) return;
      if (!map[rec.client_id]) map[rec.client_id] = { exposure: 0, placement: 0, supports: 0 };
      const amt = rec.amount || 0;
      if (rec.record_type === "exposure_course") map[rec.client_id].exposure += amt;
      else if (rec.record_type === "paid_external_placement") map[rec.client_id].placement += amt;
      else if (rec.record_type === "employment_supports") map[rec.client_id].supports += amt;
    });
    return map;
  }, [financialRecords]);





  const stats = useMemo(() => {
    if (!results) return null;

    const total = results.length;
    const streamCounts = {};
    const caseStatusCounts = {};
    const programStatusCounts = {};
    const referralCounts = {};
    const intakeEmpCounts = {};
    const postEmpCounts = {};
    const fu90EmpCounts = {};
    const barrierCounts = {};
    const ageGroups = { "18-24": 0, "25-34": 0, "35-44": 0, "45-54": 0, "55-64": 0, "65+": 0 };
    const sexCounts = {};
    const residencyCounts = {};
    const cityCounts = {};
    const postalCounts = {};

    let deaStarters = 0, deaCompleters = 0, pathwaysStarters = 0, pathwaysCompleters = 0;
    let employed = 0, followup90Employed = 0;

    results.forEach(c => {
      if (c.service_type) streamCounts[c.service_type] = (streamCounts[c.service_type] || 0) + 1;
      if (c.status) caseStatusCounts[c.status] = (caseStatusCounts[c.status] || 0) + 1;
      if (c.program_status) programStatusCounts[c.program_status] = (programStatusCounts[c.program_status] || 0) + 1;
      if (c.referral_source) referralCounts[c.referral_source] = (referralCounts[c.referral_source] || 0) + 1;
      if (c.employment_status) intakeEmpCounts[c.employment_status] = (intakeEmpCounts[c.employment_status] || 0) + 1;
      if (c.post_completion_employment_status) {
        postEmpCounts[c.post_completion_employment_status] = (postEmpCounts[c.post_completion_employment_status] || 0) + 1;
        if (["E-RF", "E-UF", "E-PT"].includes(c.post_completion_employment_status)) employed++;
      }
      if (c.followup_90day_status) {
        fu90EmpCounts[c.followup_90day_status] = (fu90EmpCounts[c.followup_90day_status] || 0) + 1;
        if (["E-RF", "E-UF", "E-PT"].includes(c.followup_90day_status)) followup90Employed++;
      }

      if (c.service_type === "direct_to_employment" && c.service_start_date && dateFrom && dateTo) {
        const sd = new Date(c.service_start_date);
        if (sd >= new Date(dateFrom) && sd < new Date(dateTo)) deaStarters++;
      }
      if (c.service_type === "direct_to_employment" && c.completion_date && dateFrom && dateTo) {
        const cd = new Date(c.completion_date);
        if (cd >= new Date(dateFrom) && cd < new Date(dateTo)) deaCompleters++;
      }
      if (c.service_type === "pathways" && c.service_start_date && dateFrom && dateTo) {
        const sd = new Date(c.service_start_date);
        if (sd >= new Date(dateFrom) && sd < new Date(dateTo)) pathwaysStarters++;
      }
      if (c.service_type === "pathways" && c.completion_date && dateFrom && dateTo) {
        const cd = new Date(c.completion_date);
        if (cd >= new Date(dateFrom) && cd < new Date(dateTo)) pathwaysCompleters++;
      }

      if (c.date_of_birth) {
        const birthYear = new Date(c.date_of_birth).getFullYear();
        const currentYear = new Date().getFullYear();
        const age = currentYear - birthYear;
        if (age < 25) ageGroups["18-24"]++;
        else if (age < 35) ageGroups["25-34"]++;
        else if (age < 45) ageGroups["35-44"]++;
        else if (age < 55) ageGroups["45-54"]++;
        else if (age < 65) ageGroups["55-64"]++;
        else ageGroups["65+"]++;
      }

      if (c.sex) sexCounts[c.sex] = (sexCounts[c.sex] || 0) + 1;
      if (c.residency_status) residencyCounts[c.residency_status] = (residencyCounts[c.residency_status] || 0) + 1;
      if (c.city) cityCounts[c.city] = (cityCounts[c.city] || 0) + 1;
      if (c.zip && c.zip.length >= 3) {
        const fsa = c.zip.substring(0, 3).toUpperCase();
        postalCounts[fsa] = (postalCounts[fsa] || 0) + 1;
      }

      if (c.barrier_1) barrierCounts[c.barrier_1] = (barrierCounts[c.barrier_1] || 0) + 1;
      if (c.barrier_2) barrierCounts[c.barrier_2] = (barrierCounts[c.barrier_2] || 0) + 1;
      if (c.barrier_3) barrierCounts[c.barrier_3] = (barrierCounts[c.barrier_3] || 0) + 1;
    });

    const exposureCount = results.filter(c => c._fin_exposure > 0).length;
    const placementCount = results.filter(c => c._fin_placement > 0).length;
    const supportsCount = results.filter(c => c._fin_supports > 0).length;
    const totalExposure = results.reduce((sum, c) => sum + (c._fin_exposure || 0), 0);
    const totalPlacement = results.reduce((sum, c) => sum + (c._fin_placement || 0), 0);
    const totalSupports = results.reduce((sum, c) => sum + (c._fin_supports || 0), 0);
    const totalDirect = totalExposure + totalPlacement + totalSupports;

    return {
      total,
      streamRows: Object.entries(streamCounts).map(([name, value]) => ({ name: SERVICE_LABELS[name] || name, value })),
      deaStarters, deaCompleters, pathwaysStarters, pathwaysCompleters,
      employed, followup90Employed,
      intakeEmpRows: Object.entries(intakeEmpCounts).map(([name, value]) => ({ name: EMP_STATUS_LABELS[name] || name, value })),
      postEmpRows: Object.entries(postEmpCounts).map(([name, value]) => ({ name: EMP_STATUS_LABELS[name] || name, value })),
      fu90Rows: Object.entries(fu90EmpCounts).map(([name, value]) => ({ name: EMP_STATUS_LABELS[name] || name, value })),
      caseStatusRows: Object.entries(caseStatusCounts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })),
      programStatusRows: Object.entries(programStatusCounts).map(([name, value]) => ({ name: name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), value })),
      referralRows: Object.entries(referralCounts).map(([name, value]) => ({ name: name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), value })),
      barrierRows: Object.entries(barrierCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value })),
      financialRows: [
        { name: "Exposure Courses", count: exposureCount, total: totalExposure },
        { name: "Paid External Placements", count: placementCount, total: totalPlacement },
        { name: "Employment Supports", count: supportsCount, total: totalSupports },
      ],
      exposureCount, placementCount, supportsCount,
      totalExposure, totalPlacement, totalSupports, totalDirect,
      ageRows: Object.entries(ageGroups).map(([name, value]) => ({ name, value })),
      sexRows: Object.entries(sexCounts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })),
      residencyRows: Object.entries(residencyCounts).map(([name, value]) => ({ name: name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), value })),
      cityRows: Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value })),
      postalRows: Object.entries(postalCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value })),
    };
  }, [results, dateFrom, dateTo]);

  if (!clients) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <FileBarChart className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Loading report data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={reportRef}>
      {!results ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <FileBarChart className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-base font-medium">Configure and run your report</p>
          <p className="text-sm mt-1">Select filters and date range, then click Run Report.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="mb-6 pb-6 border-b-2 border-slate-200 bg-white print-break-inside-avoid">
            <div className="flex items-center gap-4 mb-4">
              <img src="https://media.base44.com/images/public/6a0025bc2848937e9e70bca5/bf0d54770_Candoracirclelogo_noanniversary.png" alt="Candora" className="h-16 w-auto" />
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Pathways Summary Report</h1>
                <p className="text-sm text-slate-500">Generated on {new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-4 text-xs space-y-2">
              <p className="font-semibold text-slate-700 uppercase tracking-wide">Report Scope</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-2">
                <div>
                  <p className="font-semibold text-slate-700">Date Range</p>
                  <p className="text-slate-600">{dateFrom || 'All time'} → {dateFrom ? dateTo : new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Total Clients</p>
                  <p className="text-slate-600">{stats.total}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 print-break-inside-avoid">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            {selectedSections.includes("starters_completers") && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Employment Outcomes</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.employed}</div>
                  <p className="text-xs text-muted-foreground">post-completion employed</p>
                </CardContent>
              </Card>
            )}
            {selectedSections.includes("employment_90day") && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">90-Day Sustained</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{stats.followup90Employed}</div>
                  <p className="text-xs text-muted-foreground">employed at follow-up</p>
                </CardContent>
              </Card>
            )}
            {selectedSections.includes("financial_summary") && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Direct Costs</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">{fmt$(stats.totalDirect)}</div>
                  <p className="text-xs text-muted-foreground">courses + placements + supports</p>
                </CardContent>
              </Card>
            )}
          </div>

          {selectedSections.includes("starters_completers") && (
            <Card>
              <CardHeader><CardTitle className="text-base">Program Starters {"&"} Completers</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "DEA Starters", value: stats.deaStarters, color: "bg-blue-50 border-blue-200 text-blue-800" },
                    { label: "DEA Completers", value: stats.deaCompleters, color: "bg-blue-100 border-blue-300 text-blue-900" },
                    { label: "Pathways Starters", value: stats.pathwaysStarters, color: "bg-purple-50 border-purple-200 text-purple-800" },
                    { label: "Pathways Completers", value: stats.pathwaysCompleters, color: "bg-purple-100 border-purple-300 text-purple-900" },
                  ].map(item => (
                    <div key={item.label} className={`rounded-lg border p-3 ${item.color}`}>
                      <p className="text-2xl font-bold">{item.value}</p>
                      <p className="text-xs font-medium mt-0.5">{item.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {selectedSections.includes("service_stream") && stats.streamRows.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Service Stream Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.streamRows} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                        {stats.streamRows.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedSections.includes("case_program_status") && (
            <div className="grid gap-4 md:grid-cols-2">
              {stats.caseStatusRows.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Case Status</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.caseStatusRows.map(row => (
                        <div key={row.name} className="flex items-center justify-between">
                          <span className="text-sm">{row.name}</span>
                          <Badge>{row.value}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {stats.programStatusRows.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Program Status</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.programStatusRows.map(row => (
                        <div key={row.name} className="flex items-center justify-between">
                          <span className="text-sm">{row.name}</span>
                          <Badge>{row.value}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {selectedSections.includes("referral_source") && stats.referralRows.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Referral Source</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.referralRows}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill={PIE_COLORS[0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedSections.includes("employment_intake") && stats.intakeEmpRows.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Employment Status at Intake</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.intakeEmpRows.map(row => (
                    <div key={row.name} className="flex items-center justify-between">
                      <span className="text-sm">{row.name}</span>
                      <Badge>{row.value}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {selectedSections.includes("employment_post") && stats.postEmpRows.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Post-Completion Employment Status</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.postEmpRows.map(row => (
                    <div key={row.name} className="flex items-center justify-between">
                      <span className="text-sm">{row.name}</span>
                      <Badge>{row.value}</Badge>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Employed: <span className="font-semibold text-green-600">{stats.employed}</span>
                </p>
              </CardContent>
            </Card>
          )}

          {selectedSections.includes("employment_90day") && stats.fu90Rows.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">90-Day Follow-Up Status</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.fu90Rows.map(row => (
                    <div key={row.name} className="flex items-center justify-between">
                      <span className="text-sm">{row.name}</span>
                      <Badge>{row.value}</Badge>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Employed at 90-day: <span className="font-semibold text-green-600">{stats.followup90Employed}</span>
                </p>
              </CardContent>
            </Card>
          )}

          {selectedSections.includes("financial_summary") && (
            <Card>
              <CardHeader><CardTitle className="text-base">Financial Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {stats.financialRows.map((row, i) => (
                    <div key={row.name} className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm font-medium">{row.name}</p>
                      <p className="text-2xl font-bold mt-1">{fmt$(row.total)}</p>
                      <p className="text-xs text-muted-foreground">{row.count} clients</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium text-primary">Total Direct Costs</p>
                  <p className="text-3xl font-bold text-primary mt-1">{fmt$(stats.totalDirect)}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedSections.includes("barriers") && stats.barrierRows.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Top Barriers Identified</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.barrierRows} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <Tooltip />
                      <Bar dataKey="value" fill={PIE_COLORS[1]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedSections.includes("client_demographics") && (
            <div className="space-y-4">
              {demographicOptions.includes("age_distribution") && stats.ageRows.some(r => r.value > 0) && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Age Distribution</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.ageRows}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill={PIE_COLORS[2]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {demographicOptions.includes("sex_distribution") && stats.sexRows.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Sex Distribution</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.sexRows.map(row => (
                        <div key={row.name} className="flex items-center justify-between">
                          <span className="text-sm">{row.name}</span>
                          <Badge>{row.value}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {demographicOptions.includes("residency_status") && stats.residencyRows.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Residency Status</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.residencyRows.map(row => (
                        <div key={row.name} className="flex items-center justify-between">
                          <span className="text-sm">{row.name}</span>
                          <Badge>{row.value}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {demographicOptions.includes("city_distribution") && stats.cityRows.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">City Distribution (Top 10)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.cityRows.map(row => (
                        <div key={row.name} className="flex items-center justify-between">
                          <span className="text-sm">{row.name}</span>
                          <Badge>{row.value}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {demographicOptions.includes("postal_code_distribution") && stats.postalRows.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Postal Code Distribution (FSA - Top 10)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.postalRows.map(row => (
                        <div key={row.name} className="flex items-center justify-between">
                          <span className="text-sm">{row.name}</span>
                          <Badge>{row.value}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center pt-4 border-t">
            Report generated for {stats.total} clients {dateFrom && dateTo && `• Date range: ${dateFrom} to ${dateTo}`}
          </div>
        </div>
      )}
    </div>
  );
}