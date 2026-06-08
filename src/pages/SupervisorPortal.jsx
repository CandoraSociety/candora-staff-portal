import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SupervisorPortal() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#1a237e]">Supervisor Portal</h1>
        <p className="text-muted-foreground mt-1">Internal training placement management</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Internal Training Placements</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Manage internal training placements (Cleaning ARC, Food Services, Reception, Childcare)</p>
        </CardContent>
      </Card>
    </div>
  );
}