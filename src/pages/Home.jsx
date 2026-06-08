import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, ClipboardList, BarChart3, Briefcase, DollarSign, BookOpen, CheckSquare, Package } from "lucide-react";

const modules = [
  { name: "Client Intake", path: "/intake", icon: FileText, description: "Register new clients", color: "bg-blue-500" },
  { name: "My Dashboard", path: "/dashboard", icon: Users, description: "View assigned clients", color: "bg-green-500" },
  { name: "Master List", path: "/master", icon: ClipboardList, description: "All clients database", color: "bg-purple-500" },
  { name: "Reports", path: "/reports", icon: BarChart3, description: "Outcomes and analytics", color: "bg-orange-500" },
  { name: "Supervisor", path: "/supervisor", icon: Briefcase, description: "Training placements", color: "bg-indigo-500" },
  { name: "Resources", path: "/resources", icon: BookOpen, description: "Career tools", color: "bg-teal-500" },
  { name: "Compass", path: "/compass", icon: CheckSquare, description: "Task queue", color: "bg-pink-500" },
  { name: "Billing", path: "/billing", icon: DollarSign, description: "Invoice packages", color: "bg-emerald-500" },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a237e]/5 to-[#FBB800]/10">
      {/* Header */}
      <header className="bg-[#1a237e] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            <img 
              src="https://media.base44.com/images/public/6a0025bc2848937e9e70bca5/bf0d54770_Candoracirclelogo_noanniversary.png" 
              alt="Candora Logo"
              className="h-16 w-16 bg-white rounded-full p-1"
            />
            <div>
              <h1 className="text-3xl font-bold font-display">Candora Pathways</h1>
              <p className="text-[#FBB800]/90 text-sm mt-1">Case Management System</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#1a237e]">Welcome to Pathways CM</h2>
          <p className="text-muted-foreground mt-1">Select a module to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((module) => (
            <Card 
              key={module.path}
              className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 border-2 hover:border-[#1a237e]/30"
              onClick={() => navigate(module.path)}
            >
              <CardHeader className="pb-3">
                <div className={`${module.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}>
                  <module.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">{module.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{module.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Active Clients</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">0</p>
                </div>
                <Users className="w-12 h-12 text-blue-300" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Employment Outcomes</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">0</p>
                </div>
                <Briefcase className="w-12 h-12 text-green-300" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700">Pending Tasks</p>
                  <p className="text-3xl font-bold text-amber-900 mt-1">0</p>
                </div>
                <CheckSquare className="w-12 h-12 text-amber-300" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}