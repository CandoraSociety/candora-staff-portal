import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const EMPLOYMENT_STATUS_LABELS = {
  "E-RF": "Employed - Regular Full-time",
  "E-UF": "Employed - Unregular Full-time",
  "E-PT": "Employed - Part-time",
  "UE": "Unemployed",
  "UE-LA": "Unemployed - Looking for Work",
  "UE-S": "Unemployed - Student",
  "NA": "Not Available",
  "no_contact": "No Contact",
};

export default function CRTOutcomes({ clients }) {
  const calculateOutcomes = () => {
    const completers = clients.filter(c => c.program_status === "complete");
    const employmentOutcomes = completers.filter(c => 
      c.employment_status && c.employment_status.startsWith("E-")
    );
    const ninetyDayOutcomes = completers.filter(c => 
      c.followup_90day_status && c.followup_90day_status.startsWith("E-")
    );

    return {
      totalClients: clients.length,
      completers: completers.length,
      employmentOutcomes: employmentOutcomes.length,
      ninetyDayOutcomes: ninetyDayOutcomes.length,
      completionRate: clients.length > 0 ? ((completers.length / clients.length) * 100).toFixed(1) : 0,
      employmentRate: completers.length > 0 ? ((employmentOutcomes.length / completers.length) * 100).toFixed(1) : 0,
      ninetyDayRate: completers.length > 0 ? ((ninetyDayOutcomes.length / completers.length) * 100).toFixed(1) : 0,
    };
  };

  const outcomes = calculateOutcomes();

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Outcome Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Program Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outcomes.completionRate}%</div>
            <p className="text-xs text-slate-500 mt-1">{outcomes.completers} of {outcomes.totalClients} clients</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Employment Outcome Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outcomes.employmentRate}%</div>
            <p className="text-xs text-slate-500 mt-1">{outcomes.employmentOutcomes} of {outcomes.completers} completers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">90-Day Employment Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outcomes.ninetyDayRate}%</div>
            <p className="text-xs text-slate-500 mt-1">{outcomes.ninetyDayOutcomes} of {outcomes.completers} completers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outcomes.totalClients}</div>
          </CardContent>
        </Card>
      </div>

      {/* Employment Outcomes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employment Outcomes Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Name</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Service Type</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Completion Date</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Employment Status</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Employment Date</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500">90-Day Status</th>
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No clients found
                    </td>
                  </tr>
                ) : (
                  clients.map(client => (
                    <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium">
                        {client.first_name} {client.last_name}
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="text-xs">
                          {client.service_type === "direct_to_employment" ? "DEA" : 
                           client.service_type === "pathways" ? "Pathways" : 
                           client.service_type || "—"}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {formatDate(client.completion_date)}
                      </td>
                      <td className="py-2 px-3">
                        {client.employment_status ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            client.employment_status.startsWith("E-") 
                              ? "bg-green-100 text-green-700" 
                              : "bg-slate-100 text-slate-700"
                          }`}>
                            {EMPLOYMENT_STATUS_LABELS[client.employment_status] || client.employment_status}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {formatDate(client.employment_start_date)}
                      </td>
                      <td className="py-2 px-3">
                        {client.followup_90day_status ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            client.followup_90day_status.startsWith("E-") 
                              ? "bg-green-100 text-green-700" 
                              : "bg-slate-100 text-slate-700"
                          }`}>
                            {EMPLOYMENT_STATUS_LABELS[client.followup_90day_status] || client.followup_90day_status}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}