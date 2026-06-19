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
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, Video, PenLine, ClipboardList, Trash2, Upload, Users, CheckCircle, Clock, AlertCircle, ShieldCheck } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { format } from 'date-fns';

const TYPE_ICONS = {
  acknowledge: ClipboardList,
  'e-sign': PenLine,
  'fill-out-form': FileText,
  'watch-video': Video,
};
const TYPE_LABELS = {
  acknowledge: 'Read & Acknowledge',
  'e-sign': 'E-Sign',
  'fill-out-form': 'Fill Out Form',
  'watch-video': 'Watch Video',
};

const EMPTY_FORM = { title: '', description: '', completion_type: 'acknowledge', file_url: '', is_required: true, sort_order: 0, is_active: true };

export default function NexusOnboarding() {
  const [tab, setTab] = useState('templates');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['onboarding-templates'],
    queryFn: () => base44.entities.OnboardingTemplate.list('sort_order'),
  });

  const { data: records = [] } = useQuery({
    queryKey: ['onboarding-records'],
    queryFn: () => base44.entities.OnboardingRecord.list('-completed_date'),
  });

  const { data: ndaSignatures = [] } = useQuery({
    queryKey: ['nda-signatures'],
    queryFn: () => base44.entities.NDASignature.list('-signed_date'),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list('-hire_date', 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.OnboardingTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-templates'] });
      setShowForm(false);
      setForm(EMPTY_FORM);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.OnboardingTemplate.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['onboarding-templates'] }),
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, file_url }));
    setUploading(false);
  };

  // Group records by employee for the tracker
  const employeeProgress = employees.map(emp => {
    const empRecords = records.filter(r => r.employee_id === emp.id);
    const ndaSigned = ndaSignatures.some(n => n.employee_id === emp.id);
    const completedCount = empRecords.filter(r => r.status === 'completed').length;
    const requiredTemplates = templates.filter(t => t.is_required && t.is_active);
    const requiredCompleted = requiredTemplates.filter(t => empRecords.find(r => r.template_id === t.id && r.status === 'completed')).length;
    return { emp, ndaSigned, completedCount, requiredCompleted, totalRequired: requiredTemplates.length, empRecords };
  }).filter(e => e.emp.hire_date || e.ndaSigned || e.completedCount > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboarding Manager"
        description="Manage onboarding templates and track employee completion"
        actions={
          tab === 'templates' && (
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" /> Add Template
            </Button>
          )
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="tracker">Employee Tracker</TabsTrigger>
          <TabsTrigger value="nda">NDA Signatures</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4 mt-4">
          {templates.length === 0 ? (
            <EmptyState icon={FileText} title="No onboarding templates" description="Create your first onboarding step for new employees." />
          ) : (
            <div className="space-y-3">
              {templates.map((t, i) => {
                const Icon = TYPE_ICONS[t.completion_type] || FileText;
                return (
                  <Card key={t.id}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-blue-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">{t.title}</p>
                          {t.is_required && <span className="text-xs bg-red-100 text-red-700 rounded px-1.5 py-0.5">Required</span>}
                          {!t.is_active && <span className="text-xs bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">Inactive</span>}
                        </div>
                        <p className="text-xs text-gray-500">{TYPE_LABELS[t.completion_type]} · Order #{t.sort_order ?? i + 1}</p>
                        {t.description && <p className="text-sm text-gray-600 mt-0.5 truncate">{t.description}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {t.file_url && (
                          <a href={t.file_url} target="_blank" rel="noreferrer">
                            <Button size="sm" variant="outline">View</Button>
                          </a>
                        )}
                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => deleteMutation.mutate(t.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Employee Tracker Tab */}
        <TabsContent value="tracker" className="mt-4">
          {employeeProgress.length === 0 ? (
            <EmptyState icon={Users} title="No onboarding activity yet" description="Employee progress will appear here once they log in." />
          ) : (
            <div className="space-y-3">
              {employeeProgress.map(({ emp, ndaSigned, completedCount, requiredCompleted, totalRequired, empRecords }) => {
                const allDone = requiredCompleted >= totalRequired && ndaSigned;
                const pct = totalRequired > 0 ? Math.round((requiredCompleted / totalRequired) * 100) : 100;
                return (
                  <Card key={emp.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${allDone ? 'bg-green-100' : 'bg-amber-100'}`}>
                            {allDone ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Clock className="w-4 h-4 text-amber-600" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm">{emp.first_name} {emp.last_name}</p>
                            <p className="text-xs text-gray-500">{emp.position}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0 text-right">
                          <div className="text-xs">
                            <div className={`font-medium flex items-center gap-1 ${ndaSigned ? 'text-green-600' : 'text-red-500'}`}>
                              <ShieldCheck className="w-3 h-3" /> NDA {ndaSigned ? 'Signed' : 'Pending'}
                            </div>
                            <div className="text-gray-500">{requiredCompleted}/{totalRequired} required steps</div>
                          </div>
                          <div className="w-16 h-2 rounded-full bg-gray-200">
                            <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-gray-700 w-10 text-right">{pct}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* NDA Signatures Tab */}
        <TabsContent value="nda" className="mt-4">
          {ndaSignatures.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="No NDA signatures yet" description="Signatures will appear here after employees complete the confidentiality agreement." />
          ) : (
            <div className="space-y-3">
              {ndaSignatures.map(sig => {
                const emp = employees.find(e => e.id === sig.employee_id);
                return (
                  <Card key={sig.id}>
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm">{sig.signed_name}</p>
                          {emp && <p className="text-xs text-gray-500">{emp.position}</p>}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 flex-shrink-0">
                        {sig.signed_date ? format(new Date(sig.signed_date), 'MMM d, yyyy h:mm a') : '—'}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Template Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Onboarding Template</DialogTitle></DialogHeader>
          <form
            onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }}
            className="space-y-4"
          >
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Employee Handbook" required />
            </div>
            <div className="space-y-1">
              <Label>Completion Type *</Label>
              <Select value={form.completion_type} onValueChange={v => setForm(f => ({ ...f, completion_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="acknowledge">Read & Acknowledge</SelectItem>
                  <SelectItem value="e-sign">E-Sign</SelectItem>
                  <SelectItem value="fill-out-form">Fill Out Form</SelectItem>
                  <SelectItem value="watch-video">Watch Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief instructions for the employee" rows={3} />
            </div>
            <div className="space-y-1">
              <Label>Upload Document / Video</Label>
              <Input type="file" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.png,.jpg,.mp4,.mov,.webm" />
              {uploading && <p className="text-xs text-blue-600">Uploading...</p>}
              {form.file_url && !uploading && <p className="text-xs text-green-600">✓ File uploaded</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Sort Order</Label>
                <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} min={0} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox id="is_required" checked={form.is_required} onCheckedChange={v => setForm(f => ({ ...f, is_required: v }))} />
              <label htmlFor="is_required" className="text-sm text-gray-700 cursor-pointer">Required for all new employees</label>
            </div>
            <Button type="submit" disabled={createMutation.isPending || uploading} className="w-full">
              {createMutation.isPending ? 'Saving...' : 'Add Template'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}