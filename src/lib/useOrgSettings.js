import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const FALLBACK_LOGO = 'https://media.base44.com/images/public/6a249282cb496579542673b7/c6b242905_Candoracirclelogo_noanniversary.png';

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
  return {
    orgName: s.org_name || 'Candora',
    logoUrl: s.logo_url || FALLBACK_LOGO,
    longLogoUrl: longLogo?.url || s.logo_url || FALLBACK_LOGO,
    primaryColor: s.primary_color || '#f5c116',
    secondaryColor: s.secondary_color || '#0f1f6b',
    accentColor: s.accent_color || '#2b2de8',
    welcomeMessage: s.welcome_message || 'Welcome to the Candora Staff Portal',
    tierPortalAccess: s.tier_portal_access || {},
    ownerEmail: s.owner_email || null,
    isLoading,
  };
}