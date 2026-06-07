import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, Pencil, ChevronDown, Mail, Phone, MapPin, Calendar, Award, Clock } from 'lucide-react';
import { format } from 'date-fns';
import moment from 'moment';
import { base44 } from '@/api/base44Client';
import StatusBadge from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EmployeeForm from './EmployeeForm';
import EmployeeHourStats from './EmployeeHourStats';
import { calculateMilestones } from '@/lib/employeeMilestones';

const statusColors = {
  active: 'bg-green-50 text-green-700 border-green-200',
  on_leave: 'bg-blue-50 text-blue-700 border-blue-200',
  terminated: 'bg-gray-50 text-gray-500 border-gray-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
  probation: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  occasional: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function EmployeeDetail({ employee, onEdit, onDelete }) {
  const [editOpen, setEditOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });

  const { data: timeLogs = [] } = useQuery({
    queryKey: ['employee-timelogs', employee?.id],
    queryFn: () => base44.entities.EmployeeTimeLog.filter({ employee_id: employee?.id }, '-date', 500),
    enabled: !!employee?.id,
  });

  const { data: recognitions = [] } = useQuery({
    queryKey: ['employee-recognition', employee?.id],
    queryFn: () => base44.entities.EmployeeRecognition.filter({ employee_id: employee?.id }, '-date_awarded', 50),
    enabled: !!employee?.id,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', employee?.id],
    queryFn: () => base44.entities.PerformanceReview.filter({ employee_id: employee?.id }, '-review_date', 10),
    enabled: !!employee?.id,
  });

  if (!employee) return null;

  const isDeceased = !!employee.is_deceased;
  const pendingMilestones = calculateMilestones(employee, timeLogs, recognitions);

  const handleStatusChange = async (newStatus) => {
    updateMutation.mutate({ id: employee.id, data: { status: newStatus } });
    setStatusOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* In Memoriam Banner */}
      {isDeceased && (
        <div className="bg-gradient-to-r from-purple-100 via-amber-50 to-purple-100 border border-purple-200 rounded-xl p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse"></div>
          <div className="relative">
            <p className="text-4xl mb-3">🕊️</p>
            <h2 className="text-xl font-bold text-purple-900">In Memoriam</h2>
            <p className="text-purple-700 mt-2">
              {employee.first_name} {employee.last_name} is forever remembered with gratitude for their dedicated service.
            </p>
            {employee.deceased_date && (
              <p className="text-sm text-purple-600 mt-2">
                Passed away {format(new Date(employee.deceased_date), 'MMMM d, yyyy')}.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Header with Actions */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${isDeceased ? 'bg-gray-200 text-gray-600' : 'bg-primary/10 text-primary'}`}>
            {isDeceased ? '🕊️' : `${employee.first_name?.[0]}${employee.last_name?.[0]}`}
          </div>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              {employee.first_name} {employee.last_name}
              {isDeceased && <span className="text-2xl">🕊️</span>}
            </h2>
            <p className="text-muted-foreground">{employee.position} • {employee.department}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={statusColors[employee.status] || statusColors.active}>{employee.status.replace(/_/g, ' ')}</Badge>
              {employee.hire_date && (
                <Badge variant="outline" className="text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  Hired {format(new Date(employee.hire_date), 'MMM d, yyyy')}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <DropdownMenu open={statusOpen} onOpenChange={setStatusOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><Pencil className="w-4 h-4 mr-1" />Status</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {['active', 'on_leave', 'probation', 'occasional', 'suspended', 'terminated'].map(s => (
                <DropdownMenuItem key={s} onClick={() => handleStatusChange(s)}>
                  {s.replace(/_/g, ' ')}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}><Edit2 className="w-4 h-4 mr-1" />Edit</Button>
          <Button variant="destructive" size="sm" onClick={onDelete}><Trash2 className="w-4 h-4 mr-1" />Delete</Button>
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-muted-foreground text-xs">Email</p>
            <p className="font-medium">{employee.email}</p>
          </div>
        </div>
        {employee.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground text-xs">Phone</p>
              <p className="font-medium">{employee.phone}</p>
            </div>
          </div>
        )}
        {employee.city && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground text-xs">City</p>
              <p className="font-medium">{employee.city}</p>
            </div>
          </div>
        )}
        {employee.birth_date && (
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground text-xs">Birthday</p>
              <p className="font-medium">{format(new Date(employee.birth_date), 'MMM d')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Hours Stats */}
      <EmployeeHourStats timeLogs={timeLogs} />

      {/* Performance Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Award className="w-4 h-4" /> Performance Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews on file.</p>
          ) : (
            <div className="space-y-2">
              {reviews.map(rev => (
                <div key={rev.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{rev.review_period}</span>
                    {rev.review_date && <span className="text-muted-foreground">{format(new Date(rev.review_date), 'MMM d, yyyy')}</span>}
                  </div>
                  <StatusBadge status={rev.overall_rating} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recognition & Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Award className="w-4 h-4" /> Recognition & Milestones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recognitions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recognitions yet.</p>
          ) : (
            <div className="grid gap-3">
              {recognitions.map((rec) => (
                <div key={rec.id} className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
                  <span className="text-2xl">
                    {rec.type === 'milestone_hours' ? '⏱️' : rec.type === 'years_of_service' ? '🏆' : rec.type === 'employee_of_month' ? '⭐' : '🎖️'}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{rec.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {rec.type?.replace(/_/g, ' ')} • {rec.date_awarded ? format(new Date(rec.date_awarded), 'MMM d, yyyy') : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {pendingMilestones.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Pending Milestones</p>
              <div className="grid gap-2">
                {pendingMilestones.map((m) => (
                  <div key={m.milestone_key} className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <span className="text-2xl">{m.icon}</span>
                    <p className="font-medium text-sm">{m.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Employee</DialogTitle></DialogHeader>
          <EmployeeForm employee={employee} onSubmit={(data) => { updateMutation.mutate({ id: employee.id, data }); setEditOpen(false); }} isLoading={updateMutation.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}