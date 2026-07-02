import React from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import WelcomeWidget from '@/components/dashboard/WelcomeWidget';
import QuickLinksWidget from '@/components/dashboard/QuickLinksWidget';
import AnnouncementsWidget from '@/components/dashboard/AnnouncementsWidget';
// LiveDataWidget moved to admin console
import RecentActivityWidget from '@/components/dashboard/RecentActivityWidget';
import EmployeeInfoCard from '@/components/dashboard/EmployeeInfoCard';
import OrganizerWidget from '@/components/dashboard/OrganizerWidget';
import CollapsibleWidget from '@/components/dashboard/CollapsibleWidget';
import HowToSearch from '@/components/howto/HowToSearch';
import GoogleTranslateWidget from '@/components/dashboard/GoogleTranslateWidget';
import PortalTransition from '@/components/PortalTransition';
import GlobalSearch from '@/components/search/GlobalSearch';
import AppChangeRequestsWidget from '@/components/appchanges/AppChangeRequestsWidget';
import { FolderOpen, Sparkles, Settings, Search, LayoutGrid, Users, Megaphone, FileText, BarChart2, Calendar, Globe, BookOpen, Briefcase, Heart, Star, Layers, Pin, PinOff, Brain, Languages, Activity, Presentation, Mail } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/6a249282cb496579542673b7/c6b242905_Candoracirclelogo_noanniversary.png';

const ICON_MAP = {
  FolderOpen, LayoutGrid, Users, Megaphone, FileText, BarChart2,
  Calendar, Globe, BookOpen, Briefcase, Heart, Star, Layers, Sparkles,
  Presentation, Mail,
};

function PortalCard({ card, pinned, onPin }) {
  const IconComponent = ICON_MAP[card.icon] || LayoutGrid;
  return (
    <div className="group relative w-52 p-5 rounded-2xl border-2 border-border hover:border-primary/50 bg-card hover:shadow-lg transition-all cursor-pointer">
      {/* Pin toggle button */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPin(card.id); }}
        title={pinned ? 'Unpin from top' : 'Pin to top'}
        className={`absolute top-2 right-2 p-1 rounded-md transition-all ${pinned ? 'text-primary opacity-100' : 'text-muted-foreground opacity-0 group-hover:opacity-100'} hover:bg-muted`}
      >
        {pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
      </button>
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:opacity-90 transition-opacity"
          style={{ backgroundColor: card.color ? card.color + '22' : 'hsl(var(--primary)/0.1)' }}
        >
          <IconComponent className="h-6 w-6" style={{ color: card.color || 'hsl(var(--primary))' }} />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate"><span>{card.name}</span></h3>
          {card.description && (
            <p className="text-xs text-muted-foreground truncate"><span>{card.description}</span></p>
          )}
        </div>
      </div>
    </div>
  );
}

function PinnedPortalBanner({ card, onUnpin }) {
  const IconComponent = ICON_MAP[card.icon] || LayoutGrid;
  const inner = (
    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all cursor-pointer group">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: card.color ? card.color + '22' : 'hsl(var(--primary)/0.1)' }}>
          <IconComponent className="h-6 w-6" style={{ color: card.color || 'hsl(var(--primary))' }} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Pin className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-primary font-semibold uppercase tracking-wide">Pinned Portal</span>
          </div>
          <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-lg"><span>{card.name}</span></h3>
          {card.description && <p className="text-sm text-muted-foreground"><span>{card.description}</span></p>}
        </div>
      </div>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUnpin(); }}
        title="Unpin"
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded-md hover:bg-destructive/10 transition-colors flex-shrink-0"
      >
        <PinOff className="w-3.5 h-3.5" />
        Unpin
      </button>
    </div>
  );
  return card.is_external
    ? <a href={card.url} target="_blank" rel="noopener noreferrer">{inner}</a>
    : <Link to={card.url || '#'}>{inner}</Link>;
}

