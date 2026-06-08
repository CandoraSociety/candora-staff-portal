import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const RECORD_TYPE_LABELS = {
  exposure_course: "Exposure Course",
  paid_external_placement: "Paid External Placement",
  employment_supports: "Employment Supports",
};

export default function CRTFinancials({ clients, financials }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateTotals = () => {
    const total = financials.reduce((sum, record) => sum + (record.total || 0), 0);
    const exposureCourses = financials.filter(r => r.record_type === "exposure_course").reduce((sum, r) => sum + (r.total || 0), 0);
    const paidPlacements = financials.filter(r => r.record_type === "paid_external_placement").reduce((sum, r) => sum + (r.total || 0), 0);
    const employmentSupports = financials.filter(r => r.record_type === "employment_supports").reduce((sum, r) => sum + (r.total || 0), 0);

    return { total, exposureCourses, paidPlacements, employmentSupports };
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Total Expenditures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Exposure Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.exposureCourses)}</div>
            <p className="text-xs text-slate-500 mt-1">
              {financials.filter(r => r.record_type === "exposure_course").length} records
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Paid Placements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.paidPlacements)}</div>
            <p className="text-xs text-slate-500 mt-1">
              {financials.filter(r => r.record_type === "paid_external_placement").length} records
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Employment Supports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.employmentSupports)}</div>
            <p className="text-xs text-slate-500 mt-1">
              {financials.filter(r => r.record_type === "employment_supports").length} records
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Records Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Client Name</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Record Type</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Description</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Date</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Vendor</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-500">Amount</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-500">Tax</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {financials.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No financial records found
                    </td>
                  </tr>
                ) : (
                  financials.map(record => (
                    <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium">
                        {record.client_name}
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="text-xs">
                          {RECORD_TYPE_LABELS[record.record_type] || record.record_type}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {record.description || "—"}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {formatDate(record.date)}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {record.vendor || "—"}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600">
                        {formatCurrency(record.amount || 0)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600">
                        {formatCurrency(record.tax || 0)}
                      </td>
                      <td className="py-2 px-3 text-right font-medium">
                        {formatCurrency(record.total || 0)}
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