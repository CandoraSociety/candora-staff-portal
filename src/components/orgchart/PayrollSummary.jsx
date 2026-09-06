// 2026 Canada employer contribution rates and caps
const EI_MAX_INSURABLE = 68900;
const EI_EMPLOYER_RATE = 0.02282;
const EI_MAX_EMPLOYER = EI_MAX_INSURABLE * EI_EMPLOYER_RATE; // ~$1,572

const CPP_YMPE = 74600;
const CPP_BASIC_EXEMPTION = 3500;
const CPP1_EMPLOYER_RATE = 0.0595;
const CPP1_MAX_EMPLOYER = (CPP_YMPE - CPP_BASIC_EXEMPTION) * CPP1_EMPLOYER_RATE; // $4,230.45

const CPP2_THRESHOLD = 74600;
const CPP2_UPPER_CAP = 85000;
const CPP2_EMPLOYER_RATE = 0.04;
const CPP2_MAX_EMPLOYER = (CPP2_UPPER_CAP - CPP2_THRESHOLD) * CPP2_EMPLOYER_RATE; // $416

function calculateEmployerContributions(salary) {
  if (!salary || salary <= 0) return { ei: 0, cpp1: 0, cpp2: 0, total: 0 };
  
  // EI: capped at max insurable earnings
  const ei = Math.min(salary, EI_MAX_INSURABLE) * EI_EMPLOYER_RATE;
  
  // CPP1: on earnings between basic exemption and YMPE
  let cpp1 = 0;
  if (salary > CPP_BASIC_EXEMPTION) {
    const cpp1Taxable = Math.min(salary, CPP_YMPE) - CPP_BASIC_EXEMPTION;
    cpp1 = cpp1Taxable * CPP1_EMPLOYER_RATE;
  }
  
  // CPP2: on earnings between YMPE and upper cap
  let cpp2 = 0;
  if (salary > CPP2_THRESHOLD) {
    const cpp2Taxable = Math.min(salary, CPP2_UPPER_CAP) - CPP2_THRESHOLD;
    cpp2 = cpp2Taxable * CPP2_EMPLOYER_RATE;
  }
  
  return { ei, cpp1, cpp2, total: ei + cpp1 + cpp2 };
}

const BENEFITS_MONTHLY = 1900;
const BENEFITS_ANNUAL = BENEFITS_MONTHLY * 12;

// Alberta WCB (Workers' Compensation Board) premium — employer-paid, calculated as
// assessable payroll × rate per $100. Uses the 2026 average employer rate; confirm
// against the actual WCB-Alberta premium statement.
const WCB_RATE_PER_100 = 1.46;

