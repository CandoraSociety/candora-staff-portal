import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import BarrierIdentificationTool from '@/components/wizard/BarrierIdentificationTool';

export default function ClientAssessments({ client, onSave }) {
  const [assessmentNotes, setAssessmentNotes] = useState(client.intake_notes || '');
  const [needsBarrierRemoval, setNeedsBarrierRemoval] = useState(client.assigned_service_navigator ? 'yes' : '');
  const [selectedNavigator, setSelectedNavigator] = useState('');
  const [navigatorStaff, setNavigatorStaff] = useState([]);
  const [savingERA, setSavingERA] = useState(false);

  useEffect(() => {
    base44.entities.PathwaysStaff.filter({ role: 'service_navigator', is_active: true }, 'name')
      .then(staff => {
        setNavigatorStaff(staff);
        setSelectedNavigator(staff.find(s => s.email === client.assigned_service_navigator)?.id || '');
      })
      .catch(() => {});
  }, [client.assigned_service_navigator]);

  const handleSaveERA = async () => {
    setSavingERA(true);
    try {
      const navigator = needsBarrierRemoval === 'yes'
        ? navigatorStaff.find(s => s.id === selectedNavigator)
        : null;
      await onSave({
        intake_notes: assessmentNotes,
        service_navigation_supports: needsBarrierRemoval === 'yes',
        assigned_service_navigator: navigator?.email || null,
        assigned_service_navigator_name: navigator?.name || null,
      });
      toast.success('ERA saved');
    } catch {
      toast.error('Failed to save ERA');
    }
    setSavingERA(false);
  };

  return (
    <div className="space-y-6">
      {/* BIT Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" style={{ color: 'hsl(231,64%,20%)' }} />
            <CardTitle>BIT — Barrier Identification Tool</CardTitle>
            {client.bit_completed && (
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium ml-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Completed
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <BarrierIdentificationTool
            client={client}
            onSave={onSave}
          />
        </CardContent>
      </Card>

      {/* ERA Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" style={{ color: 'hsl(231,64%,20%)' }} />
            <CardTitle>ERA — Employment Readiness Assessment</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-1 block text-sm font-medium text-slate-700">Assessment Notes &amp; Determination</Label>
            <Textarea
              rows={5}
              value={assessmentNotes}
              onChange={e => setAssessmentNotes(e.target.value)}
              placeholder="Record assessment findings, eligibility determination, language proficiency observations, and any recommendations..."
            />
          </div>

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
                <Label className="mb-1 block text-sm font-medium text-slate-700">Assigned Service Navigator</Label>
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

          <div className="flex justify-end">
            <Button onClick={handleSaveERA} disabled={savingERA}>
              {savingERA ? 'Saving...' : 'Save ERA'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}