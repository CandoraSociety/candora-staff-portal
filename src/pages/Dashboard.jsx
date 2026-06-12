import React, { useState } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

import WelcomeWidget from '@/components/dashboard/WelcomeWidget';
import QuickLinksWidget from '@/components/dashboard/QuickLinksWidget';
import AnnouncementsWidget from '@/components/dashboard/AnnouncementsWidget';
import StatsWidget from '@/components/dashboard/StatsWidget';
import RecentActivityWidget from '@/components/dashboard/RecentActivityWidget';
import EmployeeInfoCard from '@/components/dashboard/EmployeeInfoCard';
import PortalTransition from '@/components/PortalTransition';
import GlobalSearch from '@/components/search/GlobalSearch';
import { FolderOpen, Sparkles, Settings, Search, LayoutGrid, Users, Megaphone, FileText, BarChart2, Calendar, Globe, BookOpen, Briefcase, Heart, Star, Layers } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/6a249282cb496579542673b7/c6b242905_Candoracirclelogo_noanniversary.png';

const ICON_MAP = {
  FolderOpen, LayoutGrid, Users, Megaphone, FileText, BarChart2,
  Calendar, Globe, BookOpen, Briefcase, Heart, Star, Layers, Sparkles,
};

function PortalCard({ card }) {
  const IconComponent = ICON_MAP[card.icon] || LayoutGrid;
  return (
    <div className="group w-52 p-5 rounded-2xl border-2 border-border hover:border-primary/50 bg-card hover:shadow-lg transition-all cursor-pointer">
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:opacity-90 transition-opacity"
          style={{ backgroundColor: card.color ? card.color + '22' : 'hsl(var(--primary)/0.1)' }}
        >
          <IconComponent
            className="h-6 w-6"
            style={{ color: card.color || 'hsl(var(--primary))' }}
          />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{card.name}</h3>
          {card.description && (
            <p className="text-xs text-muted-foreground truncate">{card.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

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

  const { data: userPreferences } = useQuery({
    queryKey: ['userPreferences', user?.id],
    queryFn: async () => {
      const prefs = await base44.entities.UserDashboardPreference.filter({ user_id: user?.id });
      return prefs[0] || null;
    },
    enabled: !!user?.id,
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
      {/* Employee Info Card */}
      <EmployeeInfoCard user={user} />

      {/* Hero Section with Logo */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-accent via-accent/90 to-accent-foreground p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        <div className="relative z-10 flex items-center gap-8">
          <img src={LOGO_URL} alt="Candora" className="h-32 w-32 flex-shrink-0 drop-shadow-lg" />
          <div>
            <div className="flex items-start justify-between w-full">
              <div>
                <h1 className="text-4xl font-display font-bold text-white mb-2">
                  Welcome Back
                </h1>
                <p className="text-primary text-lg font-semibold">{user?.full_name || 'Guest'}</p>
                <p className="text-white/80 mt-1">Your integrated management platform</p>
              </div>
              <Link 
                to="/user/settings" 
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
              >
                <Settings className="w-4 h-4" />
                Customize
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Portal Quick Links — horizontal scrolling row */}
      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
          {accessibleCards.filter(c => c.is_enabled).map(card => (
            card.is_external ? (
              <a key={card.id} href={card.url} target="_blank" rel="noopener noreferrer" className="block flex-shrink-0">
                <PortalCard card={card} />
              </a>
            ) : (
              <Link key={card.id} to={card.url || '#'} className="block flex-shrink-0">
                <PortalCard card={card} />
              </Link>
            )
          ))}
        </div>
      </div>
      
      {access.isAdmin && stats && <StatsWidget stats={stats} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecentActivityWidget />
        </div>
        <div>
          <AnnouncementsWidget announcements={userAnnouncements} />
        </div>
      </div>
    </div>
  );
}