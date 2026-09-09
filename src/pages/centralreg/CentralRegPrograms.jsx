import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, ExternalLink, CalendarPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import UniversalRegistrationDialog from '@/components/centralreg/UniversalRegistrationDialog';
import CreateSessionDialog from '@/components/centralreg/CreateSessionDialog';
import KidsGiftShopRegistrationDialog from '@/components/centralreg/KidsGiftShopRegistrationDialog';
import AreaCapacityControl from '@/components/centralreg/AreaCapacityControl';
import { REG_AREA_LABELS, REG_AREA_PATHS } from '@/lib/centralRegConstants';

function AreaSection({ title, color, portalPath, capacityControl, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <p className="font-medium text-sm text-foreground flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />{title}
        </p>
        <div className="flex items-center gap-3">
          {capacityControl}
          {portalPath && <Link to={portalPath}><Button size="sm" variant="ghost">Open portal<ExternalLink className="h-3.5 w-3.5" /></Button></Link>}
        </div>
      </div>
      {children}
    </div>
  );
}

// FRN targeted groups — registered here, tracked in the FRN portal and All Registrations.
const FRN_TARGETED_PROGRAMS = ['Connect Parent Group', 'Wellness Compass', 'Neurodivergent Parenting Group', 'Triple P', "Nobody's Perfect"];

function CategorySection({ title, description, portalPath, portalLabel = 'Open portal', capacityControl, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-heading font-bold text-foreground">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="flex items-center gap-3">
          {capacityControl}
          {portalPath && <Link to={portalPath}><Button size="sm" variant="ghost">{portalLabel}<ExternalLink className="h-3.5 w-3.5" /></Button></Link>}
        </div>
      </div>
      {children}
    </div>
  );
}

