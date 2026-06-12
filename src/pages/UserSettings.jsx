import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, ChevronDown, ChevronUp, User, Briefcase, Calendar, Edit, Sparkles, Move, Trash2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import CropImageDialog from '@/components/settings/CropImageDialog';
import EditEmployeeDialog from '@/components/settings/EditEmployeeDialog';
import ProfileEffectsDialog from '@/components/settings/ProfileEffectsDialog';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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



  const [profilePicture, setProfilePicture] = useState(currentUser?.avatar_url || '');
  const [originalPhoto, setOriginalPhoto] = useState(currentUser?.avatar_url || '');
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editEmployeeOpen, setEditEmployeeOpen] = useState(false);
  const [effectsDialogOpen, setEffectsDialogOpen] = useState(false);
  const [effectsImageSrc, setEffectsImageSrc] = useState(null);
  const [savedStickers, setSavedStickers] = useState([]);
  const [savedHairColor, setSavedHairColor] = useState('#1a1a1a');


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
      setOriginalPhoto(croppedImageUrl);
      setSavedStickers([]);
      setSavedHairColor('#1a1a1a');
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={isSavingProfile}>
                  <div className="relative group cursor-pointer">
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
                    {!isSavingProfile && (
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuItem asChild>
                    <Label htmlFor="profile-upload" className="flex items-center gap-2 cursor-pointer font-normal px-2 py-1.5">
                      <Upload className="w-4 h-4" />
                      Upload new photo
                      <Input
                        id="profile-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isSavingProfile}
                      />
                    </Label>
                  </DropdownMenuItem>
                  {profilePicture && (
                    <>
                      <DropdownMenuItem onClick={() => loadAsDataUrl(profilePicture, (src) => { setImageToCrop(src); setCropDialogOpen(true); })}>
                        <Move className="w-4 h-4" />
                        Reposition / Resize
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => loadAsDataUrl(originalPhoto, (src) => { setEffectsImageSrc(src); setEffectsDialogOpen(true); })}>
                        <Sparkles className="w-4 h-4" />
                        Edit Effects
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={async () => {
                          setProfilePicture('');
                          setOriginalPhoto('');
                          setSavedStickers([]);
                          setSavedHairColor('#1a1a1a');
                          await base44.auth.updateMe({ avatar_url: '' });
                          queryClient.setQueryData(['currentUser'], (old) => old ? { ...old, avatar_url: '' } : old);
                          await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove Photo
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="text-sm text-muted-foreground pt-2">
                Click your photo to upload, reposition, add effects, or remove it.
              </div>
            </div>
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

        <div className="flex-shrink-0 sticky bottom-0 bg-background pt-4 pb-6 border-t mt-auto">
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate('/')}>Back to Dashboard</Button>
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
          initialStickers={savedStickers}
          initialHairColor={savedHairColor}
          onSave={async (url, stickers, hairColor) => {
            setProfilePicture(url);
            setSavedStickers(stickers || []);
            setSavedHairColor(hairColor || '#1a1a1a');
            // Do NOT update originalPhoto — keeps the clean base for re-editing effects
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