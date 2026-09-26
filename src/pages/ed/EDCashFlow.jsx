import FinanceCashFlow from "@/pages/finance/FinanceCashFlow";

// ED portal tab — reuses the Finance Portal's full Cash Flow Projection page
// (summary, assistant, assumptions, scenarios) so there's a single source of truth.
export default function EDCashFlow() {
  return (
    <div className="p-4 sm:p-6">
      <FinanceCashFlow />
    </div>
  );
}