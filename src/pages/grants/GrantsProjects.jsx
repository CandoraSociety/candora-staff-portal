import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FolderOpen } from 'lucide-react';

export default function GrantsProjects() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-display font-bold text-foreground">Projects</h1>
      <Card><CardContent className="flex items-center gap-3 py-8 text-muted-foreground"><FolderOpen className="h-5 w-5" /><span>Projects list coming soon.</span></CardContent></Card>
    </div>
  );
}