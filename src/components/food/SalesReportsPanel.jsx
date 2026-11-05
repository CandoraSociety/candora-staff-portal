import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Trash2, Inbox, Loader2, ArrowRightLeft } from 'lucide-react';
import { unitByValue, money, reportPeriod, reportNet } from '@/lib/foodUnits';

// The reports filed in Food Services. The Finance portal renders this same
// list, which is what "forwarding" means: one record, read in both places.
export default function SalesReportsPanel({ unit, showUnit = true, maxRows = 12, emptyHint }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openingId, setOpeningId] = useState(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['food-sales-reports'],
    queryFn: () => base44.entities.FoodSalesReport.list(),
  });

  const rows = reports
    .filter(r => !unit || r.unit === unit)
    .sort((a, b) => String(b.period_end || '').localeCompare(String(a.period_end || '')))
    .slice(0, maxRows);

  const openFile = async (report) => {
    setOpeningId(report.id);
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: report.report_file_uri,
        expires_in: 600,
      });
      window.open(signed_url, '_blank', 'noopener');
    } catch {
      toast({ title: 'Could not open the report file', variant: 'destructive' });
    } finally {
      setOpeningId(null);
    }
  };

  const remove = async (report) => {
    if (!window.confirm(`Remove the ${unitByValue(report.unit).label} report for ${reportPeriod(report)}?`)) return;
    await base44.entities.FoodSalesReport.delete(report.id);
    await queryClient.invalidateQueries({ queryKey: ['food-sales-reports'] });
    toast({ title: 'Report removed' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4" /> Sales reports
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 flex items-center justify-center text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-8 text-center">
            <Inbox className="w-9 h-9 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {emptyHint || 'No Square reports filed yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {rows.map(report => (
              <div key={report.id} className="py-2.5 flex items-center gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium flex items-center gap-2 flex-wrap">
                    {reportPeriod(report)}
                    {showUnit && (
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        {unitByValue(report.unit).label}
                      </Badge>
                    )}
                    {report.forwarded_to_finance && (
                      <Badge className="text-[10px] bg-emerald-100 text-emerald-800 font-normal">In Finance</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {money(reportNet(report))} revenue
                    {report.transaction_count ? ` · ${report.transaction_count} transactions` : ''}
                    {report.tax ? ` · ${money(report.tax)} tax` : ''}
                    {report.imported_by_name ? ` · ${report.imported_by_name}` : ''}
                  </div>
                </div>
                {report.report_file_uri && (
                  <Button variant="ghost" size="sm" onClick={() => openFile(report)} disabled={openingId === report.id}>
                    {openingId === report.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <FileText className="w-3.5 h-3.5" />}
                    File
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => remove(report)} title="Remove report">
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}