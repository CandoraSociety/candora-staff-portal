import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

import WelcomeWidget from '@/components/dashboard/WelcomeWidget';
import QuickLinksWidget from '@/components/dashboard/QuickLinksWidget';
import AnnouncementsWidget from '@/components/dashboard/AnnouncementsWidget';
import StatsWidget from '@/components/dashboard/StatsWidget';
import RecentActivityWidget from '@/components/dashboard/RecentActivityWidget';

export default function Dashboard() {
  const { user, access, permissions } = useOutletContext();

  const { data: cards = [] } = useQuery({
    queryKey: ['portalCards'],
    queryFn: () => base44.entities.PortalCard.list(),
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => base44.entities.Announcement.list('-created_date'),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: access.isAdmin,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list(),
    enabled: access.isAdmin,
  });

  const accessibleCards = cards.filter(card => access.canAccessCard(card));

  const userAnnouncements = announcements.filter(a => {
    if (!a.is_active) return false;
    if (a.expires_at && new Date(a.expires_at) < new Date()) return false;
    if (a.target_roles && a.target_roles.length > 0) {
      return a.target_roles.includes(user?.role);
    }
    return true;
  });

  const stats = access.isAdmin ? {
    users: allUsers.length,
    cards: cards.filter(c => c.is_enabled).length,
    departments: departments.length,
    permissions: permissions.length,
  } : null;

  return (
    <div className="space-y-6">
      <WelcomeWidget user={user} />
      
      {access.isAdmin && stats && <StatsWidget stats={stats} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <QuickLinksWidget cards={accessibleCards} />
          <RecentActivityWidget />
        </div>
        <div>
          <AnnouncementsWidget announcements={userAnnouncements} />
        </div>
      </div>
    </div>
  );
}