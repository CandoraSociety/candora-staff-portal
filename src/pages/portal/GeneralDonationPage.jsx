import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, XCircle } from 'lucide-react';
import DonationPortal from '@/components/campaign-public/DonationPortal';

// The organization's public donation page: the campaigns still accepting gifts
// on one tab, a gift to the general fund on the other.
export default function GeneralDonationPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['general-donations'],
    queryFn: async () => (await base44.functions.invoke('getGeneralDonations', {})).data,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2 bg-background px-4 text-center">
        <XCircle className="w-8 h-8 text-muted-foreground" />
        <h1 className="text-xl font-display font-bold">Donations aren't available right now</h1>
        <p className="text-sm text-muted-foreground">Please try again in a moment.</p>
      </div>
    );
  }

  return <DonationPortal data={data} />;
}