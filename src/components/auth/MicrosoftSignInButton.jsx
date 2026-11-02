import { Building2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { safeReturnTo } from '@/lib/authReturnTo';

export default function MicrosoftSignInButton() {
  return (
    <Button type="button" variant="outline" className="w-full h-12 text-sm font-medium mb-3" onClick={() => base44.auth.loginWithProvider('microsoft', safeReturnTo())}>
      <Building2 className="w-5 h-5 mr-2" aria-hidden="true" />
      Continue with Microsoft
    </Button>
  );
}