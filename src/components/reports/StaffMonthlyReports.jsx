import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function StaffMonthlyReports() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['staff-monthly-reports'],
    queryFn: () => base44.entities.StaffMonthlyReport.list("-submitted_date", 100),
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const createReportMutation = useMutation({
    mutationFn: (data) => base44.entities.StaffMonthlyReport.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-monthly-reports'] });
      setShowForm(false);
      toast.success("Report submitted successfully!");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    if (!selectedMonth) {
      toast.error("Please select a report month");
      return;
    }

    createReportMutation.mutate({
      report_month: selectedMonth,
      submitted_by: user?.email,
      submitted_by_name: user?.full_name,
      submitted_date: new Date().toISOString().split('T')[0],
      status: "submitted",
      trends: formData.get('trends') || "",
      marketing_activities: formData.get('marketing_activities') || "",
      success_stories: formData.get('success_stories') || "",
      employer_engagements: formData.get('employer_engagements') || "",
      challenges: formData.get('challenges') || "",
      goals_next_month: formData.get('goals_next_month') || "",
      additional_notes: formData.get('additional_notes') || "",
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

  const currentMonth = new Date().toISOString().slice(0, 7);
  const userReports = reports.filter(r => r.submitted_by === user?.email);
  const currentMonthReport = userReports.find(r => r.report_month === currentMonth);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Staff Monthly Reports</h2>
          <p className="text-muted-foreground">Submit your monthly narrative reports</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          New Report
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Submit Monthly Report</CardTitle>
            <CardDescription>Complete all sections for your monthly narrative report</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="report_month">Report Month *</Label>
                  <Input
                    id="report_month"
                    name="report_month"
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    max={currentMonth}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trends">Trends {"&"} Observations</Label>
                <Textarea
                  id="trends"
                  name="trends"
                  placeholder="Describe any trends you've observed in your caseload this month..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="marketing_activities">Marketing {"&"} Outreach Activities</Label>
                <Textarea
                  id="marketing_activities"
                  name="marketing_activities"
                  placeholder="List any marketing, outreach, or networking activities..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="success_stories">Success Stories</Label>
                <Textarea
                  id="success_stories"
                  name="success_stories"
                  placeholder="Share any client success stories or positive outcomes..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employer_engagements">Employer Engagements</Label>
                <Textarea
                  id="employer_engagements"
                  name="employer_engagements"
                  placeholder="Describe employer meetings, job development activities..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="challenges">Challenges {"&"} Barriers</Label>
                <Textarea
                  id="challenges"
                  name="challenges"
                  placeholder="Any challenges faced or systemic barriers identified..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goals_next_month">Goals for Next Month</Label>
                <Textarea
                  id="goals_next_month"
                  name="goals_next_month"
                  placeholder="What are your key goals and priorities for next month?..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional_notes">Additional Notes</Label>
                <Textarea
                  id="additional_notes"
                  name="additional_notes"
                  placeholder="Any other relevant information..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createReportMutation.isPending}>
                  {createReportMutation.isPending ? "Submitting..." : "Submit Report"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {userReports.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Reports Yet</h3>
              <p className="text-muted-foreground mb-4">Submit your first monthly report</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Report
              </Button>
            </CardContent>
          </Card>
        ) : (
          userReports.map(report => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {new Date(report.report_month + "-01").toLocaleDateString('en-CA', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Submitted {format(new Date(report.submitted_date), "MMM d, yyyy")}
                    </CardDescription>
                  </div>
                  {getStatusBadge(report.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {report.trends && (
                  <div>
                    <span className="font-medium">Trends:</span>
                    <p className="text-muted-foreground line-clamp-2">{report.trends}</p>
                  </div>
                )}
                {report.success_stories && (
                  <div>
                    <span className="font-medium">Success Stories:</span>
                    <p className="text-muted-foreground line-clamp-2">{report.success_stories}</p>
                  </div>
                )}
                {report.goals_next_month && (
                  <div>
                    <span className="font-medium">Next Month Goals:</span>
                    <p className="text-muted-foreground line-clamp-2">{report.goals_next_month}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}