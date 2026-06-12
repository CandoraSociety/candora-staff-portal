import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Upload, Save, X, Image as ImageIcon, LayoutGrid, List, ChevronDown, ChevronUp, User, Briefcase, Calendar, Edit, BarChart2, Activity, Megaphone, Clock, CheckSquare, TrendingUp, FileText, Users, Star, Bell } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import CropImageDialog from '@/components/settings/CropImageDialog';
import EditEmployeeDialog from '@/components/settings/EditEmployeeDialog';
import ProfileEffectsDialog from '@/components/settings/ProfileEffectsDialog';

export default function UserSettings() {
  const { user: currentUser } = useOutletContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [employeeInfoExpanded, setEmployeeInfoExpanded] = useState(true);

  const { data: preferences } = useQuery({
    queryKey: ['dashboardPreferences', currentUser?.id],
    queryFn: () => base44.entities.UserDashboardPreference.filter({ user_id: currentUser?.id }).then(data => data[0]),
    enabled: !!currentUser?.id,
  });

  const { data: employeeRecord } = useQuery({
    queryKey: ['employeeRecord', currentUser?.email],
    queryFn: () => base44.entities.Employee.filter({ email: currentUser?.email }).then(data => data[0]),
    enabled: !!currentUser?.email,
  });

  const { data: allPortals = [] } = useQuery({
    queryKey: ['allPortals'],
    queryFn: () => base44.entities.PortalCard.list(),
  });

  const [profilePicture, setProfilePicture] = useState(currentUser?.avatar_url || '');
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
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editEmployeeOpen, setEditEmployeeOpen] = useState(false);
  const [effectsDialogOpen, setEffectsDialogOpen] = useState(false);
  const [effectsImageSrc, setEffectsImageSrc] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = async (croppedImageUrl) => {
    setIsSavingProfile(true);
    try {
      await base44.auth.updateMe({ avatar_url: croppedImageUrl });
      setProfilePicture(croppedImageUrl);
      queryClient.setQueryData(['currentUser'], (old) => old ? { ...old, avatar_url: croppedImageUrl } : old);
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setCropDialogOpen(false);
      setImageToCrop(null);
    } catch (error) {
      alert('Failed to save: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSavingProfile(false);
    }
  };

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

  const loadAsDataUrl = async (url, onLoad) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = () => onLoad(reader.result);
      reader.readAsDataURL(blob);
    } catch {
      onLoad(url);
    }
  };

  const PRESET_WIDGETS = [
    { id: 'stats', label: 'Statistics', description: 'Quick metrics and counts at a glance', icon: BarChart2, color: '#3b82f6' },
    { id: 'announcements', label: 'Announcements', description: 'Organization-wide notices and updates', icon: Megaphone, color: '#f59e0b' },
    { id: 'recent_activity', label: 'Recent Activity', description: 'Your latest files, notes and actions', icon: Activity, color: '#10b981' },
    { id: 'my_tasks', label: 'My Tasks', description: 'Compass tasks and to-dos assigned to you', icon: CheckSquare, color: '#8b5cf6' },
    { id: 'upcoming_events', label: 'Upcoming Events', description: 'Events and programs happening soon', icon: Calendar, color: '#ef4444' },
    { id: 'quick_notes', label: 'Quick Notes', description: 'Pin and access your recent notes', icon: FileText, color: '#06b6d4' },
    { id: 'team_birthdays', label: 'Team Birthdays', description: 'Upcoming birthdays and work anniversaries', icon: Star, color: '#f97316' },
    { id: 'recent_clients', label: 'Recent Clients', description: 'Clients you recently worked with', icon: Users, color: '#6366f1' },
    { id: 'my_reminders', label: 'My Reminders', description: "Deadlines and reminders you've set", icon: Bell, color: '#ec4899' },
    { id: 'project_progress', label: 'Project Progress', description: 'Status of active projects and grants', icon: TrendingUp, color: '#84cc16' },
    { id: 'time_log', label: 'Time Log', description: 'Quick access to log your hours', icon: Clock, color: '#78716c' },
  ];

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
          <h1 className="text-3xl font-display font-bold">My Settings</h1>
          <p className="text-muted-foreground mt-1">Customize your dashboard and profile</p>
        </div>

        {/* Profile Picture */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Upload a photo to personalize your profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <Avatar className="w-48 h-48 relative flex-shrink-0">
                <AvatarImage src={profilePicture} className="object-cover" />
                <AvatarFallback className="text-5xl bg-primary text-primary-foreground">
                  {(currentUser?.full_name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
                {isSavingProfile && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </Avatar>
              <div className="space-y-2">
                <Label htmlFor="profile-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <Upload className="w-4 h-4" />
                    <span>Upload new photo</span>
                  </div>
                  <Input
                    id="profile-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isSavingProfile}
                  />
                </Label>
                {profilePicture && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadAsDataUrl(profilePicture, (src) => { setImageToCrop(src); setCropDialogOpen(true); })}
                      disabled={isSavingProfile}
                    >
                      <ImageIcon className="w-3 h-3 mr-1" />
                      Reposition
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadAsDataUrl(profilePicture, (src) => { setEffectsImageSrc(src); setEffectsDialogOpen(true); })}
                      disabled={isSavingProfile}
                    >
                      🎨 Effects
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        setProfilePicture('');
                        await base44.auth.updateMe({ avatar_url: '' });
                        queryClient.setQueryData(['currentUser'], (old) => old ? { ...old, avatar_url: '' } : old);
                        await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
                      }}
                      disabled={isSavingProfile}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Tip: After uploading, you can drag to reposition and zoom to get the perfect crop. Your photo saves automatically.
            </p>
          </CardContent>
        </Card>

        {/* Employee Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Employee Information</CardTitle>
                <CardDescription>Your employment details</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditEmployeeOpen(true)} className="gap-2">
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEmployeeInfoExpanded(!employeeInfoExpanded)} className="gap-2">
                  {employeeInfoExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {employeeInfoExpanded ? 'Collapse' : 'Expand'}
                </Button>
              </div>
            </div>
          </CardHeader>
          {employeeInfoExpanded && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="font-medium">{employeeRecord?.first_name || currentUser?.full_name || 'N/A'}</p>
                  </div>
                </div>
                {employeeRecord ? (
                  <>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Briefcase className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Position</p>
                        <p className="font-medium">{employeeRecord.position}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Start Date</p>
                        <p className="font-medium">{employeeRecord.hire_date ? new Date(employeeRecord.hire_date).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Briefcase className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Department</p>
                        <p className="font-medium">{employeeRecord.department}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="col-span-2 p-4 text-center text-sm text-muted-foreground">
                    Employee record not found. Click "Edit" to add your employment details.
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

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
                return (
                  <div
                    key={widget.id}
                    onClick={() => toggleWidget(widget.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${
                      enabled
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40 opacity-60 hover:opacity-80'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: widget.color + '22' }}>
                      <Icon className="w-5 h-5" style={{ color: widget.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{widget.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{widget.description}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full flex-shrink-0 border-2 ${enabled ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`}>
                      {enabled && <div className="w-full h-full rounded-full bg-primary flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-3">{enabledWidgets.length} of {PRESET_WIDGETS.length} widgets enabled</p>
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

        <CropImageDialog
          open={cropDialogOpen}
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
          onClose={() => { setCropDialogOpen(false); setImageToCrop(null); }}
        />

        <ProfileEffectsDialog
          open={effectsDialogOpen}
          imageSrc={effectsImageSrc}
          onSave={async (url) => {
            setProfilePicture(url);
            await base44.auth.updateMe({ avatar_url: url });
            queryClient.setQueryData(['currentUser'], (old) => old ? { ...old, avatar_url: url } : old);
            await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            setEffectsDialogOpen(false);
            setEffectsImageSrc(null);
          }}
          onClose={() => { setEffectsDialogOpen(false); setEffectsImageSrc(null); }}
        />

        <EditEmployeeDialog
          open={editEmployeeOpen}
          employeeRecord={employeeRecord}
          currentUser={currentUser}
          onClose={() => setEditEmployeeOpen(false)}
          onSave={() => {
            queryClient.invalidateQueries(['employeeRecord', currentUser?.email]);
            setEditEmployeeOpen(false);
          }}
        />
      </div>
    </div>
  );
}