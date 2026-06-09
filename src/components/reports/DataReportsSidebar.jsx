import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Save, Trash2, Play, X, Filter, ChevronDown, ChevronUp, 
  User, Check, Plus 
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns";

const DATE_FIELDS = [
  { key: "intake_date", label: "Intake Date" },
  { key: "service_start_date", label: "Service Start Date" },
  { key: "completion_date", label: "Completion Date" },
  { key: "employment_start_date", label: "Employment Start Date" },
  { key: "followup_90day_date", label: "90-Day Follow-Up Date" },
  { key: "post_completion_employment_date", label: "Post-Completion Employment Date" },
  { key: "closed_date", label: "Close Date" },
];

const DATE_PRESETS = [
  { value: "none", label: "All time" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "ytd", label: "Year to Date (Jan–Today)" },
  { value: "fiscal_year", label: "Current Fiscal Year (Apr–Mar)" },
  { value: "last_fiscal_year", label: "Last Fiscal Year" },
  { value: "this_year", label: "This Calendar Year" },
  { value: "custom", label: "Custom Range" },
];

const SERVICE_TYPE_OPTIONS = [
  { value: "direct_to_employment", label: "DEA" },
  { value: "pathways", label: "Pathways" },
  { value: "casual", label: "Casual" },
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

const HAS_VEHICLE_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no_has_license", label: "Yes (has license)" },
  { value: "no_no_license", label: "No" },
];

export const DEMOGRAPHIC_FILTERS = [
  { key: "service_type", label: "Service Stream", type: "multi-select", fixedOptions: SERVICE_TYPE_OPTIONS },
  { key: "status", label: "Case Status", type: "multi-select", fixedOptions: CASE_STATUS_OPTIONS },
  { key: "program_status", label: "Program Status", type: "multi-select" },
  { key: "residency_status", label: "Residency Status", type: "multi-select", fixedOptions: RESIDENCY_STATUS_OPTIONS },
  { key: "clb_level", label: "CLB Level", type: "multi-select" },
  { key: "employment_status", label: "Employment Status", type: "multi-select" },
  { key: "referral_source", label: "Referral Source", type: "multi-select" },
  { key: "assigned_worker_name", label: "Career Counsellor", type: "multi-select" },
  { key: "city", label: "City", type: "text" },
  { key: "has_vehicle", label: "Has Vehicle", type: "select", fixedOptions: HAS_VEHICLE_OPTIONS },
  { key: "barrier_1", label: "Barrier Type", type: "multi-select" },
  { key: "closed_reason", label: "Close Reason", type: "multi-select" },
  { key: "compass_verified", label: "Compass Verified", type: "boolean-select" },
];

