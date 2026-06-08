import { Card, CardContent } from "@/components/ui/card";
import { FileText, Users, DollarSign, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const modules = [
  { path: "/pathways/intake", icon: FileText, title: "Intake", desc: "Register new clients" },
  { path: "/pathways/dashboard", icon: Users, title: "Dashboard", desc: "My assigned clients" },
  { path: "/pathways/master", icon: Users, title: "Master List", desc: "All client files" },
  { path: "/pathways/reports", icon: BarChart3, title: "Reports", desc: "Outcomes & data" },
  { path: "/pathways/supervisor", icon: Users, title: "Supervisor", desc: "Training placements" },
  { path: "/pathways/resources", icon: FileText, title: "Resources", desc: "Career tools" },
  { path: "/pathways/compass", icon: FileText, title: "Compass", desc: "Task queue" },
  { path: "/pathways/billing", icon: DollarSign, title: "Billing", desc: "Invoice packages" },
];

export default function PathwaysHome() {
  const navigate = useNavigate();
  
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-[#1a237e]">Pathways Case Management</h1>
        <p className="text-muted-foreground mt-2">Employment outcomes tracking and billing system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {modules.map((module) => (
          <Card 
            key={module.path}
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary/20"
            onClick={() => navigate(module.path)}
          >
            <CardContent className="p-6">
              <module.icon className="w-10 h-10 text-[#1a237e] mb-4" />
              <h3 className="text-lg font-semibold mb-1">{module.title}</h3>
              <p className="text-sm text-muted-foreground">{module.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}