import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Upload, Save, X, Image as ImageIcon, LayoutGrid, List, ChevronDown, ChevronUp, User, Briefcase, Calendar, Edit } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import CropImageDialog from '@/components/settings/CropImageDialog';
import EditEmployeeDialog from '@/components/settings/EditEmployeeDialog';

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
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editEmployeeOpen, setEditEmployeeOpen] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageToCrop(file_url);
      setCropDialogOpen(true);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
    }
  };

  const handleCropComplete = async (croppedImageUrl) => {
    setIsSavingProfile(true);
    try {
      console.log('Saving avatar:', croppedImageUrl?.length);
      const result = await base44.auth.updateMe({ avatar_url: croppedImageUrl });
      console.log('Update result:', result);
      setProfilePicture(croppedImageUrl);
      queryClient.setQueryData(['currentUser'], (old) => old ? { ...old, avatar_url: croppedImageUrl } : old);
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setCropDialogOpen(false);
      setImageToCrop(null);
      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error saving cropped image:', error);
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
        });
      } else {
        await base44.entities.UserDashboardPreference.create({
          user_id: currentUser.id,
          layout_preference: layout,
          show_stats_widget: showStats,
          show_recent_activity: showActivity,
          show_announcements: showAnnouncements,
          visible_portal_ids: visiblePortals,
        });
      }
      queryClient.invalidateQueries(['dashboardPreferences', currentUser?.id]);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save settings. Please try again.');
    }
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditEmployeeOpen(true)}
                  className="gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEmployeeInfoExpanded(!employeeInfoExpanded)}
                  className="gap-2"
                >
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
            <Button
              variant={layout === 'grid' ? 'default' : 'outline'}
              onClick={() => setLayout('grid')}
              className="flex-1"
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Grid
            </Button>
            <Button
              variant={layout === 'list' ? 'default' : 'outline'}
              onClick={() => setLayout('list')}
              className="flex-1"
            >
              <List className="w-4 h-4 mr-2" />
              List
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Widget Visibility */}
      <Card>
        <CardHeader>
          <CardTitle>Widget Visibility</CardTitle>
          <CardDescription>Choose which widgets to show on your dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Statistics Widget</Label>
              <p className="text-xs text-muted-foreground">Show quick stats and metrics</p>
            </div>
            <Switch checked={showStats} onCheckedChange={setShowStats} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Recent Activity</Label>
              <p className="text-xs text-muted-foreground">Show your recent files and notes</p>
            </div>
            <Switch checked={showActivity} onCheckedChange={setShowActivity} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Announcements</Label>
              <p className="text-xs text-muted-foreground">Show organization announcements</p>
            </div>
            <Switch checked={showAnnouncements} onCheckedChange={setShowAnnouncements} />
          </div>
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
            <Button variant="outline" onClick={() => navigate('/')}>
              Cancel
            </Button>
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
        onClose={() => {
          setCropDialogOpen(false);
          setImageToCrop(null);
        }}
      />

      <EditEmployeeDialog
        open={editEmployeeOpen}
        employee={employeeRecord}
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