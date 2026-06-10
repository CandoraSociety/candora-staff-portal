import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

import WelcomeWidget from '@/components/dashboard/WelcomeWidget';
import QuickLinksWidget from '@/components/dashboard/QuickLinksWidget';
import AnnouncementsWidget from '@/components/dashboard/AnnouncementsWidget';
import StatsWidget from '@/components/dashboard/StatsWidget';
import RecentActivityWidget from '@/components/dashboard/RecentActivityWidget';
import { Button } from '@/components/ui/button';
import { FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

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