import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const FALLBACK_LOGO = 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/d5980b065_candora-360-logo.png';
const FALLBACK_LONG_LOGO = 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/5625645f1_LongFormLogo.png';

export function useOrgSettings() {
  const { data: list = [], isLoading } = useQuery({
    queryKey: ['orgSettings'],
    queryFn: () => base44.entities.OrgSettings.list(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
  const s = list[0] || {};
  const logos = s.logos || [];
  const longLogo = logos.find((l) => l.name?.toLowerCase().includes('long')) || null;
  const noAnniversary = logos.find((l) => /no anniversary/i.test(l.name || '') && !/circle/i.test(l.name || ''));
  return {
    orgName: s.org_name || 'Candora',
    logoUrl: s.logo_url || FALLBACK_LOGO,
    longLogoUrl: s.logo_long_form_url || longLogo?.url || s.logo_url || FALLBACK_LONG_LOGO,
    invoiceLogoUrl: s.logo_long_form_url || noAnniversary?.url || longLogo?.url || s.logo_url || FALLBACK_LONG_LOGO,
    alternateLogoUrls: s.alternate_logo_urls || [],
    brandLogoSelection: s.brand_logo_selection || {},
    logos,
    primaryColor: s.primary_color || '#f5c116',
    secondaryColor: s.secondary_color || '#0f1f6b',
    accentColor: s.accent_color || '#005afd',
    welcomeMessage: s.welcome_message || 'Welcome to Candora 360',
    tierPortalAccess: s.tier_portal_access || {},
    ownerEmail: s.owner_email || null,
    isLoading,
  };
}