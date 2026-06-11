import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { Save, X } from 'lucide-react';

const departments = [
  'Administration', 'Operations', 'Finance', 'Human Resources', 
  'Marketing', 'IT', 'Sales', 'Customer Service', 'Legal', 'Other'
];

const statuses = ['active', 'on_leave', 'terminated', 'suspended', 'probation', 'occasional'];

export default function EditEmployeeDialog({ open, employeeRecord, currentUser, onClose, onSave }) {
  const [formData, setFormData] = useState({
    first_name: employeeRecord?.first_name || currentUser?.full_name?.split(' ')[0] || '',
    last_name: employeeRecord?.last_name || currentUser?.full_name?.split(' ')?.slice(1).join(' ') || '',
    email: employeeRecord?.email || currentUser?.email || '',
    phone: employeeRecord?.phone || '',
    position: employeeRecord?.position || '',
    department: employeeRecord?.department || 'Administration',
    status: employeeRecord?.status || 'active',
    hire_date: employeeRecord?.hire_date || '',
    manager_email: employeeRecord?.manager_email || '',
    pay_grade: employeeRecord?.pay_grade || '',
    employee_id_number: employeeRecord?.employee_id_number || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (employeeRecord) {
        await base44.entities.Employee.update(employeeRecord.id, formData);
      } else {
        await base44.entities.Employee.create(formData);
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
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Employee Information</DialogTitle>
          <DialogDescription>
            Update your employment details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => handleChange('position', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={formData.department} onValueChange={(value) => handleChange('department', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Employment Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>{status.replace('_', ' ').toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hire_date">Hire Date</Label>
              <Input
                id="hire_date"
                type="date"
                value={formData.hire_date}
                onChange={(e) => handleChange('hire_date', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manager_email">Manager Email</Label>
              <Input
                id="manager_email"
                type="email"
                value={formData.manager_email}
                onChange={(e) => handleChange('manager_email', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay_grade">Pay Grade</Label>
              <Input
                id="pay_grade"
                value={formData.pay_grade}
                onChange={(e) => handleChange('pay_grade', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee_id_number">Employee ID Number</Label>
            <Input
              id="employee_id_number"
              value={formData.employee_id_number}
              onChange={(e) => handleChange('employee_id_number', e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
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