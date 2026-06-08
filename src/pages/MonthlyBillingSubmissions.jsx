import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MonthlyBillingSubmissions() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#1a237e]">Monthly Billing</h1>
        <p className="text-muted-foreground mt-1">Invoice packages and billing submissions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Billing Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Base</p>
                <p className="text-2xl font-bold">$0.00</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deliverables</p>
                <p className="text-2xl font-bold">$0.00</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Direct Costs</p>
                <p className="text-2xl font-bold">$0.00</p>
              </div>
            </div>
            <p className="text-muted-foreground">Generate invoice packages, manage financial records, and submit monthly billings</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}