import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { Plus, Upload } from 'lucide-react';

const RECORD_TYPES = ['exposure_course', 'paid_external_placement', 'employment_supports'];
const REGISTRATION_STATUS = ['not_registered', 'registered', 'waitlisted', 'cancelled'];
const COMPLETION_STATUS = ['not_started', 'in_progress', 'completed', 'did_not_complete'];

export default function ClientFinancials({ client }) {
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadRecords();
  }, [client.id]);

  const loadRecords = async () => {
    try {
      const data = await base44.entities.FinancialRecord.filter({ client_id: client.id });
      setRecords(data);
    } catch (error) {
      toast.error('Failed to load financial records');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    } catch (error) {
      toast.error('Failed to upload file');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (formData) => {
    try {
      if (formData.id) {
        await base44.entities.FinancialRecord.update(formData.id, formData);
      } else {
        await base44.entities.FinancialRecord.create({
          client_id: client.id,
          client_name: `${client.first_name} ${client.last_name}`,
          ...formData
        });
      }
      toast.success('Financial record saved');
      setShowForm(false);
      loadRecords();
    } catch (error) {
      toast.error('Failed to save record');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Financial Records</h3>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? 'Cancel' : 'New Record'}
        </Button>
      </div>

      {showForm && (
        <FinancialRecordForm
          client={client}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          onUpload={handleUpload}
          uploading={uploading}
        />
      )}

      <div className="grid gap-4">
        {records.map(record => (
          <Card key={record.id}>
            <CardHeader>
              <CardTitle className="text-base">{record.record_type.replace(/_/g, ' ')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Amount</Label>
                  <div className="font-semibold">${record.total?.toFixed(2)}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Date</Label>
                  <div>{record.date}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Vendor</Label>
                  <div>{record.vendor}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Registration</Label>
                  <Badge>{record.registration_status}</Badge>
                </div>
              </div>
              {record.description && (
                <div className="mt-3 text-sm text-muted-foreground">{record.description}</div>
              )}
            </CardContent>
          </Card>
        ))}
        {records.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No financial records
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function FinancialRecordForm({ client, onSave, onCancel, onUpload, uploading }) {
  const [formData, setFormData] = useState({
    record_type: 'exposure_course',
    amount: '',
    tax: '',
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    description: '',
    registration_status: 'not_registered',
    completion_status: 'not_started',
    receipt_urls: [],
    completion_record_urls: []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const total = parseFloat(formData.amount || 0) + parseFloat(formData.tax || 0);
    onSave({ ...formData, total });
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const url = await onUpload(file);
      if (url) {
        setFormData(prev => ({
          ...prev,
          [field]: [...(prev[field] || []), url]
        }));
      }
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>New Financial Record</CardTitle></CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Record Type</Label>
              <Select value={formData.record_type} onValueChange={(v) => setFormData({ ...formData, record_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RECORD_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div>
              <Label>Tax</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.tax}
                onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
              />
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <Label>Vendor</Label>
              <Input
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              />
            </div>
            <div>
              <Label>Registration Status</Label>
              <Select value={formData.registration_status} onValueChange={(v) => setFormData({ ...formData, registration_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REGISTRATION_STATUS.map(status => (
                    <SelectItem key={status} value={status}>{status.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Receipts</Label>
              <Input type="file" onChange={(e) => handleFileUpload(e, 'receipt_urls')} disabled={uploading} />
              {formData.receipt_urls?.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1">{formData.receipt_urls.length} file(s) uploaded</div>
              )}
            </div>
            <div>
              <Label>Completion Records</Label>
              <Input type="file" onChange={(e) => handleFileUpload(e, 'completion_record_urls')} disabled={uploading} />
              {formData.completion_record_urls?.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1">{formData.completion_record_urls.length} file(s) uploaded</div>
              )}
            </div>
          </div>
        </CardContent>
        <div className="p-6 pt-0 flex gap-2">
          <Button type="submit">Save</Button>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}