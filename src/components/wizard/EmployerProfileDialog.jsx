import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Building2, MapPin, Phone, Mail, Briefcase, Pencil, User, Loader2 } from 'lucide-react';
import EmployerProfileEditDialog from '@/components/employer-portal/EmployerProfileEditDialog';

const STATUS_LABEL = { pending: 'Pending', active: 'Active', inactive: 'Inactive' };
const STATUS_BADGE = {
  pending: 'bg-amber-100 text-amber-800',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-slate-200 text-slate-700',
};

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5 border-b last:border-0">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground break-words">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function EmployerProfileDialog({ employerId, onClose, onSaved }) {
  const [employer, setEmployer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const load = async () => {
    if (!employerId) return;
    setLoading(true);
    try {
      const e = await base44.entities.Employer.get(employerId);
      setEmployer(e);
    } catch {
      toast.error('Could not load employer');
      onClose?.();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [employerId]);

  const handleSaved = async () => {
    setEditing(false);
    await load();
    onSaved?.();
  };

  return (
    <>
      <Dialog open={employerId && !editing} onOpenChange={(o) => !o && onClose?.()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Company Profile
            </DialogTitle>
          </DialogHeader>
          {loading || !employer ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading…
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2 pb-2">
                <h3 className="text-lg font-semibold break-words">{employer.name}</h3>
                <Badge className={STATUS_BADGE[employer.status] || ''}>{STATUS_LABEL[employer.status] || employer.status}</Badge>
              </div>
              <InfoRow icon={User} label="Contact" value={[employer.first_name, employer.last_name].filter(Boolean).join(' ')} />
              <InfoRow icon={Briefcase} label="Position" value={employer.position} />
              <InfoRow icon={Mail} label="Login Email" value={employer.contact_email} />
              <InfoRow icon={Phone} label="Phone" value={employer.contact_phone} />
              <InfoRow icon={MapPin} label="Address" value={employer.address} />
              <InfoRow icon={Building2} label="Industry" value={employer.industry} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => onClose?.()}>Close</Button>
            <Button size="sm" onClick={() => setEditing(true)} disabled={!employer}>
              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit Employer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editing && employer && (
        <EmployerProfileEditDialog
          employer={employer}
          onClose={() => setEditing(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}