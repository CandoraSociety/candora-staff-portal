import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Save, X, Upload, FileText, Plus, Loader2, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import SupportingDocuments from './SupportingDocuments';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'ready_for_review', label: 'Finalized' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid' },
  { value: 'rejected', label: 'Rejected' },
];
const STATUS_LABEL = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, s.label]));
import ChildmindingBillingSheet from './ChildmindingBillingSheet';
import WorkExposurePlacementsTab from './WorkExposurePlacementsTab';
import PackageContents from './PackageContents';
import ManualAdjustmentsTab from './ManualAdjustmentsTab';
import PackageInvoiceTab from './PackageInvoiceTab';
import { parseBillingMonth } from './billingMonth';

const NOTE_TYPES = [
  { value: 'invoice_adjustment', label: 'Invoice Adjustment', badge: 'bg-amber-100 text-amber-800' },
  { value: 'general', label: 'General', badge: 'bg-slate-100 text-slate-700' },
  { value: 'reminder', label: 'Reminder', badge: 'bg-blue-100 text-blue-700' },
  { value: 'follow_up', label: 'Follow-up', badge: 'bg-purple-100 text-purple-700' },
];

export default function InvoicePackageDetail({ pkg, configs, onBack }) {
  const queryClient = useQueryClient();
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(pkg.notes || '');
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [noteEntries, setNoteEntries] = useState(pkg.note_entries || []);
  const [newNoteType, setNewNoteType] = useState('invoice_adjustment');
  const [newNoteText, setNewNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editType, setEditType] = useState('invoice_adjustment');
  const [editText, setEditText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [status, setStatus] = useState(pkg.status);
  const [statusPending, setStatusPending] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletePin, setDeletePin] = useState('');
  // Submitted/approved/paid packages are locked — deleting them requires the 5011 pin.
  const locked = pkg.status === 'submitted' || pkg.status === 'approved' || pkg.status === 'paid';
  const [statusChangeOpen, setStatusChangeOpen] = useState(false);
  const [statusChangeTarget, setStatusChangeTarget] = useState(null);
  const [statusChangePin, setStatusChangePin] = useState('');
  // Moving a package to "submitted" requires uploading the SAP Ariba
  // submission confirmation document first.
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitUrl, setSubmitUrl] = useState(null);
  const [submitFileName, setSubmitFileName] = useState('');
  const [submitUploading, setSubmitUploading] = useState(false);
  const [submitPending, setSubmitPending] = useState(false);
  const submitInputRef = useRef(null);
  // Rejecting a package requires a reason; locked packages also need the 5011 pin.
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectPin, setRejectPin] = useState('');
  const [rejectPending, setRejectPending] = useState(false);

  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);

  const handleStatusChange = async (val) => {
    // Moving to Submitted requires the SAP Ariba submission confirmation upload.
    if (val === 'submitted' && pkg.status !== 'submitted') {
      setSubmitUrl(null);
      setSubmitFileName('');
      setStatusChangeTarget('submitted');
      setSubmitOpen(true);
      return;
    }
    // Moving to Rejected requires a reason (and the pin when the package is locked).
    if (val === 'rejected' && pkg.status !== 'rejected') {
      setStatusChangeTarget('rejected');
      setRejectReason('');
      setRejectPin('');
      setRejectOpen(true);
      return;
    }
    // Changing status away from a locked (submitted/approved) state requires the 5011 pin.
    if (locked && val !== pkg.status) {
      setStatusChangeTarget(val);
      setStatusChangePin('');
      setStatusChangeOpen(true);
      return;
    }
    const prev = status;
    setStatus(val);
    setStatusPending(true);
    try {
      await base44.entities.InvoicePackage.update(pkg.id, { status: val });
      queryClient.invalidateQueries({ queryKey: ['invoice-packages'] });
      toast.success('Package status updated');
    } catch (e) {
      setStatus(prev);
      toast.error('Could not update status: ' + (e.message || ''));
    } finally {
      setStatusPending(false);
    }
  };

  const confirmStatusChange = async () => {
    if (statusChangePin !== '5011') {
      toast.error('Incorrect pin — changing a submitted/approved package requires the 5011 pin.');
      return;
    }
    const val = statusChangeTarget;
    const prev = status;
    setStatus(val);
    setStatusChangeOpen(false);
    setStatusChangePin('');
    setStatusPending(true);
    try {
      await base44.entities.InvoicePackage.update(pkg.id, { status: val });
      queryClient.invalidateQueries({ queryKey: ['invoice-packages'] });
      toast.success('Package status updated');
    } catch (e) {
      setStatus(prev);
      toast.error('Could not update status: ' + (e.message || ''));
    } finally {
      setStatusPending(false);
    }
  };

  const handleSubmissionFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubmitUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setSubmitUrl(res.file_url);
      setSubmitFileName(file.name);
    } catch (err) {
      toast.error('Upload failed: ' + (err?.message || 'error'));
    } finally {
      setSubmitUploading(false);
      if (submitInputRef.current) submitInputRef.current.value = '';
    }
  };

  const confirmSubmit = async () => {
    if (!submitUrl) {
      toast.error('Upload the SAP Ariba submission confirmation document to continue.');
      return;
    }
    setSubmitPending(true);
    try {
      await base44.entities.InvoicePackage.update(pkg.id, {
        status: 'submitted',
        ariba_submission_url: submitUrl,
        ariba_submission_name: submitFileName,
        ariba_submission_date: new Date().toISOString().slice(0, 10),
        ariba_submission_by_name: currentUser?.full_name || pkg.prepared_by_name || '',
      });
      setStatus('submitted');
      queryClient.invalidateQueries({ queryKey: ['invoice-packages'] });
      toast.success('Package marked Submitted');
      setSubmitOpen(false);
      setSubmitUrl(null);
      setSubmitFileName('');
    } catch (e) {
      toast.error('Could not update status: ' + (e.message || ''));
    } finally {
      setSubmitPending(false);
    }
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please enter a reason for rejection.');
      return;
    }
    if (locked && rejectPin !== '5011') {
      toast.error('Incorrect pin — rejecting a locked package requires the 5011 pin.');
      return;
    }
    setRejectPending(true);
    try {
      await base44.entities.InvoicePackage.update(pkg.id, {
        status: 'rejected',
        rejected_reason: rejectReason.trim(),
        rejected_by_name: currentUser?.full_name || pkg.prepared_by_name || '',
        rejected_date: new Date().toISOString().slice(0, 10),
      });
      setStatus('rejected');
      setRejectOpen(false);
      setRejectReason('');
      setRejectPin('');
      queryClient.invalidateQueries({ queryKey: ['invoice-packages'] });
      toast.success('Package marked Rejected');
    } catch (e) {
      toast.error('Could not update status: ' + (e.message || ''));
    } finally {
      setRejectPending(false);
    }
  };

  const handleDelete = async () => {
    if (locked && deletePin !== '5011') {
      toast.error('Incorrect pin — submitted packages require the 5011 pin to delete.');
      return;
    }
    setDeleting(true);
    try {
      await base44.entities.InvoicePackage.delete(pkg.id);
      queryClient.invalidateQueries({ queryKey: ['invoice-packages'] });
      toast.success('Invoice package deleted');
      setDeleteOpen(false);
      setDeletePin('');
      onBack();
    } catch (e) {
      toast.error('Could not delete package: ' + (e.message || ''));
      setDeleting(false);
    }
  };

  const persistNotes = async (entries) => {
    setSavingNote(true);
    try {
      await base44.entities.InvoicePackage.update(pkg.id, { note_entries: entries });
      setNoteEntries(entries);
      queryClient.invalidateQueries({ queryKey: ['invoice-packages'] });
    } catch {
      toast.error('Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  const addNote = async () => {
    if (!newNoteText.trim()) return;
    const entry = {
      type: newNoteType,
      text: newNoteText.trim(),
      created_by_name: currentUser?.full_name || pkg.prepared_by_name || '',
      created_date: new Date().toISOString().slice(0, 10),
    };
    await persistNotes([...noteEntries, entry]);
    setNewNoteText('');
    toast.success('Note added');
  };

  const deleteNote = async (idx) => {
    await persistNotes(noteEntries.filter((_, i) => i !== idx));
    if (editingIdx === idx) setEditingIdx(null);
  };

  const startEditNote = (idx) => {
    setEditingIdx(idx);
    setEditType(noteEntries[idx]?.type || 'general');
    setEditText(noteEntries[idx]?.text || '');
  };

  const saveEditNote = async () => {
    if (editingIdx == null || !editText.trim()) return;
    const next = noteEntries.map((n, i) =>
      i === editingIdx ? { ...n, type: editType, text: editText.trim() } : n
    );
    await persistNotes(next);
    setEditingIdx(null);
    toast.success('Note updated');
  };

  const handleSaveNotes = async () => {
    try {
      await base44.entities.InvoicePackage.update(pkg.id, { notes });
      queryClient.invalidateQueries({ queryKey: ['invoice-packages'] });
      toast.success('Notes updated');
      setIsEditingNotes(false);
    } catch (error) {
      toast.error('Failed to update notes');
    }
  };

  const config = configs.find(c => c.id === pkg.config_id);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">{pkg.package_number}</h2>
          <p className="text-sm text-slate-600">
            {pkg.billing_month_end && pkg.billing_month_end !== pkg.billing_month
              ? `${format(parseBillingMonth(pkg.billing_month), 'MMM yyyy')} – ${format(parseBillingMonth(pkg.billing_month_end), 'MMM yyyy')} Billing Package`
              : `${format(parseBillingMonth(pkg.billing_month), 'MMMM yyyy')} Billing Package`}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Select value={status} onValueChange={handleStatusChange} disabled={statusPending}>
            <SelectTrigger className="w-[170px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {pkg.ariba_submission_url && (
            <Button asChild variant="outline" size="sm" title={pkg.ariba_submission_name || 'Ariba submission confirmation'}>
              <a href={pkg.ariba_submission_url} target="_blank" rel="noopener noreferrer" download={pkg.ariba_submission_name || undefined}>
                <Download className="h-4 w-4 mr-1" /> Ariba confirmation
              </a>
            </Button>
          )}
          {!locked && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
          <TabsTrigger value="placements">Work Exposure Placements</TabsTrigger>
          <TabsTrigger value="childminding">Childminding</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Package Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Prepared by:</span>
                  <span className="font-medium">{pkg.prepared_by_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Prepared date:</span>
                  <span className="font-medium">{format(new Date(pkg.prepared_date), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">CRT included:</span>
                  <span className="font-medium">{pkg.crt_included ? 'Yes' : 'No'}</span>
                </div>
                {pkg.ariba_submission_url && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 shrink-0">Ariba confirmation:</span>
                    <a
                      href={pkg.ariba_submission_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline truncate inline-flex items-center gap-1"
                      title={pkg.ariba_submission_name}
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      {pkg.ariba_submission_name || 'Submission confirmation'}
                    </a>
                  </div>
                )}
                {config && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Configuration:</span>
                    <span className="font-medium">{config.config_name}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {pkg.status === 'rejected' && (
              <Card className="border-red-200 bg-red-50/40">
                <CardHeader>
                  <CardTitle className="text-base text-red-700">Rejection Reason</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p className="text-slate-700 whitespace-pre-wrap">{pkg.rejected_reason || 'No reason recorded.'}</p>
                  <p className="text-[11px] text-slate-400 pt-1">
                    {pkg.rejected_by_name ? `${pkg.rejected_by_name} · ` : ''}
                    {pkg.rejected_date ? format(new Date(pkg.rejected_date), 'MMM d, yyyy') : ''}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">General Note</span>
                    {!isEditingNotes && (
                      <Button variant="ghost" size="icon" onClick={() => setIsEditingNotes(true)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {isEditingNotes ? (
                    <div className="space-y-2">
                      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveNotes}>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setNotes(pkg.notes || '');
                            setIsEditingNotes(false);
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">
                      {pkg.notes || <span className="italic text-slate-400">No general note</span>}
                    </p>
                  )}
                </div>

                <div className="border-t pt-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Categorized Notes</span>
                  <div className="space-y-2 mt-2">
                    {noteEntries.length === 0 && (
                      <p className="text-sm text-slate-400 italic">No categorized notes yet</p>
                    )}
                    {noteEntries.map((n, idx) => {
                      const t = NOTE_TYPES.find(t => t.value === n.type) || NOTE_TYPES[1];
                      const isEditing = editingIdx === idx;
                      return (
                        <div key={idx} className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
                          {isEditing ? (
                            <div className="space-y-2">
                              <Select value={editType} onValueChange={setEditType}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {NOTE_TYPES.map(t => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} autoFocus />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={saveEditNote} disabled={savingNote || !editText.trim()}>
                                  {savingNote ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingIdx(null)}>
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.badge}`}>{t.label}</span>
                                <div className="flex items-center gap-3">
                                  <button onClick={() => startEditNote(idx)} className="text-slate-400 hover:text-accent text-xs">
                                    Edit
                                  </button>
                                  <button onClick={() => deleteNote(idx)} className="text-slate-400 hover:text-red-500 text-xs">
                                    Remove
                                  </button>
                                </div>
                              </div>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap">{n.text}</p>
                              <p className="text-[11px] text-slate-400 mt-1">
                                {n.created_by_name ? `${n.created_by_name} · ` : ''}
                                {n.created_date ? format(new Date(n.created_date), 'MMM d, yyyy') : ''}
                              </p>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 space-y-2">
                    <Select value={newNoteType} onValueChange={setNewNoteType}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NOTE_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      rows={3}
                      placeholder={newNoteType === 'invoice_adjustment'
                        ? 'Instructions to manually adjust the downloaded CRT and Invoice...'
                        : 'Add a note...'}
                    />
                    <Button size="sm" onClick={addNote} disabled={!newNoteText.trim() || savingNote}>
                      {savingNote ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                      Add Note
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <PackageContents pkg={pkg} onViewInvoice={() => setActiveSubTab('invoice')} />

          {/* Auto-Populated Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Auto-Populated Items</CardTitle>
            </CardHeader>
            <CardContent>
              {pkg.auto_populated_items?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left py-2 px-3">Category</th>
                        <th className="text-left py-2 px-3">Client</th>
                        <th className="text-left py-2 px-3">Description</th>
                        <th className="text-right py-2 px-3">Amount</th>
                        <th className="text-center py-2 px-3">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pkg.auto_populated_items.map((item, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="py-2 px-3 capitalize">
                            {item.category?.replace('_', ' ')}
                          </td>
                          <td className="py-2 px-3 font-medium">{item.client_name}</td>
                          <td className="py-2 px-3">{item.description}</td>
                          <td className="text-right py-2 px-3 font-bold">
                            ${item.amount?.toFixed(2) || '0.00'}
                          </td>
                          <td className="text-center py-2 px-3">
                            {item.receipt_uploaded ? (
                              <Badge variant="outline" className="text-green-600">
                                ✓ Uploaded
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600">
                                Required
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">
                  No auto-populated items for this month
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoice" className="space-y-4">
          <PackageInvoiceTab pkg={pkg} />
        </TabsContent>

        <TabsContent value="placements" className="space-y-4">
          <WorkExposurePlacementsTab
            billingMonth={pkg.billing_month}
            billingMonthEnd={pkg.billing_month_end && pkg.billing_month_end !== pkg.billing_month ? pkg.billing_month_end : null}
          />
        </TabsContent>

        <TabsContent value="childminding" className="space-y-4">
          <ChildmindingBillingSheet
            billingMonth={pkg.billing_month}
            billingMonthEnd={pkg.billing_month_end && pkg.billing_month_end !== pkg.billing_month ? pkg.billing_month_end : null}
          />
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <SupportingDocuments billingMonth={pkg.billing_month} />
        </TabsContent>

        <TabsContent value="adjustments" className="space-y-4">
          <ManualAdjustmentsTab pkg={pkg} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteOpen} onOpenChange={(o) => { setDeleteOpen(o); if (!o) setDeletePin(''); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this invoice package?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  This permanently deletes <span className="font-semibold">{pkg.package_number}</span> and cannot be undone.
                </p>
                {locked && (
                  <div className="pt-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      This package is <span className="capitalize font-semibold">{STATUS_LABEL[pkg.status]}</span> — enter the 5011 pin to confirm deletion
                    </label>
                    <Input
                      type="password"
                      inputMode="numeric"
                      value={deletePin}
                      onChange={(e) => setDeletePin(e.target.value)}
                      placeholder="Pin"
                      className="text-sm"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} onClick={() => setDeletePin('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting || (locked && deletePin !== '5011')}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete package
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status change away from submitted/approved — requires the 5011 pin */}
      <AlertDialog open={statusChangeOpen} onOpenChange={(o) => { setStatusChangeOpen(o); if (!o) { setStatusChangePin(''); setStatusChangeTarget(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change status of {STATUS_LABEL[pkg.status]} package?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  This package is currently <span className="font-semibold capitalize">{STATUS_LABEL[pkg.status]}</span>. Changing it to{' '}
                  <span className="font-semibold capitalize">{STATUS_LABEL[statusChangeTarget]}</span> requires the 5011 pin.
                </p>
                <div className="pt-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Enter pin to confirm</label>
                  <Input
                    type="password"
                    inputMode="numeric"
                    value={statusChangePin}
                    onChange={(e) => setStatusChangePin(e.target.value)}
                    placeholder="Pin"
                    className="text-sm"
                    autoFocus
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={statusPending} onClick={() => { setStatusChangePin(''); setStatusChangeTarget(null); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmStatusChange(); }}
              disabled={statusPending || statusChangePin !== '5011'}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {statusPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirm change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark as Submitted — requires the SAP Ariba submission confirmation upload */}
      <AlertDialog open={submitOpen} onOpenChange={(o) => { setSubmitOpen(o); if (!o) { setSubmitUrl(null); setSubmitFileName(''); setStatusChangeTarget(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark {pkg.package_number} as Submitted?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Upload the <span className="font-semibold">SAP Ariba submission confirmation</span> document
                  to confirm this package was submitted to Ariba.
                </p>
                <input ref={submitInputRef} type="file" className="hidden" onChange={handleSubmissionFile} />
                {submitUrl ? (
                  <div className="rounded-md border border-green-200 bg-green-50 p-2.5 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-700 shrink-0" />
                    <span className="text-sm text-green-800 truncate">{submitFileName || 'Document uploaded'}</span>
                    <button
                      type="button"
                      onClick={() => { setSubmitUrl(null); setSubmitFileName(''); }}
                      className="ml-auto text-slate-400 hover:text-red-500 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={submitUploading}
                    onClick={() => submitInputRef.current?.click()}
                  >
                    {submitUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    {submitUploading ? 'Uploading…' : 'Upload Ariba confirmation'}
                  </Button>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitPending} onClick={() => { setSubmitUrl(null); setSubmitFileName(''); setStatusChangeTarget(null); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmSubmit(); }}
              disabled={submitPending || !submitUrl}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {submitPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirm submission
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark as Rejected — requires a reason (and the pin when the package is locked) */}
      <AlertDialog open={rejectOpen} onOpenChange={(o) => { setRejectOpen(o); if (!o) { setRejectReason(''); setRejectPin(''); setStatusChangeTarget(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark {pkg.package_number} as Rejected?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Record a reason for rejecting this invoice package. The package will move into the
                  Rejected section of the packages list.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Reason for rejection</label>
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={4}
                    placeholder="Explain why this package is being rejected..."
                    autoFocus
                  />
                </div>
                {locked && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      This package is <span className="capitalize font-semibold">{STATUS_LABEL[pkg.status]}</span> — enter the 5011 pin to confirm
                    </label>
                    <Input
                      type="password"
                      inputMode="numeric"
                      value={rejectPin}
                      onChange={(e) => setRejectPin(e.target.value)}
                      placeholder="Pin"
                      className="text-sm"
                    />
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rejectPending} onClick={() => { setRejectReason(''); setRejectPin(''); setStatusChangeTarget(null); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmReject(); }}
              disabled={rejectPending || !rejectReason.trim() || (locked && rejectPin !== '5011')}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {rejectPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Reject package
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}