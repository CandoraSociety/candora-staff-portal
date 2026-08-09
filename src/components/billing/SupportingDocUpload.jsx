import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, Loader2 } from 'lucide-react';
import { buildBillingDocName, descriptorFromFinancialRecord } from '@/lib/billingDocName';

export default function SupportingDocUpload({ recordType, record, urlField, queryKey }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const qc = useQueryClient();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const namedName = buildBillingDocName({
        recordType: record?.record_type,
        descriptor: descriptorFromFinancialRecord(record),
        clientName: record?.client_name,
        month: record?.billing_month,
        originalName: file.name,
      });
      const uploadFile = namedName !== file.name
        ? new File([file], namedName, { type: file.type })
        : file;
      const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadFile });
      const existing = record[urlField] || [];
      const entity = recordType === 'childminding'
        ? base44.entities.ChildmindingRecord
        : base44.entities.FinancialRecord;
      await entity.update(record.id, { [urlField]: [...existing, file_url] });
      qc.invalidateQueries({ queryKey });
      toast.success('Supporting document uploaded');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <label className="cursor-pointer text-[10px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
      {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
      {uploading ? 'Uploading...' : 'Upload doc'}
      <input ref={inputRef} type="file" className="hidden" onChange={handleFile} disabled={uploading} />
    </label>
  );
}