// Payroll summary bar — annual / monthly / bi-weekly
export default function PayrollSummary({ positions, showSalary, basePositions }) {
  if (!showSalary) return null;

  // Separate unpaid tiers (practicum + skilled volunteer) from paid staff
  const unpaidTiers = ["practicum_placement", "skilled_volunteer"];
  const practicumPositions = positions.filter(p => unpaidTiers.includes(p.tier));
  const paidPositions = positions.filter(p => !unpaidTiers.includes(p.tier));

  // Always use the stored salary field as the source of truth (exclude practicums — always $0)
  const annual = paidPositions.reduce((s, p) => s + (p.salary || 0), 0);
  const monthly = annual / 12;
  const fmt = (n) => "$" + Math.round(n).toLocaleString();
  const fmtDiff = (n) => (n >= 0 ? "▲ +" : "▼ ") + Math.round(Math.abs(n)).toLocaleString();
  const diffColor = (n) => n > 0 ? "text-green-600" : "text-red-600";
  const filled = paidPositions.filter(p => !p.is_vacant && p.person_name?.trim()).length;
  const vacant = paidPositions.filter(p => p.is_vacant || !p.person_name?.trim()).length;

  // Calculate employer CPP/EI contributions (paid staff only)
  let totalEI = 0;
  let totalCPP = 0;
  paidPositions.forEach(p => {
    const contribs = calculateEmployerContributions(p.salary || 0);
    totalEI += contribs.ei;
    totalCPP += contribs.cpp1 + contribs.cpp2;
  });
  const totalEmployerContributions = totalEI + totalCPP;
  // The employee's 50% share of benefits is deducted from staff wages and kept
  // by Candora (it never leaves the account), so the actual Payworks withdrawal
  // per bi-weekly run is gross wages − benefits skim + employer CPP/EI.
  const benefitsSkim = BENEFITS_ANNUAL / 26;
  const payworksBiweekly = (annual + totalEmployerContributions - BENEFITS_ANNUAL) / 26;
  // WCB estimate — insurable payroll × industry rate per $100
  const wcbAnnual = annual * (WCB_RATE_PER_100 / 100);
  const grandTotalAnnual = annual + totalEmployerContributions + BENEFITS_ANNUAL;
  const grandTotalMonthly = grandTotalAnnual / 12;

  // Base comparisons also exclude unpaid tiers
  const basePaidPositions = basePositions?.filter(p => !unpaidTiers.includes(p.tier)) || [];

  // Calculate differences vs base positions (if provided)
  let diffPositions = 0;
  let diffAnnual = 0;
  let diffMonthly = 0;
  let diffEI = 0;
  let diffCPP = 0;
  let diffEmployerContributions = 0;
  if (basePaidPositions.length > 0) {
    diffPositions = paidPositions.length - basePaidPositions.length;
    const baseAnnual = basePaidPositions.reduce((s, p) => s + (p.salary || 0), 0);
    diffAnnual = annual - baseAnnual;
    diffMonthly = diffAnnual / 12;
    
    // Calculate base employer contributions
    let baseEI = 0;
    let baseCPP = 0;
    basePaidPositions.forEach(p => {
      const contribs = calculateEmployerContributions(p.salary || 0);
      baseEI += contribs.ei;
      baseCPP += contribs.cpp1 + contribs.cpp2;
    });
    diffEI = totalEI - baseEI;
    diffCPP = totalCPP - baseCPP;
    diffEmployerContributions = diffEI + diffCPP;
  }
  const hasDeltas = basePaidPositions.length > 0 && (diffPositions !== 0 || diffAnnual !== 0);

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
      <div>
        <span className="font-semibold text-foreground">{paidPositions.length} staff position{paidPositions.length !== 1 ? "s" : ""}</span>
        {practicumPositions.length > 0 && (
          <p className="text-xs text-muted-foreground">{practicumPositions.length} unpaid (practicum/volunteer)</p>
        )}
        {hasDeltas && diffPositions !== 0 && (
          <p className={`text-xs font-semibold italic ${diffColor(diffPositions)}`}>{fmtDiff(diffPositions)}</p>
        )}
      </div>
      <span className="text-muted-foreground/40">|</span>
      <div>
        <span>{filled} filled · {vacant} vacant</span>
      </div>
      <span className="text-muted-foreground/40">|</span>
      <div>
        <span><span className="font-medium text-foreground">Annual:</span> {fmt(annual)}</span>
        {hasDeltas && diffAnnual !== 0 && (
          <p className={`text-xs font-semibold italic ${diffColor(diffAnnual)}`}>{fmtDiff(diffAnnual)}</p>
        )}
      </div>
      <div>
        <span><span className="font-medium text-foreground">Monthly:</span> {fmt(monthly)}</span>
        {hasDeltas && diffMonthly !== 0 && (
          <p className={`text-xs font-semibold italic ${diffColor(diffMonthly)}`}>{fmtDiff(diffMonthly)}</p>
        )}
      </div>
      {showSalary && (
        <>
          <span className="text-muted-foreground/40">|</span>
          <div>
            <span><span className="font-medium text-foreground">Employer CPP/EI:</span> {fmt(totalEmployerContributions)}</span>
            {hasDeltas && diffEmployerContributions !== 0 && (
              <p className={`text-xs font-semibold italic ${diffColor(diffEmployerContributions)}`}>{fmtDiff(diffEmployerContributions)}</p>
            )}
          </div>
          <div className="text-xs">
            <span className="text-muted-foreground">CPP: {fmt(totalCPP)}</span>
            {hasDeltas && diffCPP !== 0 && (
              <p className={`text-xs font-semibold italic ${diffColor(diffCPP)}`}>{fmtDiff(diffCPP)}</p>
            )}
          </div>
          <div className="text-xs">
            <span className="text-muted-foreground">EI: {fmt(totalEI)}</span>
            {hasDeltas && diffEI !== 0 && (
              <p className={`text-xs font-semibold italic ${diffColor(diffEI)}`}>{fmtDiff(diffEI)}</p>
            )}
          </div>
          <div className="text-xs">
            <span className="text-muted-foreground">Benefits: {fmt(BENEFITS_ANNUAL)}/yr</span>
            <p className="text-xs text-muted-foreground/60 italic">(est. fixed)</p>
          </div>
          <span className="text-muted-foreground/40">|</span>
          <div>
            <span className="font-semibold text-foreground">Total Cost: {fmt(grandTotalAnnual)}/yr</span>
            <p className="text-xs text-muted-foreground">{fmt(grandTotalMonthly)}/mo</p>
            {hasDeltas && diffAnnual !== 0 && (
              <p className={`text-xs font-semibold italic ${diffColor(diffAnnual + diffEmployerContributions)}`}>{fmtDiff(diffAnnual + diffEmployerContributions)}/yr</p>
            )}
          </div>
        </>
      )}
      {/* Financial quick-reference boxes — docked bottom-right, single row */}
      <div className="ml-auto flex items-stretch gap-2">
        {/* Annual WCB — employer-paid Workers' Compensation premium, estimated from payroll */}
        <div className="rounded-lg border border-accent/50 bg-card px-3 py-1.5 text-right shadow-sm">
          <span className="text-xs font-medium text-muted-foreground">Annual WCB</span>
          <p className="text-base font-bold text-foreground leading-tight">~{fmt(wcbAnnual)}</p>
          <p className="text-[10px] text-muted-foreground"><span className="italic font-semibold text-amber-600">estimate</span></p>
        </div>
        {/* Monthly Victor insurance benefits — employer + employee shares */}
        <div className="rounded-lg border border-accent/50 bg-card px-3 py-1.5 text-right shadow-sm">
          <span className="text-xs font-medium text-muted-foreground">Monthly Victor Insurance Benefits</span>
          <p className="text-base font-bold text-foreground leading-tight">~{fmt(BENEFITS_MONTHLY * 2)}</p>
          <p className="text-[10px] text-muted-foreground">
            employer {fmt(BENEFITS_MONTHLY)} + employee {fmt(BENEFITS_MONTHLY)} · <span className="italic font-semibold text-amber-600">estimate</span>
          </p>
        </div>
        {/* Bi-weekly Payworks Total — actual amount Payworks withdraws:
            gross wages + employer CPP/EI, minus the staff benefits deduction
            skimmed from wages and kept by Candora. */}
        <div className="rounded-lg border border-accent/50 bg-card px-3 py-1.5 text-right shadow-sm">
          <span className="text-xs font-medium text-muted-foreground">Bi-weekly Payworks Total</span>
          <p className="text-base font-bold text-foreground leading-tight">{fmt(payworksBiweekly)}</p>
          <p className="text-[10px] text-muted-foreground">
            incl. {fmt(totalEmployerContributions / 26)} employer CPP/EI · less {fmt(benefitsSkim)} employee contribution for benefits retained by Candora
          </p>
        </div>
      </div>
    </div>
  );
}