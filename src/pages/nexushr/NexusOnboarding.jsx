import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, FileText, Upload, Mail, Eye } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { format } from 'date-fns';
import { useAuth } from '@/lib/AuthContext';

export default function NexusOnboarding() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [form, setForm] = useState({ title: '', document_type: 'orientation', description: '', file_url: '' });
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', message: '' });
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: documents = [] } = useQuery({ queryKey: ['onboarding-documents'], queryFn: () => base44.entities.OnboardingDocument.list('-created_date', 500) });
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list('-hire_date', 500) });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.OnboardingDocument.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-documents'] });
      setShowForm(false);
      setForm({ title: '', document_type: 'orientation', description: '', file_url: '' });
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm({ ...form, file_url });
  };

  const handleSendWelcome = (employee) => {
    const activeDocs = documents.filter(d => d.is_active);
    const docList = activeDocs.map((d, i) => `${i + 1}. ${d.title}`).join('\n');
    setEmailForm({
      to: employee.email,
      subject: `Welcome to the Team, ${employee.first_name}!`,
      message: `Dear ${employee.first_name},\n\nWelcome to our organization! We're excited to have you on board.\n\nPlease review and complete the following onboarding documents:\n\n${docList}\n\nIf you have any questions, please don't hesitate to reach out.\n\nBest regards,\nHR Team`,
    });
    setShowEmail(true);
  };

  const sendEmailMutation = useMutation({
    mutationFn: async (data) => {
      await base44.integrations.Core.SendEmail({ to: data.to, subject: data.subject, body: data.body, from_name: 'NexusHR' });
    },
    onSuccess: () => {
      setShowEmail(false);
      setEmailForm({ to: '', subject: '', message: '' });
    },
  });

  const filtered = documents.filter(doc =>
    doc.title?.toLowerCase().includes(search.toLowerCase()) ||
    doc.document_type?.toLowerCase().includes(search.toLowerCase())
  );

  const recentlyHired = employees
    .filter(e => e.hire_date && !e.termination_date)
    .sort((a, b) => new Date(b.hire_date) - new Date(a.hire_date))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboarding Documents"
        description="Manage new hire onboarding materials"
        actions={<Button onClick={() => setShowForm(true)} size="sm"><Plus className="w-4 h-4 mr-1" />Add Document</Button>}
      />

      {/* Recently Hired */}
      {recentlyHired.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="w-4 h-4" /> Recently Hired - Send Welcome Pack
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {recentlyHired.map(emp => (
                <div key={emp.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium">{emp.first_name} {emp.last_name}</p>
                    <p className="text-xs text-muted-foreground">{emp.position} • Hired {format(new Date(emp.hire_date), 'MMM d, yyyy')}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleSendWelcome(emp)}><Mail className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Documents Grid */}
      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No onboarding documents" description="Add your first onboarding document." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(doc => (
            <Card key={doc.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-semibold">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">{doc.document_type?.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  {doc.is_active && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                </div>
                <p className="text-sm text-muted-foreground mt-3">{doc.description}</p>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => window.open(doc.file_url, '_blank')}><Eye className="w-4 h-4" />View</Button>
                  <Button size="sm" variant="outline" onClick={() => handleSendWelcome({ first_name: 'New Hire', email: '' })}><Mail className="w-4 h-4" />Send</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Document Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent><DialogHeader><DialogTitle>Add Onboarding Document</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ ...form, is_active: true }); }} className="space-y-4">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Employee Handbook" required />
            </div>
            <div className="space-y-1">
              <Label>Document Type *</Label>
              <Select value={form.document_type} onValueChange={v => setForm({ ...form, document_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="orientation">Orientation</SelectItem>
                  <SelectItem value="waiver">Waiver</SelectItem>
                  <SelectItem value="code_of_conduct">Code of Conduct</SelectItem>
                  <SelectItem value="confidentiality">Confidentiality</SelectItem>
                  <SelectItem value="policy">Policy</SelectItem>
                  <SelectItem value="handbook">Handbook</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
            </div>
            <div className="space-y-1">
              <Label>File *</Label>
              <Input type="file" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.png,.jpg" />
              {form.file_url && <p className="text-xs text-green-600">✓ File uploaded</p>}
            </div>
            <Button type="submit" disabled={createMutation.isPending || !form.file_url} className="w-full">
              {createMutation.isPending ? 'Saving...' : 'Add Document'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={showEmail} onOpenChange={setShowEmail}>
        <DialogContent><DialogHeader><DialogTitle>Send Welcome Email</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); sendEmailMutation.mutate(emailForm); }} className="space-y-4">
            <div className="space-y-1">
              <Label>To Email *</Label>
              <Input type="email" value={emailForm.to} onChange={e => setEmailForm({ ...emailForm, to: e.target.value })} placeholder="employee@email.com" required />
            </div>
            <div className="space-y-1">
              <Label>Subject *</Label>
              <Input value={emailForm.subject} onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>Message *</Label>
              <Textarea value={emailForm.message} onChange={e => setEmailForm({ ...emailForm, message: e.target.value })} className="h-48" required />
            </div>
            <Button type="submit" disabled={sendEmailMutation.isPending} className="w-full">
              {sendEmailMutation.isPending ? 'Sending...' : 'Send Email'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}