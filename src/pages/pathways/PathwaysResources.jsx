import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CareerPlanning from '@/components/resources/CareerPlanning';
import JobSearch from '@/components/resources/JobSearch';

export default function PathwaysResources() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Resources</h1>
        <p className="text-sm text-muted-foreground mt-1">Career planning tools and job search resources</p>
      </div>

      <Tabs defaultValue="career">
        <TabsList>
          <TabsTrigger value="career">Career Planning</TabsTrigger>
          <TabsTrigger value="jobs">Job Search</TabsTrigger>
        </TabsList>
        <TabsContent value="career" className="mt-4">
          <CareerPlanning />
        </TabsContent>
        <TabsContent value="jobs" className="mt-4">
          <JobSearch />
        </TabsContent>
      </Tabs>
    </div>
  );
}