import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { Save, X } from 'lucide-react';

const DEPARTMENTS = [
  'Administration', 'Operations', 'Finance', 'Human Resources',
  'Marketing', 'IT', 'Sales', 'Customer Service', 'Legal', 'Other'
];

function buildInitialForm(employeeRecord, currentUser) {
  // Only fall back to full_name if there's no employee record at all and full_name looks like a real name (has a space)
  const fullName = currentUser?.full_name || '';
  const hasSpace = fullName.includes(' ');
  return {
    first_name: employeeRecord?.first_name || (hasSpace ? fullName.split(' ')[0] : ''),
    last_name: employeeRecord?.last_name || (hasSpace ? fullName.split(' ').slice(1).join(' ') : ''),
    email: employeeRecord?.email || currentUser?.email || '',
    phone: employeeRecord?.phone || '',
    department: employeeRecord?.department || '',
    custom_department: '',
  };
}

export default function EditEmployeeDialog({ open, employeeRecord, currentUser, onClose, onSave }) {
  const [formData, setFormData] = useState(() => buildInitialForm(employeeRecord, currentUser));
  const [isSaving, setIsSaving] = useState(false);

  // Re-initialise whenever the dialog opens with fresh data
  useEffect(() => {
    if (open) {
      setFormData(buildInitialForm(employeeRecord, currentUser));
    }
  }, [open, employeeRecord, currentUser]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const dept = formData.department === 'Other' && formData.custom_department.trim()
        ? formData.custom_department.trim()
        : formData.department;

      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        department: dept || '',
      };

      if (employeeRecord) {
        await base44.entities.Employee.update(employeeRecord.id, payload);
      } else {
        await base44.entities.Employee.create({ ...payload, position: '' });
      }
      onSave();
    } catch (error) {
      console.error('Error saving employee record:', error);
      alert('Failed to save: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Contact Information</DialogTitle>
          <DialogDescription>Update your personal contact details</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Department</Label>
            <Select value={formData.department} onValueChange={(value) => handleChange('department', value)}>
              <SelectTrigger>
                <SelectValue placeholder="No department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>No department</SelectItem>
                {DEPARTMENTS.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.department === 'Other' && (
              <Input
                placeholder="Please specify your department"
                value={formData.custom_department}
                onChange={(e) => handleChange('custom_department', e.target.value)}
                className="mt-2"
              />
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}