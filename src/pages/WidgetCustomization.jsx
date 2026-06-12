import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, LayoutGrid, List, BarChart2, Activity, Megaphone, Clock, CheckSquare, TrendingUp, FileText, Users, Star, Bell, ImageIcon, Brain, HelpCircle, CalendarClock, LayoutDashboard } from 'lucide-react';

const ICON_MAP = {
  BarChart2, Activity, Megaphone, Clock, CheckSquare, TrendingUp, FileText,
  Users, Star, Bell, Brain, HelpCircle, CalendarClock, LayoutDashboard,
};
import { useOutletContext } from 'react-router-dom';

export default function WidgetCustomization() {
  const { user: currentUser } = useOutletContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: preferences } = useQuery({
    queryKey: ['dashboardPreferences', currentUser?.id],
    queryFn: () => base44.entities.UserDashboardPreference.filter({ user_id: currentUser?.id }).then(data => data[0]),
    enabled: !!currentUser?.id,
  });

  const { data: allPortals = [] } = useQuery({
    queryKey: ['allPortals'],
    queryFn: () => base44.entities.PortalCard.list(),
  });

  const { data: dbWidgets = [] } = useQuery({
    queryKey: ['dashboardWidgets'],
    queryFn: () => base44.entities.DashboardWidget.list(),
  });

  const [layout, setLayout] = useState(preferences?.layout_preference || 'grid');
  const [showStats, setShowStats] = useState(preferences?.show_stats_widget ?? true);
  const [showActivity, setShowActivity] = useState(preferences?.show_recent_activity ?? true);
  const [showAnnouncements, setShowAnnouncements] = useState(preferences?.show_announcements ?? true);
  const [visiblePortals, setVisiblePortals] = useState(preferences?.visible_portal_ids || []);
  const [enabledWidgets, setEnabledWidgets] = useState(() => {
    const saved = preferences?.enabled_widgets;
    if (saved && saved.length > 0) return saved;
    return ['stats', 'announcements', 'recent_activity'];
  });

  const handleSavePreferences = async () => {
    try {
      if (preferences) {
        await base44.entities.UserDashboardPreference.update(preferences.id, {
          layout_preference: layout,
          show_stats_widget: showStats,
          show_recent_activity: showActivity,
          show_announcements: showAnnouncements,
          visible_portal_ids: visiblePortals,
          enabled_widgets: enabledWidgets,
        });
      } else {
        await base44.entities.UserDashboardPreference.create({
          user_id: currentUser.id,
          layout_preference: layout,
          show_stats_widget: showStats,
          show_recent_activity: showActivity,
          show_announcements: showAnnouncements,
          visible_portal_ids: visiblePortals,
          enabled_widgets: enabledWidgets,
        });
      }
      queryClient.invalidateQueries(['dashboardPreferences', currentUser?.id]);
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Failed to save settings. Please try again.');
    }
  };

  // Build widget list from DB, only those admin has enabled + set show_in_add_functions
  const PRESET_WIDGETS = [...dbWidgets]
    .filter(w => w.is_enabled && w.show_in_add_functions)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map(w => ({
      id: w.widget_id,
      label: w.name,
      description: w.description || '',
      icon: ICON_MAP[w.icon] || LayoutDashboard,
      color: w.color || '#6366f1',
      comingSoon: !!w.coming_soon,
    }));

  const toggleWidget = (widgetId) => {
    setEnabledWidgets(prev =>
      prev.includes(widgetId) ? prev.filter(id => id !== widgetId) : [...prev, widgetId]
    );
  };

  const togglePortal = (portalId) => {
    setVisiblePortals(prev =>
      prev.includes(portalId)
        ? prev.filter(id => id !== portalId)
        : [...prev, portalId]
    );
  };

  const accessiblePortals = allPortals.filter(card => {
    if (!currentUser?.role) return false;
    if (!card.allowed_roles || card.allowed_roles.length === 0) return true;
    return card.allowed_roles.includes(currentUser.role);
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col max-w-4xl mx-auto">
      <div className="flex-shrink-0 space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Add Functions</h1>
          <p className="text-muted-foreground mt-1">Customize your dashboard widgets and shortcuts</p>
        </div>

        {/* Dashboard Layout */}
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Layout</CardTitle>
            <CardDescription>Choose how your dashboard content is displayed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button variant={layout === 'grid' ? 'default' : 'outline'} onClick={() => setLayout('grid')} className="flex-1">
                <LayoutGrid className="w-4 h-4 mr-2" />
                Grid
              </Button>
              <Button variant={layout === 'list' ? 'default' : 'outline'} onClick={() => setLayout('list')} className="flex-1">
                <List className="w-4 h-4 mr-2" />
                List
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Widget Visibility */}
        <Card>
          <CardHeader>
            <CardTitle>Home Widgets</CardTitle>
            <CardDescription>Choose which widgets appear on your home dashboard — click to toggle on or off</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESET_WIDGETS.map(widget => {
                const Icon = widget.icon;
                const enabled = enabledWidgets.includes(widget.id);
                const isComingSoon = widget.comingSoon;
                return (
                  <div
                    key={widget.id}
                    onClick={() => !isComingSoon && toggleWidget(widget.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all select-none ${
                      isComingSoon
                        ? 'border-border opacity-50 cursor-not-allowed'
                        : enabled
                          ? 'border-primary bg-primary/5 cursor-pointer'
                          : 'border-border hover:border-primary/40 opacity-60 hover:opacity-80 cursor-pointer'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: widget.color + '22' }}>
                      <Icon className="w-5 h-5" style={{ color: widget.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{widget.label}</p>
                        {isComingSoon && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wide">Coming Soon</span>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{widget.description}</p>
                    </div>
                    {!isComingSoon && (
                      <div className={`w-4 h-4 rounded-full flex-shrink-0 border-2 ${enabled ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`}>
                        {enabled && <div className="w-full h-full rounded-full bg-primary flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        </div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-3">{enabledWidgets.length} of {PRESET_WIDGETS.filter(w => !w.comingSoon).length} widgets enabled</p>
          </CardContent>
        </Card>

        {/* Portal Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Portal Shortcuts</CardTitle>
            <CardDescription>Select which portals appear on your dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {accessiblePortals.map(portal => (
                <div
                  key={portal.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    visiblePortals.includes(portal.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => togglePortal(portal.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: portal.color || '#e2e8f0' }}>
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{portal.name}</p>
                      <p className="text-xs text-muted-foreground">{portal.category}</p>
                    </div>
                  </div>
                  {visiblePortals.includes(portal.id) && (
                    <Badge variant="default" className="text-xs">Visible</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex-shrink-0 sticky bottom-0 bg-background pt-4 pb-6 border-t mt-auto">
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate('/')}>Cancel</Button>
            <Button onClick={handleSavePreferences}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}