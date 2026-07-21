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

export default function PathwaysAssessment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assessmentNotes, setAssessmentNotes] = useState('');
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    base44.entities.Client.get(id).then(c => {
      setClient(c);
      setAssessmentNotes(c.intake_notes || '');
      setLoading(false);
    }).catch(() => setLoading(false));
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
    setCompleting(true);
    try {
      await base44.entities.Client.update(id, {
        status: 'pending',
        intake_notes: assessmentNotes,
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
            <BarrierIdentificationTool client={client} onSave={handleSave} />

            {/* Eligibility Determination */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Eligibility Determination</h2>
                <p className="text-sm text-slate-500 mt-1">
                  After completing the Barrier Identification Tool, record your assessment notes and eligibility determination below.
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