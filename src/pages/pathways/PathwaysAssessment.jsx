import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, CheckCircle2, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';
import IntakeForm from '@/components/intake/IntakeForm';
import BarrierIdentificationTool from '@/components/wizard/BarrierIdentificationTool';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createCompassTask, taskBitEraCompleted } from '@/lib/compassTasks';

export default function PathwaysAssessment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assessmentNotes, setAssessmentNotes] = useState('');
  const [completing, setCompleting] = useState(false);
  const [navigatorStaff, setNavigatorStaff] = useState([]);
  const [needsBarrierRemoval, setNeedsBarrierRemoval] = useState('');
  const [selectedNavigator, setSelectedNavigator] = useState('');

  useEffect(() => {
    const load = async () => {
      const [c, staff] = await Promise.all([
        base44.entities.Client.get(id),
        base44.entities.PathwaysStaff.filter({ role: 'service_navigator', is_active: true }, 'name'),
      ]);
      setClient(c);
      setAssessmentNotes(c.intake_notes || '');
      setNavigatorStaff(staff);
      setNeedsBarrierRemoval(c.assigned_service_navigator ? 'yes' : '');
      setSelectedNavigator(staff.find(s => s.email === c.assigned_service_navigator)?.id || '');
      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, [id]);

  const handleSave = async (updates) => {
    const updated = await base44.entities.Client.update(id, updates);
    setClient(prev => ({ ...prev, ...updates }));
    return updated;
  };

  const handleSaveNotes = async () => {
    await base44.entities.Client.update(id, { intake_notes: assessmentNotes });
    toast.success('Notes saved');
  };

  const handleCompleteAssessment = async () => {
    if (needsBarrierRemoval === 'yes' && !selectedNavigator) {
      toast.error('Please select a service navigator for barrier removal');
      return;
    }
    setCompleting(true);
    try {
      const navigator = needsBarrierRemoval === 'yes'
        ? navigatorStaff.find(s => s.id === selectedNavigator)
        : null;
      const updatedClient = await base44.entities.Client.update(id, {
        status: 'pending',
        intake_notes: assessmentNotes,
        service_navigation_supports: needsBarrierRemoval === 'yes',
        assigned_service_navigator: navigator?.email || null,
        assigned_service_navigator_name: navigator?.name || null,
      });
      // Create Compass task for BIT & ERA completion
      const task = taskBitEraCompleted(updatedClient);
      await createCompassTask({
        client_id: id,
        client_name: `${updatedClient.first_name} ${updatedClient.last_name}`,
        compass_hsid: updatedClient.compass_hsid || '',
        assigned_worker: updatedClient.assigned_worker || '',
        assigned_worker_name: updatedClient.assigned_worker_name || '',
        ...task,
      });
      toast.success('Assessment completed — client is ready for assignment');
      navigate('/pathways/intake');
    } catch (err) {
      toast.error('Failed to complete assessment');
    }
    setCompleting(false);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
  if (!client) return <div className="p-8 text-center text-slate-500">Client not found</div>;

  const assessmentDone = client.status === 'pending' || client.status === 'active';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 px-6 py-2 flex items-center gap-3" style={{ background: 'hsl(231,64%,20%)' }}>
        <button onClick={() => navigate('/pathways')}>
          <img
            src="https://media.base44.com/images/public/6a0025bc2848937e9e70bca5/6df7c66b7_Candoracirclelogo_noanniversary.png"
            alt="Candora logo"
            className="h-7 w-7 object-contain rounded-full hover:opacity-80 transition-opacity"
          />
        </button>
        <button onClick={() => navigate('/pathways/intake')} className="text-sm text-white/90 hover:text-white font-semibold">
          Back to Intake
        </button>
      </div>

      {/* Header */}
      <div
        className="border-b px-6 py-4 flex items-center justify-between gap-4"
        style={{ background: 'hsl(44,100%,88%)', borderColor: 'hsl(42,100%,70%)' }}
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/pathways/intake')} style={{ color: 'hsl(231,64%,20%)' }}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold" style={{ color: 'hsl(231,64%,20%)' }}>
                {client.first_name} {client.last_name}
              </h1>
              {assessmentDone && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold border border-green-200">
                  Assessment Complete
                </span>
              )}
            </div>
            <p className="text-sm" style={{ color: 'hsl(231,55%,40%)' }}>
              {client.compass_hsid ? `HSID: ${client.compass_hsid}` : 'Service Navigator Assessment'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="p-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Client Overview</TabsTrigger>
            <TabsTrigger value="assessment">BIT / ERA Assessment</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <IntakeForm
              client={client}
              onSave={async (data) => { await handleSave(data); toast.success('Client overview saved'); return true; }}
              onCancel={() => navigate('/pathways/intake')}
            />
          </TabsContent>

          <TabsContent value="assessment" className="space-y-6">
            <BarrierIdentificationTool 
              client={client} 
              onSave={handleSave} 
              onComplete={() => document.getElementById('era-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            />

            {/* ERA — Employment Readiness Assessment */}
            <div id="era-section" className="bg-white rounded-lg border border-slate-200 p-6 space-y-4 scroll-mt-20">
              <div>
                <h2 className="text-lg font-bold text-slate-800">ERA — Employment Readiness Assessment</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Now that the BIT is complete, record your employment readiness assessment notes and eligibility determination below.
                </p>
              </div>
              <div>
                <Label className="mb-1 block text-sm font-medium text-slate-700">Assessment Notes &amp; Determination</Label>
                <Textarea
                  rows={5}
                  value={assessmentNotes}
                  onChange={e => setAssessmentNotes(e.target.value)}
                  placeholder="Record assessment findings, eligibility determination, language proficiency observations, and any recommendations..."
                />
                <Button variant="outline" size="sm" className="mt-2" onClick={handleSaveNotes}>
                  Save Notes
                </Button>
              </div>

              {/* Barrier Removal Determination */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div>
                  <Label className="mb-1 block text-sm font-medium text-slate-700">
                    Does this client need barriers addressed by a service navigator?
                  </Label>
                  <Select value={needsBarrierRemoval} onValueChange={v => { setNeedsBarrierRemoval(v); if (v !== 'yes') setSelectedNavigator(''); }}>
                    <SelectTrigger className="w-full max-w-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes — assign to a service navigator</SelectItem>
                      <SelectItem value="no">No — barriers do not require service navigator support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {needsBarrierRemoval === 'yes' && (
                  <div>
                    <Label className="mb-1 block text-sm font-medium text-slate-700">Assign to Service Navigator</Label>
                    <Select value={selectedNavigator} onValueChange={setSelectedNavigator}>
                      <SelectTrigger><SelectValue placeholder="Select service navigator..." /></SelectTrigger>
                      <SelectContent>
                        {navigatorStaff.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {navigatorStaff.length === 0 && (
                      <p className="text-sm text-amber-600 mt-1">No service navigators found. Add staff with role "Service Navigator" in the Master List.</p>
                    )}
                  </div>
                )}
              </div>

              {assessmentDone ? (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-lg px-4 py-3">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">
                    Assessment completed. This client is ready for assignment on the intake page.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Button onClick={handleCompleteAssessment} disabled={completing} className="gap-2">
                    <ClipboardCheck className="w-4 h-4" />
                    {completing ? 'Completing...' : 'Complete Assessment'}
                  </Button>
                  <span className="text-sm text-slate-400">
                    This will move the client to the "Assessment Complete" section for assignment.
                  </span>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}