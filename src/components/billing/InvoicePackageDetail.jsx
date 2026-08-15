import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ArrowLeft, Pencil, Save, X, Upload, FileText, Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SupportingDocuments from './SupportingDocuments';
import ChildmindingBillingSheet from './ChildmindingBillingSheet';
import WorkExposurePlacementsTab from './WorkExposurePlacementsTab';
import PackageContents from './PackageContents';
import { parseBillingMonth } from './billingMonth';

const NOTE_TYPES = [
  { value: 'invoice_adjustment', label: 'Invoice Adjustment', badge: 'bg-amber-100 text-amber-800' },
  { value: 'general', label: 'General', badge: 'bg-slate-100 text-slate-700' },
  { value: 'reminder', label: 'Reminder', badge: 'bg-blue-100 text-blue-700' },
  { value: 'follow_up', label: 'Follow-up', badge: 'bg-purple-100 text-purple-700' },
];

export default function InvoicePackageDetail({ pkg, configs, onBack }) {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(pkg.notes || '');
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [noteEntries, setNoteEntries] = useState(pkg.note_entries || []);
  const [newNoteType, setNewNoteType] = useState('invoice_adjustment');
  const [newNoteText, setNewNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);

  const persistNotes = async (entries) => {
    setSavingNote(true);
    try {
      await base44.entities.InvoicePackage.update(pkg.id, { note_entries: entries });
      setNoteEntries(entries);
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
  };

  const handleSaveNotes = async () => {
    try {
      await base44.entities.InvoicePackage.update(pkg.id, { notes });
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
            {format(parseBillingMonth(pkg.billing_month), 'MMMM yyyy')} Billing Package
          </p>
        </div>
        <Badge
          variant={pkg.status === 'approved' ? 'outline' : 'default'}
          className="ml-auto"
        >
          {pkg.status.replace('_', ' ')}
        </Badge>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
          <TabsTrigger value="placements">Work Exposure Placements</TabsTrigger>
          <TabsTrigger value="childminding">Childminding</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
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
                {config && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Configuration:</span>
                    <span className="font-medium">{config.config_name}</span>
                  </div>
                )}
              </CardContent>
            </Card>

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
                      return (
                        <div key={idx} className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.badge}`}>{t.label}</span>
                            <button onClick={() => deleteNote(idx)} className="text-slate-400 hover:text-red-500 text-xs">
                              Remove
                            </button>
                          </div>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{n.text}</p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {n.created_by_name ? `${n.created_by_name} · ` : ''}
                            {n.created_date ? format(new Date(n.created_date), 'MMM d, yyyy') : ''}
                          </p>
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

          <PackageContents pkg={pkg} />

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
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pkg.invoice_id ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <h3 className="text-lg font-semibold text-slate-700">
                    Invoice has been generated for this package
                  </h3>
                  <p className="text-sm text-slate-600 mt-2">
                    Invoice ID: <span className="font-mono font-medium">{pkg.invoice_id}</span>
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-lg font-semibold text-slate-700">
                    No invoice generated yet
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 mb-4">
                    Generate an invoice for this billing package
                  </p>
                  <Button>
                    Generate Invoice
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="placements" className="space-y-4">
          <WorkExposurePlacementsTab billingMonth={pkg.billing_month} />
        </TabsContent>

        <TabsContent value="childminding" className="space-y-4">
          <ChildmindingBillingSheet billingMonth={pkg.billing_month} />
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <SupportingDocuments billingMonth={pkg.billing_month} />
        </TabsContent>
      </Tabs>
    </div>
  );
}