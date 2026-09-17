import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PenTool, ShieldCheck, Search } from 'lucide-react';

export default function FinanceESignatures() {
  const [search, setSearch] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['esignatureLogs'],
    queryFn: () => base44.entities.ESignatureLog.list('-created_date', 200),
  });

  const q = search.toLowerCase();
  const filtered = logs.filter((l) => {
    if (!q) return true;
    return (
      (l.document_ref || '').toLowerCase().includes(q) ||
      (l.signed_by || '').toLowerCase().includes(q) ||
      (l.generated_id || '').toLowerCase().includes(q) ||
      (l.ip_address || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <PenTool className="w-6 h-6 text-primary" /> E-Signatures
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Verification log for every e-signature applied in the portal.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search document, signer or ID…"
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verification Log</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading…' : `${filtered.length} signature${filtered.length === 1 ? '' : 's'} verified`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-semibold">Document Ref</th>
                  <th className="text-left px-4 py-3 font-semibold">Signed By</th>
                  <th className="text-left px-4 py-3 font-semibold">Timestamp (UTC)</th>
                  <th className="text-left px-4 py-3 font-semibold">IP Address</th>
                  <th className="text-left px-4 py-3 font-semibold">Verification Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Generated ID</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      Loading signature log…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      No e-signatures recorded yet.
                    </td>
                  </tr>
                ) : (
                  filtered.map((l) => (
                    <tr key={l.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{l.document_ref}</td>
                      <td className="px-4 py-3">{l.signed_by}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{l.timestamp_utc}</td>
                      <td className="px-4 py-3 font-mono text-xs">{l.ip_address}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success px-2.5 py-0.5 text-xs font-medium">
                          <ShieldCheck className="w-3 h-3" />
                          {l.verification_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold">{l.generated_id}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}