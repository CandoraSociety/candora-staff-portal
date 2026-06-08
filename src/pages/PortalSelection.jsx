import { Card, CardContent } from "@/components/ui/card";
import { Users, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PortalSelection() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-display text-[#1a237e] mb-2">The Candora Society</h1>
          <p className="text-muted-foreground">Select a portal to continue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Volunteer Manager Portal */}
          <Card 
            className="cursor-pointer hover:shadow-xl transition-all border-2 hover:border-primary/30"
            onClick={() => navigate("/volunteer")}
          >
            <CardContent className="p-8 text-center">
              <Users className="w-16 h-16 text-[#1a237e] mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Volunteer Manager</h2>
              <p className="text-muted-foreground">
                Manage volunteers, events, shifts, time logs, and recognition
              </p>
            </CardContent>
          </Card>

          {/* Pathways CM Portal */}
          <Card 
            className="cursor-pointer hover:shadow-xl transition-all border-2 hover:border-primary/30"
            onClick={() => navigate("/pathways")}
          >
            <CardContent className="p-8 text-center">
              <Briefcase className="w-16 h-16 text-[#1a237e] mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Pathways Case Management</h2>
              <p className="text-muted-foreground">
                Client intake, employment outcomes, billing, and reporting
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}