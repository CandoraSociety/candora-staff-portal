import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PathwaysResources() {
  const resources = [
    { title: 'Career Planning Guide', description: 'Step-by-step career planning workbook', link: '#' },
    { title: 'Resume Writing Tips', description: 'Best practices for Canadian-style resumes', link: '#' },
    { title: 'Interview Preparation', description: 'Common interview questions and answers', link: '#' },
    { title: 'Job Search Strategies', description: 'Effective job search techniques', link: '#' },
    { title: 'Workplace Culture', description: 'Understanding Canadian workplace expectations', link: '#' },
    { title: 'Networking Guide', description: 'Building professional networks', link: '#' },
  ];
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Client Resources</h1>
        <p className="text-sm text-slate-600">Career planning and job search resources</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((resource, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{resource.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-3">{resource.description}</p>
              <Button size="sm" variant="outline">View Resource</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}