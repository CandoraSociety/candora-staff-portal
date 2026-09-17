import React from 'react';
import { CreditCard } from 'lucide-react';
import CCReceiptsUploadSection from '@/components/ccreceipts/CCReceiptsUploadSection';
import CCSubmittedReceipts from '@/components/ccreceipts/CCSubmittedReceipts';

// Candora CC Receipts — staff upload receipts for purchases made on the
// Candora MasterCard and submit them to Finance, which reviews them against
// the monthly card statement in the Finance portal's Candora MasterCard tab.
export default function CandoraCCReceipts() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight text-accent flex items-center gap-2">
          <CreditCard className="w-6 h-6" />Candora CC Receipts
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload a receipt for each purchase made with the Candora MasterCard. Once submitted, Finance reviews them against the monthly card statement in the Candora MasterCard tab of the Finance portal.
        </p>
      </div>

      <CCReceiptsUploadSection />
      <CCSubmittedReceipts />
    </div>
  );
}