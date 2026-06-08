import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ExposuresSupportsStep({ client, onSave, onComplete }) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        exposure_course: true,
        employment_supports: true,
      });
      toast.success('Exposure courses and supports logged');
      onComplete?.();
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Log financial records for exposure courses, paid placements, and employment supports.
        This section integrates with the Financials tab.
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Use the Financials tab to add detailed records with receipts and amounts.
            This step marks that exposure courses or supports have been provided.
          </p>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Mark as Complete'}
          </Button>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        For detailed financial tracking, navigate to the Financials tab.
      </div>
    </div>
  );
}