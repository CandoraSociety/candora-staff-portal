import { Link } from 'react-router-dom';
import { Users, ClipboardList, BarChart3, DollarSign, Compass, BookOpen, Settings, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PathwaysHome() {
  const modules = [
    {
      title: 'Client Intake',
      description: 'Register new clients and collect demographic information',
      icon: ClipboardList,
      link: '/pathways/intake',
      color: 'bg-blue-500'
    },
    {
      title: 'Dashboard',
      description: 'View your assigned clients and priority alerts',
      icon: Users,
      link: '/pathways/dashboard',
      color: 'bg-green-500'
    },
    {
      title: 'Master List',
      description: 'Browse all active and closed client files',
      icon: FileText,
      link: '/pathways/master',
      color: 'bg-purple-500'
    },
    {
      title: 'Compass Tasks',
      description: 'Manage government database tasks and follow-ups',
      icon: Compass,
      link: '/pathways/compass',
      color: 'bg-orange-500'
    },
    {
      title: 'Reports',
      description: 'Generate outcomes, data reports, and staff monthly summaries',
      icon: BarChart3,
      link: '/pathways/reports',
      color: 'bg-red-500'
    },
    {
      title: 'Billing',
      description: 'Create invoice packages and manage financial records',
      icon: DollarSign,
      link: '/pathways/billing',
      color: 'bg-emerald-500'
    },
    {
      title: 'Resources',
      description: 'Career planning tools and job search resources',
      icon: BookOpen,
      link: '/pathways/resources',
      color: 'bg-indigo-500'
    },
    {
      title: 'Supervisor Portal',
      description: 'Admin oversight and system-wide reporting',
      icon: Settings,
      link: '/pathways/supervisor',
      color: 'bg-slate-500'
    },
  ];
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Pathways Case Management</h1>
        <p className="text-slate-600 mt-1">Welcome to the Pathways CM system. Select a module to get started.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Card key={module.link} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <Link to={module.link}>
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 ${module.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">{module.description}</p>
                </CardContent>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}