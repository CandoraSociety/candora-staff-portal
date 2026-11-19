import { useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { hasWebsiteAccess } from "@/lib/websiteManager";
import { Card, CardContent } from "@/components/ui/card";

export default function WebsiteAccessGate({ children }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasWebsiteAccess(user?.email, user?.role)) {
    return (
      <div className="flex items-center justify-center h-screen p-6">
        <Card className="max-w-md border-border/70">
          <CardContent className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6 text-muted-foreground" />
            </div>
            <h1 className="font-display text-lg font-bold text-foreground">Website Studio is restricted</h1>
            <p className="text-sm text-muted-foreground">
              Only designated staff can manage the public website. Ask an administrator if you need access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return children;
}