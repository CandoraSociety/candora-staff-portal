import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserCog } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import CaseworkerManager from '@/components/rc/CaseworkerManager';

// Only managers, supervisors (team leads), directors and the Executive Director
// can add or edit portal users.
const ALLOWED_ROLES = ['super_admin', 'admin', 'executive_director', 'manager', 'team_lead'];

export default function ManagePortalUsersButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!ALLOWED_ROLES.includes(user?.role)) return null;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <UserCog className="h-4 w-4" /> Manage Portal Users
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Manage Portal Users</DialogTitle></DialogHeader>
          <CaseworkerManager />
        </DialogContent>
      </Dialog>
    </>
  );
}