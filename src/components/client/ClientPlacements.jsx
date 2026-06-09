import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Building2, Briefcase, ClipboardList, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import TrainingProgressTracker from '@/components/placements/TrainingProgressTracker';
import TrainingPlanEditor from '@/components/placements/TrainingPlanEditor';
import TrainingEvaluation from '@/components/placements/TrainingEvaluation';
import TrainingReferralForm from '@/components/placements/TrainingReferralForm';

const PLACEMENT_TYPE_LABELS = {
  cleaning_arc:          'Cleaning (ARC)',
  food_services_onsite:  'Food Services (Onsite)',
  food_services_offsite: 'Food Services (Offsite)',
  reception:             'Reception',
  childcare:             'Childcare',
};

const TRANSPORTATION_LABELS = {
  has_own_vehicle:                 'Has Own Vehicle',
  no_vehicle_willing_to_bus:       'No Vehicle – Willing to Bus',
  no_vehicle_not_willing_to_bus:   'No Vehicle – Not Willing to Bus',
  transit_pass_provided:           'Transit Pass Provided',
  requires_transportation_support: 'Requires Transportation Support',
  offsite_not_applicable:          'Offsite – Not Applicable',
};

const STATUS_COLORS = {
  referred:  'bg-blue-100 text-blue-700',
  active:    'bg-green-100 text-green-700',
  completed: 'bg-slate-100 text-slate-700',
  withdrawn: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-700',
};

function InternalPlacementsSection({ client }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const recs = await base44.entities.InternalTraining.filter({ client_id: client.id }, '-created_date');
      setRecords(recs);
      setSelected(recs[0] || null);
    } catch {
      toast.error('Failed to load internal training records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [client.id]);

  const handleSaved = () => {
    setShowForm(false);
    load();
  };

  // Program Flow summary card
  const hasPfPlacement = client.internal_placement && client.internal_placement !== 'none';

  return (
    <div className="space-y-4">
      {/* Program Flow summary */}
      {hasPfPlacement && (
        <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-blue-800 text-sm">From Program Flow — Internal Placement</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-500 font-medium">Placement Type</p>
              <p className="font-medium">{PLACEMENT_TYPE_LABELS[client.internal_placement] || client.internal_placement}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Start Date</p>
              <p>{client.placement_start_date || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">End Date</p>
              <p>{client.placement_end_date || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Supervisor</p>
              <p>{client.placement_supervisor || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Schedule</p>
              <p>{client.placement_schedule || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Request Sent</p>
              {client.placement_request_sent
                ? <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">Sent</span>
                : <span className="inline-block bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-semibold">Pending</span>
              }
            </div>
          </div>
        </div>
      )}

      {/* New referral form */}
      {showForm && (
        <TrainingReferralForm client={client} onSaved={handleSaved} onCancel={() => setShowForm(false)} />
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="py-10 flex flex-col items-center gap-3 text-slate-400">
            <ClipboardList className="w-8 h-8" />
            <p className="text-sm">No internal training referrals yet.</p>
            {!showForm && (
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-1" /> New Referral
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Record picker pills */}
          {records.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {records.map((rec, i) => (
                <button
                  key={rec.id}
                  onClick={() => setSelected(rec)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    selected?.id === rec.id
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {PLACEMENT_TYPE_LABELS[rec.placement_type] || rec.placement_type} — {rec.referral_date}
                </button>
              ))}
              {!showForm && (
                <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-1" /> New Referral
                </Button>
              )}
            </div>
          )}

          {selected && (
            <div className="space-y-4">
              {/* Summary bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Placement</p>
                  <p className="font-medium">{PLACEMENT_TYPE_LABELS[selected.placement_type] || selected.placement_type}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Status</p>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS_COLORS[selected.status] || 'bg-slate-100 text-slate-600'}`}>
                    {selected.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Transportation</p>
                  <p className="text-xs">{TRANSPORTATION_LABELS[selected.transportation] || selected.transportation || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Referred</p>
                  <p>{selected.referral_date || '—'}</p>
                </div>
              </div>

              {/* Training goals */}
              {selected.training_goals && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-sm text-slate-700">
                  <p className="text-xs font-semibold text-blue-600 mb-1">Training Goals</p>
                  {selected.training_goals}
                </div>
              )}

              {/* Sub-tabs */}
              <Tabs defaultValue="progress">
                <TabsList>
                  <TabsTrigger value="progress">Progress</TabsTrigger>
                  <TabsTrigger value="plan">Training Plan</TabsTrigger>
                  <TabsTrigger value="evaluation" className="relative">
                    Evaluation
                    {selected.evaluation_completed && (
                      <span className="ml-1.5 w-2 h-2 rounded-full bg-green-500 inline-block" />
                    )}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="progress" className="mt-4">
                  <TrainingProgressTracker training={selected} readOnly />
                </TabsContent>
                <TabsContent value="plan" className="mt-4">
                  <TrainingPlanEditor training={selected} readOnly />
                </TabsContent>
                <TabsContent value="evaluation" className="mt-4">
                  <TrainingEvaluation training={selected} readOnly />
                </TabsContent>
              </Tabs>
            </div>
          )}

          {records.length === 1 && !showForm && (
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-1" /> New Referral
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExternalPlacementsSection({ client }) {
  const hasExternal = client?.paid_external_placement || client?.external_employer;

  if (!hasExternal) {
    return (
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-3 text-slate-400">
          <Briefcase className="w-8 h-8" />
          <p className="text-sm">No external placement recorded.</p>
          <p className="text-xs text-center text-slate-400">External placement details are set in the Program Flow wizard.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="border-2 border-purple-200 bg-purple-50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Briefcase className="w-4 h-4 text-purple-600" />
        <span className="font-semibold text-purple-800 text-sm">From Program Flow — External Placement</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        {client.employer_name && (
          <div>
            <p className="text-xs text-slate-500 font-medium">Employer</p>
            <p className="font-medium">{client.employer_name}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-slate-500 font-medium">Paid External Placement</p>
          {client.paid_external_placement
            ? <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">Yes</span>
            : <span className="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-semibold">No</span>
          }
        </div>
      </div>
    </div>
  );
}

export default function ClientPlacements({ client }) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold text-slate-800">Placements</h3>
        <p className="text-sm text-slate-500 mt-0.5">
          View and manage internal training referrals and external placement details for this client.
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Internal Placements</p>
        <InternalPlacementsSection client={client} />
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">External Placement</p>
        <ExternalPlacementsSection client={client} />
      </div>
    </div>
  );
}