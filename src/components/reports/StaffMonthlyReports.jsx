import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileText, Clock, CheckCircle2, AlertCircle, User, Save } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function StaffMonthlyReports() {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterWorker, setFilterWorker] = useState("all");
  const [formData, setFormData] = useState({
    submitted_by_name: "",
    trends: "",
    marketing_activities: "",
    success_stories: "",
    employer_engagements: "",
    challenges: "",
    goals_next_month: "",
    additional_notes: "",
  });
  const [editingReport, setEditingReport] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("trends");

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['staff-monthly-reports'],
    queryFn: () => base44.entities.StaffMonthlyReport.list("-submitted_date", 100),
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['all-clients'],
    queryFn: () => base44.entities.Client.list("-created_date", 1000),
  });

  const workers = useMemo(() => {
    const unique = new Set(clients.map(c => c.assigned_worker_name).filter(Boolean));
    return Array.from(unique).sort();
  }, [clients]);

  const createReportMutation = useMutation({
    mutationFn: async (data) => {
      setSaving(true);
      try {
        if (editingReport) {
          return await base44.entities.StaffMonthlyReport.update(editingReport.id, data);
        } else {
          return await base44.entities.StaffMonthlyReport.create(data);
        }
      } finally {
        setSaving(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-monthly-reports'] });
      setEditingReport(null);
      setFormData({
        submitted_by_name: user?.full_name || "",
        trends: "",
        marketing_activities: "",
        success_stories: "",
        employer_engagements: "",
        challenges: "",
        goals_next_month: "",
        additional_notes: "",
      });
      toast.success(editingReport ? "Report updated!" : "Report submitted successfully!");
    },
  });

  const handleSave = (status) => {
    if (!selectedMonth || !formData.submitted_by_name) {
      toast.error("Please select month and your name");
      return;
    }
    createReportMutation.mutate({
      report_month: selectedMonth,
      submitted_by: user?.email,
      submitted_by_name: formData.submitted_by_name,
      submitted_date: new Date().toISOString().split('T')[0],
      status,
      ...formData,
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      draft: "secondary",
      submitted: "default",
    };
    const icons = {
      draft: <Clock className="w-3 h-3 mr-1" />,
      submitted: <CheckCircle2 className="w-3 h-3 mr-1" />,
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredReports = useMemo(() => {
    let r = reports;
    if (filterWorker !== "all") {
      r = r.filter(rep => rep.submitted_by_name === filterWorker);
    }
    return r;
  }, [reports, filterWorker]);

  const groupedReports = useMemo(() => {
    const groups = {};
    filteredReports.forEach(rep => {
      const month = rep.report_month;
      if (!groups[month]) groups[month] = [];
      groups[month].push(rep);
    });
    return groups;
  }, [filteredReports]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left Column - Form */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Report Month</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              max={new Date().toISOString().slice(0, 7)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Name</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={formData.submitted_by_name} onValueChange={(v) => setFormData(prev => ({ ...prev, submitted_by_name: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select your name" />
              </SelectTrigger>
              <SelectContent>
                {workers.map(w => (
                  <SelectItem key={w} value={w}>{w}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="trends">Trends</TabsTrigger>
                <TabsTrigger value="marketing">Marketing</TabsTrigger>
                <TabsTrigger value="success">Success</TabsTrigger>
                <TabsTrigger value="employer">Employer</TabsTrigger>
              </TabsList>

              <TabsContent value="trends" className="space-y-3 mt-3">
                <div>
                  <Label>Trends Observed</Label>
                  <Textarea
                    rows={6}
                    value={formData.trends}
                    onChange={(e) => setFormData(prev => ({ ...prev, trends: e.target.value }))}
                    placeholder="Describe trends in your caseload..."
                  />
                </div>
                <div>
                  <Label>Challenges</Label>
                  <Textarea
                    rows={4}
                    value={formData.challenges}
                    onChange={(e) => setFormData(prev => ({ ...prev, challenges: e.target.value }))}
                    placeholder="Challenges faced..."
                  />
                </div>
              </TabsContent>

              <TabsContent value="marketing" className="mt-3">
                <div>
                  <Label>Marketing {"&"} Outreach Activities</Label>
                  <Textarea
                    rows={8}
                    value={formData.marketing_activities}
                    onChange={(e) => setFormData(prev => ({ ...prev, marketing_activities: e.target.value }))}
                    placeholder="List marketing, outreach, networking activities..."
                  />
                </div>
              </TabsContent>

              <TabsContent value="success" className="mt-3">
                <div>
                  <Label>Success Stories</Label>
                  <Textarea
                    rows={8}
                    value={formData.success_stories}
                    onChange={(e) => setFormData(prev => ({ ...prev, success_stories: e.target.value }))}
                    placeholder="Share client success stories..."
                  />
                </div>
              </TabsContent>

              <TabsContent value="employer" className="space-y-3 mt-3">
                <div>
                  <Label>Employer Engagements</Label>
                  <Textarea
                    rows={5}
                    value={formData.employer_engagements}
                    onChange={(e) => setFormData(prev => ({ ...prev, employer_engagements: e.target.value }))}
                    placeholder="Employer meetings, job development..."
                  />
                </div>
                <div>
                  <Label>Goals for Next Month</Label>
                  <Textarea
                    rows={4}
                    value={formData.goals_next_month}
                    onChange={(e) => setFormData(prev => ({ ...prev, goals_next_month: e.target.value }))}
                    placeholder="Key goals for next month..."
                  />
                </div>
                <div>
                  <Label>Additional Notes</Label>
                  <Textarea
                    rows={3}
                    value={formData.additional_notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, additional_notes: e.target.value }))}
                    placeholder="Any other relevant information..."
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 mt-4">
              <Button className="flex-1" onClick={() => handleSave("draft")} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : editingReport ? "Update Draft" : "Save Draft"}
              </Button>
              {editingReport && editingReport.status === "draft" && (
                <Button onClick={() => handleSave("submitted")} disabled={saving}>
                  Submit Report
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Submitted Reports */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Submitted Reports</h3>
          <Select value={filterWorker} onValueChange={setFilterWorker}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              {workers.map(w => (
                <SelectItem key={w} value={w}>{w}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {Object.keys(groupedReports).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Reports</h3>
              <p className="text-muted-foreground">No reports submitted yet</p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedReports)
            .sort((a, b) => new Date(b[0] + "-01") - new Date(a[0] + "-01"))
            .map(([month, reps]) => (
              <Card key={month}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {new Date(month + "-01").toLocaleDateString('en-CA', { year: 'numeric', month: 'long' })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {reps.map(report => (
                    <div key={report.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{report.submitted_by_name}</span>
                        </div>
                        {getStatusBadge(report.status)}
                      </div>
                      {report.trends && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Trends:</span> {report.trends.slice(0, 100)}...
                        </p>
                      )}
                      {report.success_stories && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Success:</span> {report.success_stories.slice(0, 100)}...
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  );
}