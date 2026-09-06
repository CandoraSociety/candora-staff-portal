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
  const payworksBiweekly = (annual + totalEmployerContributions - BENEFITS_ANNUAL) / 26;
  // WCB estimate — insurable payroll × industry rate per $100
  const wcbAnnual = annual * (WCB_RATE_PER_100 / 100);

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
    <div className="space-y-2 text-sm text-muted-foreground">
      {/* Scrolling stats row */}
      <div className="flex items-center gap-4 overflow-x-auto">
        <div className="shrink-0">
          <span>{filled} filled · {vacant} vacant</span>
        </div>
        <span className="text-muted-foreground/40">|</span>
        <div className="shrink-0">
          <span><span className="font-medium text-foreground">Annual:</span> {fmt(annual)}</span>
          {hasDeltas && diffAnnual !== 0 && (
            <p className={`text-xs font-semibold italic ${diffColor(diffAnnual)}`}>{fmtDiff(diffAnnual)}</p>
          )}
        </div>
        <div className="shrink-0">
          <span><span className="font-medium text-foreground">Monthly:</span> {fmt(monthly)}</span>
          {hasDeltas && diffMonthly !== 0 && (
            <p className={`text-xs font-semibold italic ${diffColor(diffMonthly)}`}>{fmtDiff(diffMonthly)}</p>
          )}
        </div>
        {showSalary && (
          <>
            <span className="text-muted-foreground/40">|</span>
            <div className="shrink-0">
              <span><span className="font-medium text-foreground">Employer CPP/EI:</span> {fmt(totalEmployerContributions)}</span>
              {hasDeltas && diffEmployerContributions !== 0 && (
                <p className={`text-xs font-semibold italic ${diffColor(diffEmployerContributions)}`}>{fmtDiff(diffEmployerContributions)}</p>
              )}
            </div>
            <div className="text-xs shrink-0">
              <span className="text-muted-foreground">CPP: {fmt(totalCPP)}</span>
              {hasDeltas && diffCPP !== 0 && (
                <p className={`text-xs font-semibold italic ${diffColor(diffCPP)}`}>{fmtDiff(diffCPP)}</p>
              )}
            </div>
            <div className="text-xs shrink-0">
              <span className="text-muted-foreground">EI: {fmt(totalEI)}</span>
              {hasDeltas && diffEI !== 0 && (
                <p className={`text-xs font-semibold italic ${diffColor(diffEI)}`}>{fmtDiff(diffEI)}</p>
              )}
            </div>
            <div className="text-xs shrink-0">
              <span className="text-muted-foreground">Benefits: {fmt(BENEFITS_ANNUAL)}/yr</span>
              <p className="text-xs text-muted-foreground/60 italic">(est. fixed)</p>
            </div>
          </>
        )}
      </div>

      {/* Financial quick-reference boxes — single row below the scrolling stats.
          Payworks Total = gross wages + employer CPP/EI, minus the staff benefits
          deduction skimmed from wages and kept by Candora. */}
      <div className="flex items-stretch gap-2">
        {/* Bi-weekly Payworks Total */}
        <div className="flex-1 flex items-center justify-between gap-2 rounded-lg border border-accent/50 bg-card px-3 py-1.5 shadow-sm">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Bi-weekly Payworks Total</span>
          <span className="text-sm font-bold text-foreground whitespace-nowrap">{fmt(payworksBiweekly)}</span>
        </div>
        {/* Monthly insurance benefits — employer + employee shares */}
        <div className="flex-1 flex items-center justify-between gap-2 rounded-lg border border-accent/50 bg-card px-3 py-1.5 shadow-sm">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Monthly Insurance Benefits</span>
          <span className="text-sm font-bold text-foreground whitespace-nowrap">
            ~{fmt(BENEFITS_MONTHLY * 2)} <span className="text-[10px] text-muted-foreground">employer + employee contr. · <span className="italic font-semibold text-amber-600">estimate</span></span>
          </span>
        </div>
        {/* Annual WCB — employer-paid Workers' Compensation premium, estimated from payroll */}
        <div className="flex-1 flex items-center justify-between gap-2 rounded-lg border border-accent/50 bg-card px-3 py-1.5 shadow-sm">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Annual WCB</span>
          <span className="text-sm font-bold text-foreground whitespace-nowrap">
            ~{fmt(wcbAnnual)} <span className="text-[10px] italic font-semibold text-amber-600">estimate</span>
          </span>
        </div>
      </div>
    </div>
  );
}