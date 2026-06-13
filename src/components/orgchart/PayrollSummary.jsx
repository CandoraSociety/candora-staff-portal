// Payroll summary bar — annual / monthly / bi-weekly
export default function PayrollSummary({ positions, showSalary }) {
  if (!showSalary) return null;
  const annual = positions.reduce((s, p) => s + (p.salary || 0), 0);
  const monthly = annual / 12;
  const biweekly = annual / 26;
  const fmt = (n) => "$" + Math.round(n).toLocaleString();
  const filled = positions.filter(p => !p.is_vacant).length;
  const vacant = positions.filter(p => p.is_vacant).length;

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
      <span className="font-semibold text-foreground">{positions.length} positions</span>
      <span className="text-muted-foreground/40">|</span>
      <span>{filled} filled · {vacant} vacant</span>
      <span className="text-muted-foreground/40">|</span>
      <span><span className="font-medium text-foreground">Annual:</span> {fmt(annual)}</span>
      <span><span className="font-medium text-foreground">Monthly:</span> {fmt(monthly)}</span>
      <span><span className="font-medium text-foreground">Bi-weekly:</span> {fmt(biweekly)}</span>
    </div>
  );
}