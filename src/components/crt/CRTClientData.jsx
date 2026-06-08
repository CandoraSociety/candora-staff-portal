import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SERVICE_TYPE_LABELS = {
  direct_to_employment: "DEA",
  pathways: "Pathways",
  casual: "Casual",
  external_referral: "Ext. Referral",
  internal_referral: "Int. Referral",
  not_eligible: "Not Eligible",
};

const PROGRAM_STATUS_COLORS = {
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  complete: "bg-green-100 text-green-700 border-green-200",
  incomplete: "bg-yellow-100 text-yellow-700 border-yellow-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

export default function CRTClientData({ clients }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTotalCount = () => clients.length;
  const getByServiceType = (type) => clients.filter(c => c.service_type === type).length;
  const getByProgramStatus = (status) => clients.filter(c => c.program_status === status).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalCount()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">DEA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getByServiceType("direct_to_employment")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Pathways</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getByServiceType("pathways")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getByProgramStatus("in_progress")}</div>
          </CardContent>
        </Card>
      </div>

      {/* Client Table */}
      <Card>
        <CardHeader>
          <CardTitle>Client List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Name</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Service Type</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Program Status</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Start Date</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Completion Date</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Counsellor</th>
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
                          {SERVICE_TYPE_LABELS[client.service_type] || client.service_type || "—"}
                        </Badge>
                      </td>
                      <td className="py-2 px-3">
                        {client.program_status && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${PROGRAM_STATUS_COLORS[client.program_status] || "bg-slate-100 text-slate-700"}`}>
                            {client.program_status.replace("_", " ").toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {formatDate(client.service_start_date)}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {formatDate(client.completion_date)}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {client.assigned_worker_name || "—"}
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