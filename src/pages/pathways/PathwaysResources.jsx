import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CareerPlanning from '@/components/resources/CareerPlanning';
import JobSearch from '@/components/resources/JobSearch';
import MiniModulesLibrary from '@/components/resources/MiniModulesLibrary';

const tabFromUrl = () => new URLSearchParams(window.location.search).get('tab') || 'career';

export default function PathwaysResources() {
  const location = useLocation();
  const [tab, setTab] = useState(tabFromUrl);

  // Training tours open a category by its URL (?tab=jobs), so the tab follows
  // the query string as well as the click.
  useEffect(() => {
    const fromUrl = new URLSearchParams(location.search).get('tab');
    if (fromUrl) setTab(fromUrl);
  }, [location.search]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div data-tour="pw-resources-hero">
        <h1 className="text-2xl font-display font-bold">Resources</h1>
        <p className="text-sm text-muted-foreground mt-1">Career planning tools, job search resources and mini-modules</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList data-tour="pw-resources-tabs">
          <TabsTrigger value="career">Career Planning</TabsTrigger>
          <TabsTrigger value="jobs">Job Search</TabsTrigger>
          <TabsTrigger value="mini">Mini-Modules</TabsTrigger>
        </TabsList>
        <TabsContent value="career" className="mt-4" data-tour="pw-resources-career">
          <CareerPlanning />
        </TabsContent>
        <TabsContent value="jobs" className="mt-4">
          <JobSearch />
        </TabsContent>
        <TabsContent value="mini" className="mt-4" data-tour="pw-resources-mini">
          <MiniModulesLibrary />
        </TabsContent>
      </Tabs>
    </div>
  );
}