import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReportSummary from "@/components/reports/ReportSummary";
import StaffMonthlyReports from "@/components/reports/StaffMonthlyReports";
import DataReportsSidebar from "@/components/reports/DataReportsSidebar";
import QuickviewStats from "@/components/pathways/QuickviewStats";
import CrtOutcomesTab from "@/components/reports/CrtOutcomesTab";
import { DEMOGRAPHIC_FILTERS, getDateRange, REPORT_SECTIONS } from "@/components/reports/DataReportsSidebar";

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
          <TabsTrigger value="quickview">Quickview Program Stats</TabsTrigger>
        </TabsList>

        {/* TAB 1: OUTCOMES — drawn from the live CRT Client Data sheet */}
        <TabsContent value="outcomes">
          <CrtOutcomesTab />
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

        {/* TAB 4: QUICKVIEW PROGRAM STATS */}
        <TabsContent value="quickview">
          <QuickviewStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}