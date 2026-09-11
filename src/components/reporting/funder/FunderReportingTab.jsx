import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import FunderFileUpload from './FunderFileUpload';
import FunderFilesList from './FunderFilesList';
import FunderReportsList from './FunderReportsList';
import CreateReportDialog from './CreateReportDialog';

export default function FunderReportingTab({ funderKey, funderLabel }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-heading font-semibold text-foreground">{funderLabel}</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Reporting documents, templates and report periods for {funderLabel}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />Create New Report
        </Button>
      </div>

      <FunderReportsList funderKey={funderKey} />
      <FunderFileUpload funderKey={funderKey} />
      <FunderFilesList funderKey={funderKey} />

      <CreateReportDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        funderKey={funderKey}
        funderLabel={funderLabel}
      />
    </div>
  );
}