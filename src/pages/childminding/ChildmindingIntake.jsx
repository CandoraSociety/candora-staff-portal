import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Baby, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import ChildmindingDialog from '@/components/childminding/ChildmindingDialog';
import { PROGRAM_OPTIONS, RATE_PER_HOUR } from '@/lib/childmindingConstants';

export default function ChildmindingIntake() {
  const [dialogOpen, setDialogOpen] = useState(true);
  const queryClient = useQueryClient();

  const onSaved = () => {
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['childminding-records'] });
    // Reopen a fresh dialog for the next intake
    setTimeout(() => setDialogOpen(true), 100);
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-heading font-bold text-foreground">Childminding Intake</h1><p className="text-muted-foreground text-sm mt-1">Register a child for childminding services</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center"><Baby className="h-6 w-6 text-primary" /></div>
              <div><h2 className="font-heading font-bold text-lg">New Childminding Registration</h2><p className="text-sm text-muted-foreground">Fill in the child and parent/guardian details below</p></div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">The intake form collects:</p>
              <ul className="text-sm space-y-1.5 ml-4">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Child's first name</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Parent/guardian's first and last name</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Number of hours of childminding</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Program the parent/guardian is attending</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Date of childminding session</li>
              </ul>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-900"><strong>Billing:</strong> Pathways participants are billed at ${RATE_PER_HOUR}/child/hour. Other programs are not billed.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-2">Program Options</h3>
            <div className="space-y-2">
              {PROGRAM_OPTIONS.map(p => (
                <div key={p.value} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} /><span className="text-sm">{p.label}</span></div>
                  <span className="text-xs text-muted-foreground">{p.billable ? `$${p.rate}/hr` : 'No charge'}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <ChildmindingDialog open={dialogOpen} onOpenChange={setDialogOpen} record={null} onSaved={onSaved} />
    </div>
  );
}