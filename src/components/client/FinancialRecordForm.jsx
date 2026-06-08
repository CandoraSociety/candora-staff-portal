import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const RECORD_TYPES = [
  { value: 'exposure_course', label: 'Exposure Course' },
  { value: 'paid_external_placement', label: 'Paid External Placement' },
  { value: 'employment_supports', label: 'Employment Supports' },
];

const COURSE_TYPES = [
  'first_aid',
  'food_safety',
  'whmis',
  'construction_safety',
  'customer_service',
  'other'
];

const REGISTRATION_STATUS = [
  { value: 'not_registered', label: 'Not Registered' },
  { value: 'registered', label: 'Registered' },
  { value: 'waitlisted', label: 'Waitlisted' },
  { value: 'cancelled', label: 'Cancelled' },
];

const COMPLETION_STATUS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'did_not_complete', label: 'Did Not Complete' },
];

export default function FinancialRecordForm({ client, existingRecord, onSave, onCancel }) {
  const [record, setRecord] = useState(existingRecord || {
    record_type: 'exposure_course',
    course_type: '',
    course_type_other: '',
    description: '',
    amount: '',
    tax: '',
    total: '',
    date: '',
    vendor: '',
    registration_status: 'not_registered',
    completion_status: 'not_started',
    notes: '',
  });
  const [receiptFiles, setReceiptFiles] = useState([]);
  const [completionFiles, setCompletionFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleFileUpload = async (files, type) => {
    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const result = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(result.file_url);
      }
      
      if (type === 'receipt') {
        setReceiptFiles(prev => [...prev, ...uploadedUrls]);
      } else {
        setCompletionFiles(prev => [...prev, ...uploadedUrls]);
      }
      toast.success('File(s) uploaded');
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (url, type) => {
    if (type === 'receipt') {
      setReceiptFiles(prev => prev.filter(u => u !== url));
    } else {
      setCompletionFiles(prev => prev.filter(u => u !== url));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const total = (parseFloat(record.amount) || 0) + (parseFloat(record.tax) || 0);
      const data = {
        ...record,
        amount: parseFloat(record.amount) || 0,
        tax: parseFloat(record.tax) || 0,
        total,
        receipt_urls: receiptFiles,
        completion_record_urls: completionFiles,
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
      };

      if (existingRecord) {
        await onSave({ ...data, id: existingRecord.id });
      } else {
        await base44.entities.FinancialRecord.create(data);
      }
      
      toast.success('Financial record saved');
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{existingRecord ? 'Edit' : 'Add'} Financial Record</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Record Type</Label>
            <Select value={record.record_type} onValueChange={(v) => setRecord(prev => ({ ...prev, record_type: v }))}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECORD_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {record.record_type === 'exposure_course' && (
            <>
              <div>
                <Label>Course Type</Label>
                <Select value={record.course_type} onValueChange={(v) => setRecord(prev => ({ ...prev, course_type: v }))}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COURSE_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type.replace(/_/g, ' ')}</SelectItem>
                    ))}
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {record.course_type === 'other' && (
                <div>
                  <Label>Course Type (Other)</Label>
                  <Input
                    value={record.course_type_other}
                    onChange={(e) => setRecord(prev => ({ ...prev, course_type_other: e.target.value }))}
                    className="mt-2"
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <Label>Description</Label>
          <Textarea
            value={record.description}
            onChange={(e) => setRecord(prev => ({ ...prev, description: e.target.value }))}
            rows={2}
            className="mt-2"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Amount ($)</Label>
            <Input
              type="number"
              step="0.01"
              value={record.amount}
              onChange={(e) => setRecord(prev => ({ ...prev, amount: e.target.value }))}
              className="mt-2"
            />
          </div>
          <div>
            <Label>Tax ($)</Label>
            <Input
              type="number"
              step="0.01"
              value={record.tax}
              onChange={(e) => setRecord(prev => ({ ...prev, tax: e.target.value }))}
              className="mt-2"
            />
          </div>
          <div>
            <Label>Total ($)</Label>
            <Input
              type="number"
              step="0.01"
              value={(parseFloat(record.amount) || 0) + (parseFloat(record.tax) || 0)}
              disabled
              className="mt-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={record.date}
              onChange={(e) => setRecord(prev => ({ ...prev, date: e.target.value }))}
              className="mt-2"
            />
          </div>
          <div>
            <Label>Vendor</Label>
            <Input
              value={record.vendor}
              onChange={(e) => setRecord(prev => ({ ...prev, vendor: e.target.value }))}
              className="mt-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Registration Status</Label>
            <Select value={record.registration_status} onValueChange={(v) => setRecord(prev => ({ ...prev, registration_status: v }))}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGISTRATION_STATUS.map(status => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Completion Status</Label>
            <Select value={record.completion_status} onValueChange={(v) => setRecord(prev => ({ ...prev, completion_status: v }))}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPLETION_STATUS.map(status => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Receipts</Label>
          <div className="flex gap-2 mt-2">
            <Input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={(e) => handleFileUpload(Array.from(e.target.files), 'receipt')}
              disabled={uploading}
            />
          </div>
          {receiptFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {receiptFiles.map(url => (
                <Badge key={url} variant="outline" className="flex items-center gap-1">
                  <span className="truncate max-w-32">{url.split('/').pop()}</span>
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeFile(url, 'receipt')} />
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label>Completion Records</Label>
          <div className="flex gap-2 mt-2">
            <Input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={(e) => handleFileUpload(Array.from(e.target.files), 'completion')}
              disabled={uploading}
            />
          </div>
          {completionFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {completionFiles.map(url => (
                <Badge key={url} variant="outline" className="flex items-center gap-1">
                  <span className="truncate max-w-32">{url.split('/').pop()}</span>
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeFile(url, 'completion')} />
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label>Notes</Label>
          <Textarea
            value={record.notes}
            onChange={(e) => setRecord(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="mt-2"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Saving...' : 'Save Record'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}