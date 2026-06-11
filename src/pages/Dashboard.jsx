import React, { useState } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

import WelcomeWidget from '@/components/dashboard/WelcomeWidget';
import QuickLinksWidget from '@/components/dashboard/QuickLinksWidget';
import AnnouncementsWidget from '@/components/dashboard/AnnouncementsWidget';
import StatsWidget from '@/components/dashboard/StatsWidget';
import RecentActivityWidget from '@/components/dashboard/RecentActivityWidget';
import PortalTransition from '@/components/PortalTransition';
import GlobalSearch from '@/components/search/GlobalSearch';
import { FolderOpen, Sparkles, Settings, Search } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/6a249282cb496579542673b7/c6b242905_Candoracirclelogo_noanniversary.png';

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
      {/* Search Bar */}
      <div className="max-w-2xl">
        <GlobalSearch user={user} access={access} />
      </div>

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

      {/* Global Search Bar */}
      <div className="max-w-2xl">
        <GlobalSearch user={user} access={access} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/filemanager">
          <div className="group p-6 rounded-2xl border-2 border-border hover:border-primary/50 bg-card hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <FolderOpen className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">File Manager</h3>
                <p className="text-sm text-muted-foreground">Cloud Storage Portal</p>
              </div>
            </div>
          </div>
        </Link>
        
        <Link to="/pathways">
          <div className="group p-6 rounded-2xl border-2 border-border hover:border-primary/50 bg-card hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <span className="text-primary font-bold text-lg">P</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Pathways CM</h3>
                <p className="text-sm text-muted-foreground">Case Management</p>
              </div>
            </div>
          </div>
        </Link>
        
        <Link to="/marketing">
          <div className="group p-6 rounded-2xl border-2 border-border hover:border-primary/50 bg-card hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <span className="text-primary font-bold text-lg">M</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Marketing</h3>
                <p className="text-sm text-muted-foreground">Fundraising Manager</p>
              </div>
            </div>
          </div>
        </Link>
        
        <Link to="/volunteermgr">
          <div className="group p-6 rounded-2xl border-2 border-border hover:border-primary/50 bg-card hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <span className="text-primary font-bold text-lg">V</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Volunteer Mgr</h3>
                <p className="text-sm text-muted-foreground">Volunteer Management</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
      
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