export const REPORT_SECTIONS = [
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

const TEMPLATE_KEY = "report_templates_v2";

function loadTemplates() {
  try { return JSON.parse(localStorage.getItem(TEMPLATE_KEY) || "[]"); } catch { return []; }
}

function saveTemplates(templates) {
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
}

export function getDateRange(preset, customFrom, customTo) {
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

export default function DataReportsSidebar({ 
  clients, 
  onRunReport, 
  dateField, setDateField, 
  datePreset, setDatePreset, 
  customDateFrom, setCustomDateFrom, 
  customDateTo, setCustomDateTo,
  filters, setFilters,
  selectedSections, setSelectedSections,
  demographicOptions, setDemographicOptions,
}) {
  const [templates, setTemplates] = useState(loadTemplates());
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [showDemographicSubOptions, setShowDemographicSubOptions] = useState(false);

  const { dateFrom, dateTo } = useMemo(() => {
    const range = getDateRange(datePreset, customDateFrom, customDateTo);
    return range;
  }, [datePreset, customDateFrom, customDateTo]);

  const uniqueValues = useMemo(() => {
    const values = {};
    DEMOGRAPHIC_FILTERS.forEach(filter => {
      if (!filter.fixedOptions) {
        values[filter.key] = [...new Set(clients.map(c => c[filter.key]).filter(Boolean))].sort();
      }
    });
    return values;
  }, [clients]);

  const loadTemplate = (t) => {
    setDateField(t.dateField || "service_start_date");
    setDatePreset(t.datePreset || "none");
    setFilters(t.filters || {});
  };

  const deleteTemplate = (id) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
  };

  const saveTemplate = () => {
    if (!templateName.trim()) return;
    const newTemplate = {
      id: Date.now(),
      name: templateName.trim(),
      dateField,
      datePreset,
      filters,
    };
    const updated = [...templates, newTemplate];
    setTemplates(updated);
    saveTemplates(updated);
    setTemplateName("");
    setSavingTemplate(false);
  };

  const toggleFilter = (key, value) => {
    setFilters(prev => {
      const current = prev[key] || [];
      const isArray = Array.isArray(current);
      if (!isArray) {
        return { ...prev, [key]: [value] };
      }
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter(v => v !== value) };
      }
      return { ...prev, [key]: [...current, value] };
    });
  };

  const selectAllFilterOptions = (key, allValues, selectAll) => {
    setFilters(prev => ({
      ...prev,
      [key]: selectAll ? [...allValues] : []
    }));
  };

  const toggleSection = (key) => {
    setSelectedSections(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleDemographicOption = (key) => {
    setDemographicOptions(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleAllSections = () => {
    const allKeys = REPORT_SECTIONS.filter(s => !s.subOptions).map(s => s.key);
    const allSelected = allKeys.every(k => selectedSections.includes(k));
    setSelectedSections(allSelected ? [] : allKeys);
  };

  const renderFilterInput = (filter) => {
    const value = filters[filter.key];

    if (filter.type === "multi-select") {
      const options = filter.fixedOptions || (uniqueValues[filter.key] || []).map(v => ({ value: v, label: v }));
      const selected = Array.isArray(value) ? value : [];
      const allSelected = selected.length === options.length;

      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">{filter.label}</Label>
            {options.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => selectAllFilterOptions(filter.key, options.map(o => o.value), !allSelected)}
              >
                {allSelected ? "Clear" : "All"}
              </Button>
            )}
          </div>
          <div className="max-h-24 overflow-y-auto border rounded-md p-2 space-y-1.5">
            {options.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded">
                <Checkbox
                  checked={selected.includes(opt.value)}
                  onCheckedChange={() => toggleFilter(filter.key, opt.value)}
                  className="h-4 w-4"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    if (filter.type === "text") {
      return (
        <div className="space-y-2">
          <Label className="text-xs font-medium">{filter.label}</Label>
          <Input
            value={value || ""}
            onChange={(e) => setFilters(prev => ({ ...prev, [filter.key]: e.target.value }))}
            placeholder={`Filter by ${filter.label.toLowerCase()}`}
            className="h-9"
          />
        </div>
      );
    }

    if (filter.type === "select") {
      return (
        <div className="space-y-2">
          <Label className="text-xs font-medium">{filter.label}</Label>
          <Select
            value={value === true ? "yes" : value === false ? "no" : value || "any"}
            onValueChange={(v) => setFilters(prev => ({ 
              ...prev, 
              [filter.key]: v === "any" ? "" : v === "yes" ? true : v === "no" ? false : v 
            }))}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              {filter.fixedOptions?.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (filter.type === "boolean-select") {
      return (
        <div className="space-y-2">
          <Label className="text-xs font-medium">{filter.label}</Label>
          <Select
            value={value === true ? "yes" : value === false ? "no" : "any"}
            onValueChange={(v) => setFilters(prev => ({ 
              ...prev, 
              [filter.key]: v === "any" ? "" : v === "yes" ? true : false 
            }))}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      {/* Saved Templates */}
      {templates.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-semibold">Saved Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {templates.map(t => (
              <div key={t.id} className="flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 justify-start h-8 text-sm truncate"
                  onClick={() => loadTemplate(t)}
                >
                  {t.name}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => deleteTemplate(t.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Date Range */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-semibold">Date Range</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Filter by date field</Label>
            <Select value={dateField} onValueChange={setDateField}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_FIELDS.map(field => (
                  <SelectItem key={field.key} value={field.key}>{field.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Period</Label>
            <Select value={datePreset} onValueChange={setDatePreset}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_PRESETS.map(preset => (
                  <SelectItem key={preset.value} value={preset.value}>{preset.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {datePreset === "custom" && (
            <div className="space-y-2">
              <div className="space-y-2">
                <Label className="text-xs font-medium">From</Label>
                <Input
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">To</Label>
                <Input
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          )}

          {datePreset !== "none" && datePreset !== "custom" && (
            <div className="text-xs text-muted-foreground bg-slate-50 rounded p-2">
              {dateFrom} → {dateTo}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Include in Summary */}
      <Card>
        <CardHeader className="py-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Include in Summary</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={toggleAllSections}
          >
            {REPORT_SECTIONS.filter(s => !s.subOptions).every(k => selectedSections.includes(k.key)) ? "Clear All" : "All"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 max-h-48 overflow-y-auto">
          {REPORT_SECTIONS.map(section => (
            <div key={section.key} className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={selectedSections.includes(section.key)}
                  onCheckedChange={() => toggleSection(section.key)}
                  className="h-4 w-4"
                />
                <span>{section.label}</span>
              </label>
              {section.subOptions && showDemographicSubOptions && selectedSections.includes(section.key) && (
                <div className="ml-6 border-l-2 border-slate-200 pl-3 space-y-1.5">
                  {section.subOptions.map(sub => (
                    <label key={sub.key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={demographicOptions.includes(sub.key)}
                        onCheckedChange={() => toggleDemographicOption(sub.key)}
                        className="h-4 w-4"
                      />
                      <span>{sub.label}</span>
                    </label>
                  ))}
                </div>
              )}
              {section.subOptions && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs ml-6"
                  onClick={() => setShowDemographicSubOptions(!showDemographicSubOptions)}
                >
                  {showDemographicSubOptions ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                  {showDemographicSubOptions ? "Hide" : "Show"} options
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Client Filters */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-semibold">Client Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-96 overflow-y-auto">
          {DEMOGRAPHIC_FILTERS.map(filter => (
            <div key={filter.key}>
              {renderFilterInput(filter)}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button className="w-full" onClick={onRunReport}>
          <Play className="h-4 w-4 mr-2" />
          Run Report
        </Button>

        {!savingTemplate ? (
          <Button variant="outline" className="w-full" onClick={() => setSavingTemplate(true)}>
            <Save className="h-4 w-4 mr-2" />
            Save as Template
          </Button>
        ) : (
          <div className="flex gap-2">
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name"
              className="h-9 flex-1"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && saveTemplate()}
            />
            <Button
              size="sm"
              onClick={saveTemplate}
              disabled={!templateName.trim()}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSavingTemplate(false);
                setTemplateName("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}