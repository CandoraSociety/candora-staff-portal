import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Resources() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#1a237e]">Resources</h1>
        <p className="text-muted-foreground mt-1">Career planning and job search tools</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Career Planning</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Career exploration and planning resources</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job Search</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Job search strategies and resources</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}