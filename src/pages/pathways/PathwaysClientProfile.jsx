import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, History, RotateCcw, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { addDays, differenceInDays } from 'date-fns';
import ClientProfileOverview from '@/components/client/ClientProfileOverview';
import ClientReferrals from '@/components/client/ClientReferrals';
import ClientFinancials from '@/components/client/ClientFinancials';
import ClientEmployment from '@/components/client/ClientEmployment';
import ClientPlacements from '@/components/client/ClientPlacements';
import ClientAssessments from '@/components/client/ClientAssessments';
import ClientStreamSwitches from '@/components/client/ClientStreamSwitches';
import ClientStatusHistory from '@/components/client/ClientStatusHistory';
import CloseFileDialog from '@/components/client/CloseFileDialog';
import StatusChangeDialog from '@/components/client/StatusChangeDialog';
import DEAClosingDialog from '@/components/wizard/DEAClosingDialog';
import ProgramFlowWizard from '@/components/wizard/ProgramFlowWizard';
import ProgramDeterminationDialog from '@/components/wizard/ProgramDeterminationDialog';

const STREAM_LABELS = {
  direct_to_employment: 'DEA',
  pathways: 'Pathways',
  casual: 'Casual',
  external_referral: 'External Referral',
  internal_referral: 'Internal Referral',
  not_eligible: 'Not Eligible'
};

const STREAM_BADGE_COLORS = {
  direct_to_employment: 'bg-blue-100 text-blue-800 border-blue-200',
  pathways: 'bg-purple-100 text-purple-800 border-purple-200',
  casual: 'bg-green-100 text-green-800 border-green-200',
  external_referral: 'bg-orange-100 text-orange-800 border-orange-200',
  internal_referral: 'bg-pink-100 text-pink-800 border-pink-200',
  not_eligible: 'bg-gray-100 text-gray-800 border-gray-200'
};

