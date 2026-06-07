import React from 'react';
import { useAccessLevel } from '@/lib/useAuth';
import PageHeader from '@/components/shared/PageHeader';
import AccessDenied from '@/components/shared/AccessDenied';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

export default function NexusPayGrid() {
  const { isHRAdmin } = useAccessLevel();
  if (!isHRAdmin) return <AccessDenied />;

  return (
    <div className="space-y-6">
      <PageHeader title="Pay Grid" />
      <Card>
        <CardContent className="p-12 flex flex-col items-center text-center">
          <DollarSign className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold">Organization Pay Grid</h3>
          <p className="text-muted-foreground text-sm mt-1">Pay grid information will appear here. Upload your pay scale documents in the Documents section.</p>
        </CardContent>
      </Card>
    </div>
  );
}