import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function useCrossRefPush(assembleFields, onPushed) {
  const queryClient = useQueryClient();
  const [pushing, setPushing] = useState(false);
  const busy = useRef(false);
  const pushAll = async (rows, label) => {
    if (busy.current) return;
    if (!rows.length) { toast.message(`No ${label.toLowerCase()} clients to push`); return; }
    busy.current = true;
    setPushing(true);
    const notice = toast.loading(`Pushing 0 of ${rows.length} clients to the CRT…`);
    let written = 0;
    let billingFailed = false;
    try {
      for (let i = 0; i < rows.length; i += 8) {
        const batch = rows.slice(i, i + 8);
        const updates = batch.map(r => ({ hsid: r.hsid || '', client_name: r.client_name || '', crt_fields: assembleFields(r) }));
        const { data } = await base44.functions.invoke('syncCrossRefUpdatesToCrt', { updates, skip_billing: true });
        const results = data?.results || [];
        written += results.filter(r => !r.error && (r.crt === 'updated' || r.crt === 'added')).length;
        toast.loading(`Checked ${Math.min(i + batch.length, rows.length)} of ${rows.length} clients; ${written} pushed to all open CRTs…`, { id: notice });
      }
      if (written) {
        const { data } = await base44.functions.invoke('refreshAllBillingCounts', {});
        billingFailed = data?.status !== 'success' || data.workbooks?.some(w => w.status === 'error' || w.countErrors > 0);
      }
      if (written === rows.length && !billingFailed) toast.success(`Pushed ${written} of ${rows.length} clients; written fields checked in every open CRT`, { id: notice });
      else if (written) toast.warning(`Pushed ${written} of ${rows.length} clients${billingFailed ? '; billing totals need a refresh' : '; remaining clients need another push'}`, { id: notice });
      else toast.error('No clients were confirmed in every open CRT', { id: notice });
    } catch {
      toast.error(`Push stopped: ${written} of ${rows.length} clients confirmed; retry the remaining clients`, { id: notice });
    } finally {
      busy.current = false;
      setPushing(false);
      if (written) {
        await Promise.all(['crt-workbook-status', 'crt-file-preview', 'crt-rows-scroll', 'clients-billing'].map(key =>
          queryClient.invalidateQueries({ queryKey: [key] })
        ));
        onPushed();
      }
    }
  };
  return { pushing, pushAll, pushCrossRefUpdate: r => pushAll([r], r.client_name || 'Client') };
}