export default function Dashboard() {
  const { user, access, permissions } = useOutletContext();
  const queryClient = useQueryClient();

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

  const { data: dbWidgets = [] } = useQuery({
    queryKey: ['dashboardWidgets'],
    queryFn: () => base44.entities.DashboardWidget.list(),
  });

  const lockedWidgetIds = dbWidgets.filter(w => w.locked_to_dashboard).map(w => w.widget_id);

  const isWidgetActive = (id) =>
    lockedWidgetIds.includes(id) || (userPreferences?.enabled_widgets?.includes(id) ?? false);

  // Derive module ID from card URL (e.g. "/filemanager" → "filemanager")
  const getModuleIdFromCard = (card) => {
    if (!card.url) return null;
    return card.url.replace(/^\//, '').split('/')[0] || null;
  };

  const accessibleCards = cards.filter(card => {
    if (!card.is_enabled) return false;
    if (access.isAdmin) return true;
    const moduleId = getModuleIdFromCard(card);
    if (moduleId) return access.canAccessModule(moduleId);
    // Fallback for cards without a module mapping
    return access.canAccessCard(card);
  });

  // Apply user's portal visibility selections from "Add Functions" page.
  // If the user has selected specific portals, only show those.
  const visiblePortalIds = userPreferences?.visible_portal_ids;
  const displayCards = (visiblePortalIds && visiblePortalIds.length > 0)
    ? accessibleCards.filter(c => visiblePortalIds.includes(c.id))
    : accessibleCards;

  const pinnedPortalId = userPreferences?.pinned_portal_id || null;
  const pinnedCard = pinnedPortalId ? displayCards.find(c => c.id === pinnedPortalId) : null;

  const handlePin = async (cardId) => {
    const newPinnedId = pinnedPortalId === cardId ? null : cardId;
    try {
      if (userPreferences) {
        await base44.entities.UserDashboardPreference.update(userPreferences.id, { pinned_portal_id: newPinnedId });
      } else {
        await base44.entities.UserDashboardPreference.create({ user_id: user.id, pinned_portal_id: newPinnedId });
      }
      queryClient.invalidateQueries(['userPreferences', user?.id]);
    } catch {}
  };

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

      {/* Pinned Portal */}
      {pinnedCard && (
        <PinnedPortalBanner card={pinnedCard} onUnpin={() => handlePin(pinnedCard.id)} />
      )}

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
                <p className="text-primary text-lg font-semibold"><span>{user?.full_name || 'Guest'}</span></p>
                <p className="text-white/80 mt-1"><span>Your integrated management platform</span></p>
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

      {/* App Change Requests — admin review panel */}
      {user?.email?.toLowerCase() === 'graham.currie@candorasociety.com' && (
        <AppChangeRequestsWidget />
      )}

      {/* Portal Quick Links — horizontal scrolling row */}
      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
          {displayCards.filter(c => c.is_enabled).map(card => (
            card.is_external ? (
              <a key={card.id} href={card.url} target="_blank" rel="noopener noreferrer" className="block flex-shrink-0">
                <PortalCard card={card} pinned={pinnedPortalId === card.id} onPin={handlePin} />
              </a>
            ) : (
              <Link key={card.id} to={card.url || '#'} className="block flex-shrink-0">
                <PortalCard card={card} pinned={pinnedPortalId === card.id} onPin={handlePin} />
              </Link>
            )
          ))}
        </div>
      </div>
      
      {/* Live data moved to Admin > Users & Access */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {isWidgetActive('howto') && <HowToSearch user={user} />}
          {isWidgetActive('organizer') && (
            <CollapsibleWidget title="Personal Organizer" icon={Brain}>
              <OrganizerWidget />
            </CollapsibleWidget>
          )}
          {isWidgetActive('google_translate') && (
            <CollapsibleWidget title="Translate" icon={Languages}>
              <GoogleTranslateWidget />
            </CollapsibleWidget>
          )}
          <CollapsibleWidget title="Recent Activity" icon={Activity}>
            <RecentActivityWidget />
          </CollapsibleWidget>
        </div>
        <div>
          <CollapsibleWidget
            title="Announcements"
            icon={Megaphone}
            headerExtra={userAnnouncements.length > 0 ? <Badge variant="secondary" className="text-xs ml-2">{userAnnouncements.length}</Badge> : null}
          >
            <AnnouncementsWidget announcements={userAnnouncements} />
          </CollapsibleWidget>
        </div>
      </div>

    </div>
  );
}