function ProgramCard({ title, subtitle, meta, onRegister, isFull = false, capacityControl, noSessions = false, sessionLabel = 'Session', onCreateSession }) {
  return (
    <Card className="hover:shadow-sm transition-shadow"><CardContent className="p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm text-foreground truncate">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
          {meta && <p className="text-xs text-muted-foreground/80 mt-0.5">{meta}</p>}
          {isFull && <p className="text-xs text-amber-600 mt-0.5">Registration is full, but you can still add to the waitlist</p>}
          {noSessions && <p className="text-xs text-red-600 mt-0.5">No {sessionLabel.toLowerCase()}s scheduled — create one to enable registration</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {capacityControl}
          {onCreateSession && <Button size="sm" variant="outline" onClick={onCreateSession} className="flex-shrink-0"><CalendarPlus className="h-3.5 w-3.5" /> Create {sessionLabel}</Button>}
          <Button size="sm" onClick={onRegister} disabled={noSessions} className="flex-shrink-0"><Plus className="h-3.5 w-3.5" /> {isFull ? 'Add to Waitlist' : 'Register'}</Button>
        </div>
      </div>
    </CardContent></Card>
  );
}

export default function CentralRegPrograms() {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState(null); // { area, program }
  const [sessionDialog, setSessionDialog] = useState(null); // { area, program }
  const [giftShopOpen, setGiftShopOpen] = useState(false);

  const { data: communityPrograms = [], isLoading } = useQuery({ queryKey: ['cr-community-programs'], queryFn: () => base44.entities.CommunityProgram.list() });
  const { data: cohorts = [] } = useQuery({ queryKey: ['cr-empower-cohorts'], queryFn: () => base44.entities.EmpowerUCohort.list() });
  const { data: empowerRegs = [] } = useQuery({ queryKey: ['cr-empower-regs'], queryFn: () => base44.entities.EmpowerURegistration.list('-registration_date', 500) });
  const { data: phacPrograms = [] } = useQuery({ queryKey: ['cr-phac-programs'], queryFn: () => base44.entities.PHACProgram.list() });
  const { data: capacities = [] } = useQuery({ queryKey: ['cr-area-capacities'], queryFn: () => base44.entities.CentralRegAreaCapacity.list() });
  const { data: communityRegs = [] } = useQuery({ queryKey: ['cr-community-regs'], queryFn: () => base44.entities.CommunityRegistration.list('-registration_date', 500) });
  const { data: phacParticipants = [] } = useQuery({ queryKey: ['cr-phac-participants'], queryFn: () => base44.entities.PHACParticipant.list('-created_date', 500) });
  const { data: digilitParticipants = [] } = useQuery({ queryKey: ['cr-digilit-participants'], queryFn: () => base44.entities.DigiLitParticipant.list('-registration_date', 500) });
  const { data: ellLearners = [] } = useQuery({ queryKey: ['cr-ell-learners'], queryFn: () => base44.entities.ELLLearner.list('-created_date', 500) });
  const { data: volunteers = [] } = useQuery({ queryKey: ['cr-volunteers'], queryFn: () => base44.entities.Volunteer.list('-created_date', 500) });
  const { data: programRegs = [] } = useQuery({ queryKey: ['reception-registrations'], queryFn: () => base44.entities.ProgramRegistration.list('-registration_date', 500) });
  const { data: communitySessions = [] } = useQuery({ queryKey: ['cr-community-sessions'], queryFn: () => base44.entities.CommunitySession.list('-session_date', 500) });
  const { data: phacSessions = [] } = useQuery({ queryKey: ['cr-phac-sessions'], queryFn: () => base44.entities.PHACSession.list('-session_date', 500) });
  const { data: ellClasses = [] } = useQuery({ queryKey: ['cr-ell-classes'], queryFn: () => base44.entities.ELLClass.list() });
  const { data: digilitSessions = [] } = useQuery({ queryKey: ['cr-digilit-sessions'], queryFn: () => base44.entities.DigiLitSession.list('-session_date', 500) });
  const { data: frnSessions = [] } = useQuery({ queryKey: ['cr-frn-sessions'], queryFn: () => base44.entities.FRNSession.list('-session_date', 500) });

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

  // ELL programs (course profiles) — top-level ELLClass records that other
  // delivery classes can attach to via course_id. Registered separately.
  const ellPrograms = ellClasses
    .filter(c => c.status !== 'cancelled' && !c.course_id)
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const ellClassMeta = (cls) => {
    const clb = { clb_1: 'CLB 1', clb_2: 'CLB 2', clb_3: 'CLB 3', clb_4: 'CLB 4', clb_5: 'CLB 5', clb_6: 'CLB 6', mixed: 'Mixed levels' }[cls.clb_level];
    const days = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri' };
    const schedule = (cls.schedule_days || []).map(d => days[d]).filter(Boolean).join(' / ');
    return [clb, schedule, cls.start_time && cls.end_time ? `${cls.start_time}–${cls.end_time}` : ''].filter(Boolean).join(' · ');
  };

  // Active (spot-taking) registration counts per area, against each area maximum.
  const areaFilled = {
    empoweru: empowerRegs.filter(r => ['registered', 'enrolled'].includes(r.status)).length,
    phac: phacParticipants.filter(p => p.status === 'registered').length,
    digilit: digilitParticipants.filter(p => ['registered', 'started'].includes(p.status)).length,
    ell: ellLearners.filter(l => ['enrolled', 'active'].includes(l.enrollment_status)).length,
    volunteer: volunteers.filter(v => ['pending', 'active', 'occasional'].includes(v.status)).length,
    kids_gift_shop: programRegs.filter(r => r.program_name === 'Kids Gift Shop' && ['approved', 'enrolled'].includes(r.status)).length,
    frn: programRegs.filter(r => r.program_portal === 'frn' && ['approved', 'enrolled'].includes(r.status)).length,
  };
  const capacityControlFor = (area) => (
    <AreaCapacityControl area={area} capacityRecord={capacities.find(c => c.area === area)} filled={areaFilled[area] || 0} />
  );
  const isAreaFull = (area) => {
    const rec = capacities.find(c => c.area === area);
    return !!rec && rec.max_capacity > 0 && (areaFilled[area] || 0) >= rec.max_capacity;
  };

  // Community programs each have their own maximum.
  const communityProgramStats = (p) => {
    const rec = capacities.find(c => c.area === 'community' && c.program_id === p.id);
    const filled = communityRegs.filter(r => r.program_id === p.id && ['registered', 'active'].includes(r.status)).length;
    return { rec, filled, full: !!rec && rec.max_capacity > 0 && filled >= rec.max_capacity };
  };

  const dialogForceWaitlist = (() => {
    if (!dialog) return false;
    if (dialog.area === 'community' && dialog.program) return communityProgramStats(dialog.program).full;
    return isAreaFull(dialog.area);
  })();

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
        <p className="text-muted-foreground text-sm mt-1">Register a participant for any program or service requiring registration. Registrations made here appear instantly in the program's own portal. Set a Max per program/area — once reached, new registrations automatically go to the waitlist (an override code can be entered in the form to register anyway).</p>
      </div>

      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> : (
        <div className="space-y-10">
          {/* ===== Kids Gift Shop ===== */}
          <CategorySection title="Kids Gift Shop" portalPath={REG_AREA_PATHS.kids_gift_shop} portalLabel="All registrations" capacityControl={capacityControlFor('kids_gift_shop')}>
            <ProgramCard title="Kids Gift Shop" subtitle="Register a parent/guardian with their children and pick a time slot (tracked under All Registrations)" isFull={isAreaFull('kids_gift_shop')} onRegister={() => setGiftShopOpen(true)} />
          </CategorySection>

          {/* ===== Adult Learning: ELL, Digital Literacy, EmpowerU ===== */}
          <CategorySection title="Adult Learning" description="English Language Learning, Digital Literacy, and EmpowerU programs.">
            <div className="space-y-6">
              <AreaSection title={REG_AREA_LABELS.ell} color="#22c55e" portalPath={REG_AREA_PATHS.ell} capacityControl={capacityControlFor('ell')}>
                <div className="space-y-2">
                  <ProgramCard title="ELL Program — Ongoing Intake" subtitle="Register a new learner without a specific program (they start as Prospective until assessed and placed in a class)" isFull={isAreaFull('ell')} noSessions={!ellClasses.some(c => c.status === 'active')} sessionLabel="Class" onCreateSession={() => setSessionDialog({ area: 'ell' })} onRegister={() => openDialog('ell', { name: 'ELL Program' })} />
                  {ellPrograms.map(cls => (
                    <ProgramCard
                      key={cls.id}
                      title={cls.name}
                      subtitle={cls.description}
                      meta={ellClassMeta(cls)}
                      isFull={isAreaFull('ell')}
                      noSessions={cls.status !== 'active'}
                      sessionLabel="Class"
                      onCreateSession={() => setSessionDialog({ area: 'ell', program: cls })}
                      onRegister={() => openDialog('ell', cls)}
                    />
                  ))}
                </div>
              </AreaSection>

              <AreaSection title={REG_AREA_LABELS.digilit} color="#6366f1" portalPath={REG_AREA_PATHS.digilit} capacityControl={capacityControlFor('digilit')}>
                <div className="space-y-2">
                  <ProgramCard title="Digital Literacy Program" subtitle="Register a new participant for digital literacy sessions" isFull={isAreaFull('digilit')} noSessions={!digilitSessions.some(s => s.status !== 'cancelled')} sessionLabel="Session" onCreateSession={() => setSessionDialog({ area: 'digilit' })} onRegister={() => openDialog('digilit', { name: 'Digital Literacy' })} />
                </div>
              </AreaSection>

              <AreaSection title={REG_AREA_LABELS.empoweru} color="#8b5cf6" portalPath={REG_AREA_PATHS.empoweru} capacityControl={capacityControlFor('empoweru')}>
                <div className="space-y-2">
                  {openCohorts.length === 0 && (
                    <div className="flex items-center justify-between gap-3 py-2">
                      <p className="text-sm text-muted-foreground">No cohorts are open for registration right now — learners can't register until a cohort is created.</p>
                      <Button size="sm" variant="outline" onClick={() => setSessionDialog({ area: 'empoweru' })}><CalendarPlus className="h-3.5 w-3.5" /> Create Cohort</Button>
                    </div>
                  )}
                  {openCohorts.map(c => (
                    <ProgramCard key={c.id} title={c.name} subtitle={c.delivery_mode === 'virtual' ? 'Virtual' : c.location || c.delivery_mode} meta={`${cohortMeta(c)}${c.registration_deadline ? ` · Register by ${c.registration_deadline}` : ''}`} isFull={isAreaFull('empoweru')} onRegister={() => openDialog('empoweru', c)} />
                  ))}
                </div>
              </AreaSection>
            </div>
          </CategorySection>

          {/* ===== PHAC Programs ===== */}
          <CategorySection title="PHAC Programs" description="PHAC-funded programs for families with children ages 0-6." portalPath={REG_AREA_PATHS.phac} capacityControl={capacityControlFor('phac')}>
            <div className="space-y-2">
              {activePhac.length === 0 && <p className="text-sm text-muted-foreground py-2">PHAC programs are yet to be added — create them in the PHAC portal and they'll appear here.</p>}
              {activePhac.map(p => (
                <ProgramCard key={p.id} title={p.name} subtitle={p.description} meta={[p.location, p.facilitator].filter(Boolean).join(' · ')} isFull={isAreaFull('phac')} noSessions={!phacSessions.some(s => s.program_id === p.id && s.status !== 'cancelled')} sessionLabel="Session" onCreateSession={() => setSessionDialog({ area: 'phac', program: p })} onRegister={() => openDialog('phac', p)} />
              ))}
            </div>
          </CategorySection>

          {/* ===== FRN Targeted Programs ===== */}
          <CategorySection title="FRN Targeted Programs" description="Family Resource Network targeted groups." portalPath={REG_AREA_PATHS.frn} capacityControl={capacityControlFor('frn')}>
            <div className="space-y-2">
              {FRN_TARGETED_PROGRAMS.map(name => (
                <ProgramCard
                  key={name}
                  title={name}
                  subtitle="FRN targeted group — the registration appears in the FRN portal and under All Registrations"
                  isFull={isAreaFull('frn')}
                  noSessions={!frnSessions.some(s => s.program_name === name && s.status !== 'cancelled')}
                  sessionLabel="Session"
                  onCreateSession={() => setSessionDialog({ area: 'frn', program: { name } })}
                  onRegister={() => openDialog('frn', { name })}
                />
              ))}
            </div>
          </CategorySection>

          {/* ===== Community Programs ===== */}
          <CategorySection title="Community Programs" portalPath={REG_AREA_PATHS.community}>
            <div className="space-y-2">
              {activeCommunity.length === 0 && <p className="text-sm text-muted-foreground py-2">No active community programs.</p>}
              {activeCommunity.map(p => {
                const stats = communityProgramStats(p);
                return (
                  <ProgramCard
                    key={p.id}
                    title={p.name}
                    subtitle={p.description}
                    meta={[p.schedule_description, p.location].filter(Boolean).join(' · ')}
                    isFull={stats.full}
                    noSessions={!communitySessions.some(s => s.program_id === p.id && s.status !== 'cancelled')}
                    sessionLabel="Session"
                    onCreateSession={() => setSessionDialog({ area: 'community', program: p })}
                    capacityControl={<AreaCapacityControl area="community" programId={p.id} capacityRecord={stats.rec} filled={stats.filled} />}
                    onRegister={() => openDialog('community', p)}
                  />
                );
              })}
            </div>
          </CategorySection>

          {/* ===== Volunteer (standalone, not a course category) ===== */}
          <AreaSection title={REG_AREA_LABELS.volunteer} color="#ec4899" portalPath={REG_AREA_PATHS.volunteer} capacityControl={capacityControlFor('volunteer')}>
            <div className="space-y-2">
              <ProgramCard title="Volunteer Registration" subtitle="Register a new volunteer application (processed on the Volunteer Registration page)" isFull={isAreaFull('volunteer')} onRegister={() => openDialog('volunteer', { name: 'Volunteer Program' })} />
            </div>
          </AreaSection>

          {/* ===== Other programs & services ===== */}
          <AreaSection title="Other programs & services" color="#64748b" portalPath={REG_AREA_PATHS.reception}>
            <Card><CardContent className="p-3 text-sm text-muted-foreground">
              For programs without a dedicated listing above (Resource Centre and other services), registrations are taken on the cross-portal form and tracked under <Link className="text-primary underline" to="/central-registration/registrations">All Registrations</Link> — including approval and waitlist handling.
            </CardContent></Card>
          </AreaSection>
        </div>
      )}

      <UniversalRegistrationDialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)} area={dialog?.area} program={dialog?.program} forceWaitlist={dialogForceWaitlist} onSaved={onSaved} />
      <CreateSessionDialog open={!!sessionDialog} onOpenChange={(o) => !o && setSessionDialog(null)} area={sessionDialog?.area} program={sessionDialog?.program} onSaved={() => { setSessionDialog(null); queryClient.invalidateQueries(); }} />
      <KidsGiftShopRegistrationDialog open={giftShopOpen} onOpenChange={setGiftShopOpen} forceWaitlist={isAreaFull('kids_gift_shop')} onSaved={onGiftShopSaved} />
    </div>
  );
}