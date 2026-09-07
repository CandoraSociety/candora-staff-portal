import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import UniversalRegistrationDialog from '@/components/centralreg/UniversalRegistrationDialog';
import KidsGiftShopRegistrationDialog from '@/components/centralreg/KidsGiftShopRegistrationDialog';
import { REG_AREA_LABELS, REG_AREA_PATHS } from '@/lib/centralRegConstants';

function AreaSection({ title, color, portalPath, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="font-medium text-sm text-foreground flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />{title}
        </p>
        {portalPath && <Link to={portalPath}><Button size="sm" variant="ghost">Open portal<ExternalLink className="h-3.5 w-3.5" /></Button></Link>}
      </div>
      {children}
    </div>
  );
}

function ProgramCard({ title, subtitle, meta, onRegister }) {
  return (
    <Card className="hover:shadow-sm transition-shadow"><CardContent className="p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm text-foreground truncate">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
          {meta && <p className="text-xs text-muted-foreground/80 mt-0.5">{meta}</p>}
        </div>
        <Button size="sm" onClick={onRegister} className="flex-shrink-0"><Plus className="h-3.5 w-3.5" /> Register</Button>
      </div>
    </CardContent></Card>
  );
}

export default function CentralRegPrograms() {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState(null); // { area, program }
  const [giftShopOpen, setGiftShopOpen] = useState(false);

  const { data: communityPrograms = [], isLoading } = useQuery({ queryKey: ['cr-community-programs'], queryFn: () => base44.entities.CommunityProgram.list() });
  const { data: cohorts = [] } = useQuery({ queryKey: ['cr-empower-cohorts'], queryFn: () => base44.entities.EmpowerUCohort.list() });
  const { data: empowerRegs = [] } = useQuery({ queryKey: ['cr-empower-regs'], queryFn: () => base44.entities.EmpowerURegistration.list('-registration_date', 500) });
  const { data: phacPrograms = [] } = useQuery({ queryKey: ['cr-phac-programs'], queryFn: () => base44.entities.PHACProgram.list() });

  const openDialog = (area, program = null) => setDialog({ area, program });

  const onSaved = () => {
    setDialog(null);
    queryClient.invalidateQueries();
  };

  const onGiftShopSaved = () => {
    setGiftShopOpen(false);
    queryClient.invalidateQueries();
  };

  const activeCommunity = communityPrograms.filter(p => p.status === 'active');
  const openCohorts = cohorts.filter(c => c.registration_open && !['completed', 'cancelled'].includes(c.status));
  const activePhac = phacPrograms.filter(p => p.status === 'active');

  const cohortMeta = (c) => {
    const regs = empowerRegs.filter(r => r.cohort_id === c.id);
    const active = regs.filter(r => ['registered', 'enrolled'].includes(r.status)).length;
    const waitlisted = regs.filter(r => r.status === 'waitlisted').length;
    return `${active}/${c.capacity || '—'} enrolled${waitlisted ? ` · ${waitlisted} waitlisted` : ''}`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Programs & Registration</h1>
        <p className="text-muted-foreground text-sm mt-1">Register a participant for any program or service requiring registration. Registrations made here appear instantly in the program's own portal.</p>
      </div>

      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> : (
        <div className="space-y-8">
          <AreaSection title={REG_AREA_LABELS.community} color="#f97316" portalPath={REG_AREA_PATHS.community}>
            <div className="space-y-2">
              {activeCommunity.length === 0 && <p className="text-sm text-muted-foreground py-2">No active community programs.</p>}
              {activeCommunity.map(p => (
                <ProgramCard key={p.id} title={p.name} subtitle={p.description} meta={[p.schedule_description, p.location].filter(Boolean).join(' · ')} onRegister={() => openDialog('community', p)} />
              ))}
            </div>
          </AreaSection>

          <AreaSection title={REG_AREA_LABELS.empoweru} color="#8b5cf6" portalPath={REG_AREA_PATHS.empoweru}>
            <div className="space-y-2">
              {openCohorts.length === 0 && <p className="text-sm text-muted-foreground py-2">No cohorts are open for registration right now.</p>}
              {openCohorts.map(c => (
                <ProgramCard key={c.id} title={c.name} subtitle={c.delivery_mode === 'virtual' ? 'Virtual' : c.location || c.delivery_mode} meta={`${cohortMeta(c)}${c.registration_deadline ? ` · Register by ${c.registration_deadline}` : ''}`} onRegister={() => openDialog('empoweru', c)} />
              ))}
            </div>
          </AreaSection>

          <AreaSection title={REG_AREA_LABELS.phac} color="#0ea5e9" portalPath={REG_AREA_PATHS.phac}>
            <div className="space-y-2">
              {activePhac.length === 0 && <p className="text-sm text-muted-foreground py-2">No active PHAC programs.</p>}
              {activePhac.map(p => (
                <ProgramCard key={p.id} title={p.name} subtitle={p.description} meta={[p.location, p.facilitator].filter(Boolean).join(' · ')} onRegister={() => openDialog('phac', p)} />
              ))}
            </div>
          </AreaSection>

          <AreaSection title={REG_AREA_LABELS.ell} color="#22c55e" portalPath={REG_AREA_PATHS.ell}>
            <div className="space-y-2">
              <ProgramCard title="ELL Program — Ongoing Intake" subtitle="Register a new learner (they start as Prospective until assessed and placed in a class)" onRegister={() => openDialog('ell', { name: 'ELL Program' })} />
            </div>
          </AreaSection>

          <AreaSection title={REG_AREA_LABELS.digilit} color="#6366f1" portalPath={REG_AREA_PATHS.digilit}>
            <div className="space-y-2">
              <ProgramCard title="Digital Literacy Program" subtitle="Register a new participant for digital literacy sessions" onRegister={() => openDialog('digilit', { name: 'Digital Literacy' })} />
            </div>
          </AreaSection>

          <AreaSection title={REG_AREA_LABELS.volunteer} color="#ec4899" portalPath={REG_AREA_PATHS.volunteer}>
            <div className="space-y-2">
              <ProgramCard title="Volunteer Registration" subtitle="Register a new volunteer application (processed on the Volunteer Registration page)" onRegister={() => openDialog('volunteer', { name: 'Volunteer Program' })} />
            </div>
          </AreaSection>

          <AreaSection title={REG_AREA_LABELS.kids_gift_shop} color="#e11d48" portalPath={REG_AREA_PATHS.kids_gift_shop}>
            <div className="space-y-2">
              <ProgramCard title="Kids Gift Shop" subtitle="Register a parent/guardian with their children and pick a time slot (tracked under All Registrations)" onRegister={() => setGiftShopOpen(true)} />
            </div>
          </AreaSection>

          <AreaSection title="Other programs & services" color="#64748b" portalPath={REG_AREA_PATHS.reception}>
            <Card><CardContent className="p-3 text-sm text-muted-foreground">
              For programs without a dedicated listing above (FRN, Resource Centre, and other services), registrations are taken on the cross-portal form and tracked under <Link className="text-primary underline" to="/central-registration/registrations">All Registrations</Link> — including approval and waitlist handling.
            </CardContent></Card>
          </AreaSection>
        </div>
      )}

      <UniversalRegistrationDialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)} area={dialog?.area} program={dialog?.program} onSaved={onSaved} />
      <KidsGiftShopRegistrationDialog open={giftShopOpen} onOpenChange={setGiftShopOpen} onSaved={onGiftShopSaved} />
    </div>
  );
}