export default function PathwaysClientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closingSaving, setClosingSaving] = useState(false);
  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false);
  const [statusHistoryKey, setStatusHistoryKey] = useState(0);
  const [showDEAClosing, setShowDEAClosing] = useState(false);
  const [showProgramDetermination, setShowProgramDetermination] = useState(false);

  useEffect(() => {
    base44.entities.Client.list().then(clients => {
      const found = clients.find(c => c.id === id);
      setClient(found || null);
      setLoading(false);
      
      // Show program determination prompt if client is assigned but has no service_type
      if (found && !found.service_type && found.assigned_worker && !found.file_closed) {
        setShowProgramDetermination(true);
      }

      // Check if DEA closing dialog should show
      if (found?.service_type === 'direct_to_employment' && !found?.file_closed && !found?.dea_closing_dismissed) {
        const endDate = found.completion_date
          ? new Date(found.completion_date)
          : found.service_start_date
            ? addDays(new Date(found.service_start_date), 14)
            : null;
        if (endDate) {
          const days = differenceInDays(endDate, new Date());
          if (days <= 3) setShowDEAClosing(true);
        }
      }
    });
  }, [id]);

  const handleSave = async (updates) => {
    const updated = await base44.entities.Client.update(id, updates);
    setClient(prev => ({ ...prev, ...updates }));
    return updated;
  };

  const handleCloseFile = async (closeData) => {
    setClosingSaving(true);
    try {
      await base44.entities.Client.update(id, closeData);
      await base44.entities.CompassTask.create({
        client_id: id,
        client_name: `${client.first_name} ${client.last_name}`,
        task_type: 'file_closed',
        title: `File Closed - ${client.first_name} ${client.last_name}`,
        instructions: `Reason: ${closeData.closed_reason}`,
        status: 'pending'
      });
      setClient({ ...client, ...closeData });
      toast.success('File closed');
    } catch (error) {
      toast.error('Failed to close file');
    } finally {
      setClosingSaving(false);
    }
  };

  const handleReopenFile = async () => {
    try {
      await base44.entities.Client.update(id, { file_closed: false, status: 'active' });
      setClient({ ...client, file_closed: false, status: 'active' });
      toast.success('File reopened');
    } catch (error) {
      toast.error('Failed to reopen file');
    }
  };

  const handleProgramDetermination = async (serviceType) => {
    await base44.entities.Client.update(id, { service_type: serviceType });
    setClient(prev => ({ ...prev, service_type: serviceType }));
    toast.success(serviceType === 'pathways' ? 'Set to WD (Workforce Development)' : 'Set to DEA (Direct Employment Attachment)');
  };

  const handleDEAContinue = async () => {
    try {
      await base44.entities.Client.update(id, { dea_closing_dismissed: true });
      setShowDEAClosing(false);
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleDEASwitchToPathways = async () => {
    try {
      const user = await base44.auth.me();
      const switchRecord = {
        from_stream: 'direct_to_employment',
        to_stream: 'pathways',
        reason: 'user_requested',
        date: new Date().toISOString().split('T')[0],
        notes: 'Switched from DEA to Pathways via closing dialog'
      };
      
      await base44.entities.Client.update(id, {
        service_type: 'pathways',
        dea_closing_dismissed: true,
        program_stream_switches: [...(client.program_stream_switches || []), switchRecord]
      });
      
      await base44.entities.StatusChange.create({
        client_id: id,
        client_name: `${client.first_name} ${client.last_name}`,
        change_type: 'stream_switch',
        change_date: new Date().toISOString().split('T')[0],
        from_value: 'direct_to_employment',
        to_value: 'pathways',
        notes: 'Switched from DEA to Pathways',
        logged_by: user.email,
        logged_by_name: user.full_name || user.email,
        billing_relevant: false
      });
      
      await base44.entities.CompassTask.create({
        client_id: id,
        client_name: `${client.first_name} ${client.last_name}`,
        task_type: 'stream_switch',
        title: `Stream Switch - ${client.first_name} ${client.last_name}`,
        instructions: 'Client switched from DEA to Pathways',
        status: 'pending'
      });
      
      setClient({ ...client, service_type: 'pathways', dea_closing_dismissed: true });
      setShowDEAClosing(false);
      toast.success('Switched to Pathways');
    } catch (error) {
      toast.error('Failed to switch streams');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!client) return <div className="p-8 text-center">Client not found</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 px-6 py-2 flex items-center gap-3" style={{ background: 'hsl(231,64%,20%)' }}>
        <button onClick={() => navigate('/')}>
          <img
            src="https://media.base44.com/images/public/6a0025bc2848937e9e70bca5/6df7c66b7_Candoracirclelogo_noanniversary.png"
            alt="Candora logo"
            className="h-7 w-7 object-contain rounded-full hover:opacity-80 transition-opacity"
          />
        </button>
        <button
          onClick={() => navigate('/pathways')}
          className="text-sm text-white/90 hover:text-white font-semibold"
        >
          Pathways Home
        </button>
        <span className="text-white/30">·</span>
        <button
          onClick={() => navigate('/pathways/master')}
          className="text-sm text-white/70 hover:text-white font-medium"
        >
          Master List
        </button>
        <span className="text-white/30">·</span>
        <button
          onClick={() => navigate('/pathways/dashboard')}
          className="text-sm text-white/70 hover:text-white font-medium"
        >
          My Dashboard
        </button>
        <span className="text-white/30">·</span>
        <button
          onClick={() => navigate('/pathways/intake')}
          className="text-sm text-white/70 hover:text-white font-medium"
        >
          Intake
        </button>
        <span className="text-white/30">·</span>
        <button
          onClick={() => navigate('/pathways/compass')}
          className="text-sm text-white/70 hover:text-white font-medium"
        >
          Compass
        </button>
      </div>

      {/* Main Header */}
      <div
        className="border-b px-6 py-4 flex items-center justify-between gap-4"
        style={{ background: 'hsl(44,100%,88%)', borderColor: 'hsl(42,100%,70%)' }}
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} style={{ color: 'hsl(231,64%,20%)' }}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold" style={{ color: 'hsl(231,64%,20%)' }}>
                {client.first_name} {client.last_name}
              </h1>
              {client.service_type && (
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${STREAM_BADGE_COLORS[client.service_type] || ''}`}>
                  {STREAM_LABELS[client.service_type] || client.service_type.replace(/_/g, ' ')}
                </span>
              )}
              {client.file_closed && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold border border-red-200">
                  Closed
                </span>
              )}
            </div>
            <p className="text-sm" style={{ color: 'hsl(231,55%,40%)' }}>
              {client.compass_hsid ? `HSID: ${client.compass_hsid}` : ''}
              {client.file_closed && client.closed_reason
                ? `${client.compass_hsid ? ' · ' : ''}Closed: ${client.closed_reason.replace(/_/g, ' ')}`
                : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowStatusChangeDialog(true)}>
            <History className="w-4 h-4 mr-2" />
            Log Status Change
          </Button>
          {client.file_closed ? (
            <Button variant="outline" size="sm" onClick={handleReopenFile}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reopen File
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowCloseDialog(true)}>
              <XCircle className="w-4 h-4 mr-2" />
              Close File
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="p-6">
        <Tabs defaultValue="program_flow" className="space-y-6">
          <TabsList className="mb-6 flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="program_flow">Program Flow</TabsTrigger>
            <TabsTrigger value="overview">Client Overview</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="placements">Placements</TabsTrigger>
            <TabsTrigger value="assessments">BIT / ERA</TabsTrigger>
            <TabsTrigger value="stream_switches" className="relative">
              Stream Switches
              {client.program_stream_switches?.length > 0 && (
                <span className="ml-1.5 bg-amber-400 text-amber-900 text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                  {client.program_stream_switches.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="status_history">Status History</TabsTrigger>
          </TabsList>

          <TabsContent value="program_flow">
            <ProgramFlowWizard
              client={client}
              onSave={handleSave}
              onClientUpdate={(updates) => setClient(prev => ({ ...prev, ...updates }))}
            />
          </TabsContent>

          <TabsContent value="overview">
            <ClientProfileOverview client={client} onSave={handleSave} />
          </TabsContent>

          <TabsContent value="referrals">
            <ClientReferrals client={client} onSave={handleSave} />
          </TabsContent>

          <TabsContent value="financials">
            <ClientFinancials client={client} />
          </TabsContent>

          <TabsContent value="employment">
            <ClientEmployment client={client} onSave={handleSave} />
          </TabsContent>

          <TabsContent value="placements">
            <ClientPlacements client={client} onSave={handleSave} />
          </TabsContent>

          <TabsContent value="assessments">
            <ClientAssessments client={client} onSave={handleSave} />
          </TabsContent>

          <TabsContent value="stream_switches">
            <ClientStreamSwitches client={client} onSave={handleSave} />
          </TabsContent>

          <TabsContent value="status_history">
            <ClientStatusHistory key={statusHistoryKey} clientId={client.id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <CloseFileDialog
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
        onConfirm={handleCloseFile}
        client={client}
      />

      <StatusChangeDialog
        open={showStatusChangeDialog}
        onOpenChange={setShowStatusChangeDialog}
        client={client}
        onSaved={() => setStatusHistoryKey(prev => prev + 1)}
      />

      <DEAClosingDialog
        open={showDEAClosing}
        onContinue={handleDEAContinue}
        onSwitchToPathways={handleDEASwitchToPathways}
        onDismiss={() => setShowDEAClosing(false)}
      />

      <ProgramDeterminationDialog
        open={showProgramDetermination}
        onOpenChange={setShowProgramDetermination}
        client={client}
        onSelect={handleProgramDetermination}
      />
    </div>
  );
}