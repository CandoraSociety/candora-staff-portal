import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Award, Clock, Edit2, Trash2, Pencil, Shield, FileText, Star, Activity, ChevronRight, Check, X, UserX, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import EmployeeForm from '@/components/employees/EmployeeForm';
import EmployeeHourStats from '@/components/employees/EmployeeHourStats';
import StatusBadge from '@/components/shared/StatusBadge';
import { calculateMilestones } from '@/lib/employeeMilestones';
import { formatPhoneNumber } from '@/lib/utils';
import { PORTAL_MODULES, TIER_LABELS } from '@/lib/tierPermissionPresets';
import ConcludeEmploymentDialog from '@/components/employees/ConcludeEmploymentDialog';
import DeleteEmployeeDialog from '@/components/employees/DeleteEmployeeDialog';

const TABS = [
  { id: 'overview',     label: 'Overview',    icon: Activity },
  { id: 'performance',  label: 'Performance', icon: Star },
  { id: 'documents',    label: 'Documents',   icon: FileText },
  { id: 'access',       label: 'Access',      icon: Shield },
];

const statusColors = {
  active:    'bg-green-50 text-green-700 border-green-200',
  on_leave:  'bg-blue-50 text-blue-700 border-blue-200',
  terminated:'bg-gray-50 text-gray-500 border-gray-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
  probation: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  occasional:'bg-purple-50 text-purple-700 border-purple-200',
};

export default function NexusEmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [concludeOpen, setConcludeOpen] = useState(false);

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => base44.entities.Employee.get(id),
    enabled: !!id,
  });

  const { data: timeLogs = [] } = useQuery({
    queryKey: ['employee-timelogs', id],
    queryFn: () => base44.entities.EmployeeTimeLog.filter({ employee_id: id }, '-date', 500),
    enabled: !!id,
  });

  const { data: recognitions = [] } = useQuery({
    queryKey: ['employee-recognition', id],
    queryFn: () => base44.entities.EmployeeRecognition.filter({ employee_id: id }, '-date_awarded', 50),
    enabled: !!id,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => base44.entities.PerformanceReview.filter({ employee_id: id }, '-review_date', 10),
    enabled: !!id,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['employee-documents', id],
    queryFn: () => base44.entities.EmployeeDocument.filter({ employee_id: id }, '-created_date', 50),
    enabled: !!id,
  });

  const { data: accessPerms = [] } = useQuery({
    queryKey: ['access-permissions', id],
    queryFn: () => base44.entities.AccessPermission.filter({ scope_value: id }),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Employee.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setEditOpen(false);
      toast({ title: 'Employee updated' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Employee.update(id, {
      is_deleted: true,
      deleted_at: new Date().toISOString().split('T')[0],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      navigate('/nexushr/employees');
      toast({ title: 'Employee deleted', description: 'Recoverable for 30 days from the Employees list.' });
    },
  });

  const concludeMutation = useMutation({
    mutationFn: (data) => base44.entities.Employee.update(id, {
      status: 'terminated',
      access_disabled: true,
      termination_date: data.termination_date,
      termination_reason_code: data.termination_reason_code,
      termination_comments: data.termination_comments,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setConcludeOpen(false);
      toast({ title: 'Employment concluded', description: 'Employee has been moved to Former Employees.' });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: () => base44.entities.Employee.update(id, {
      status: 'active',
      access_disabled: false,
      termination_date: null,
      termination_reason_code: null,
      termination_comments: null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: 'Employee reactivated', description: 'Access and status have been restored.' });
    },
  });

  const toggleAccessMutation = useMutation({
    mutationFn: ({ permId, permission }) => base44.entities.AccessPermission.update(permId, { permission }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['access-permissions', id] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Employee not found.</p>
        <Link to="/nexushr/employees" className="text-accent hover:underline text-sm mt-2 inline-block">Back to Employees</Link>
      </div>
    );
  }

  const isDeceased = !!employee.is_deceased;
  const pendingMilestones = calculateMilestones(employee, timeLogs, recognitions);

  return (
    <div className="space-y-6">
      {/* Top nav */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/nexushr/employees" className="hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />Employees
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">{employee.first_name} {employee.last_name}</span>
      </div>

      {/* In Memoriam Banner */}
      {isDeceased && (
        <div className="bg-gradient-to-r from-purple-100 via-amber-50 to-purple-100 border border-purple-200 rounded-xl p-6 text-center">
          <p className="text-4xl mb-2">🕊️</p>
          <h2 className="text-xl font-bold text-purple-900">In Memoriam</h2>
          <p className="text-purple-700 mt-1">{employee.first_name} {employee.last_name} — forever remembered with gratitude.</p>
          {employee.deceased_date && <p className="text-sm text-purple-600 mt-1">Passed away {format(new Date(employee.deceased_date), 'MMMM d, yyyy')}.</p>}
        </div>
      )}

      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Avatar */}
            {employee.photo_url ? (
              <img src={employee.photo_url} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-border" />
            ) : (
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0 ${isDeceased ? 'bg-gray-200 text-gray-600' : 'bg-primary/10 text-primary'}`}>
                {isDeceased ? '🕊️' : `${employee.first_name?.[0]}${employee.last_name?.[0]}`}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold">{employee.first_name} {employee.last_name}</h1>
                  <p className="text-muted-foreground">{employee.position} · {employee.department}</p>
                  {employee.org_tier && (
                    <p className="text-sm text-muted-foreground capitalize">{TIER_LABELS[employee.org_tier] || employee.org_tier.replace(/_/g, ' ')}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge className={statusColors[employee.status] || statusColors.active}>
                      {employee.status?.replace(/_/g, ' ')}
                    </Badge>
                    {employee.hire_date && (
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        Hired {format(new Date(employee.hire_date), 'MMM d, yyyy')}
                      </Badge>
                    )}
                    {employee.employee_id_number && (
                      <Badge variant="outline" className="text-xs">ID: {employee.employee_id_number}</Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <DropdownMenu open={statusOpen} onOpenChange={setStatusOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm"><Pencil className="w-3.5 h-3.5 mr-1" />Status</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {['active','on_leave','probation','occasional','suspended','terminated'].map(s => (
                        <DropdownMenuItem key={s} onClick={() => { updateMutation.mutate({ status: s }); setStatusOpen(false); }}>
                          {s.replace(/_/g, ' ')}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}><Edit2 className="w-3.5 h-3.5 mr-1" />Edit</Button>
                  {employee.status === 'terminated' ? (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => reactivateMutation.mutate()} disabled={reactivateMutation.isPending}>
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />Reactivate
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="text-orange-700 border-orange-300 hover:bg-orange-50" onClick={() => setConcludeOpen(true)}>
                      <UserX className="w-3.5 h-3.5 mr-1" />Conclude Employment
                    </Button>
                  )}
                  <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2 className="w-3.5 h-3.5 mr-1" />Delete</Button>
                </div>
              </div>

              {/* Contact row */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                <a href={`mailto:${employee.email}`} className="flex items-center gap-1.5 hover:text-foreground">
                  <Mail className="w-3.5 h-3.5" />{employee.email}
                </a>
                {employee.phone && (
                  <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{formatPhoneNumber(employee.phone)}</span>
                )}
                {employee.city && (
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{employee.city}</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Bar */}
      <div className="flex gap-0.5 bg-muted rounded-lg p-0.5 w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-md transition-colors ${activeTab === tab.id ? 'bg-white shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Icon className="w-3.5 h-3.5" />{tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab employee={employee} timeLogs={timeLogs} recognitions={recognitions} pendingMilestones={pendingMilestones} />
      )}
      {activeTab === 'performance' && (
        <PerformanceTab reviews={reviews} />
      )}
      {activeTab === 'documents' && (
        <DocumentsTab documents={documents} />
      )}
      {activeTab === 'access' && (
        <AccessTab accessPerms={accessPerms} employeeId={id} onToggle={toggleAccessMutation} />
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Employee</DialogTitle></DialogHeader>
          <EmployeeForm
            employee={employee}
            onSubmit={(data) => updateMutation.mutate(data)}
            isLoading={updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <DeleteEmployeeDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        employee={employee}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
      />

      <ConcludeEmploymentDialog
        open={concludeOpen}
        onOpenChange={setConcludeOpen}
        employee={employee}
        onConfirm={(data) => concludeMutation.mutate(data)}
        isLoading={concludeMutation.isPending}
      />
    </div>
  );
}

function OverviewTab({ employee, timeLogs, recognitions, pendingMilestones }) {
  return (
    <div className="space-y-6">
      <EmployeeHourStats timeLogs={timeLogs} />

      {/* Personal Details */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Personal Details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            {employee.birth_date && (
              <div>
                <dt className="text-muted-foreground text-xs">Date of Birth</dt>
                <dd className="font-medium">{format(new Date(employee.birth_date), 'MMM d, yyyy')}</dd>
              </div>
            )}
            {employee.address && (
              <div className="col-span-2">
                <dt className="text-muted-foreground text-xs">Address</dt>
                <dd className="font-medium">{employee.address}{employee.city ? `, ${employee.city}` : ''}</dd>
              </div>
            )}
            {employee.manager_email && (
              <div>
                <dt className="text-muted-foreground text-xs">Reports To</dt>
                <dd className="font-medium">{employee.manager_email}</dd>
              </div>
            )}
            {employee.pay_grade && (
              <div>
                <dt className="text-muted-foreground text-xs">Pay Grade</dt>
                <dd className="font-medium">{employee.pay_grade}</dd>
              </div>
            )}
            {employee.salary && (
              <div>
                <dt className="text-muted-foreground text-xs">Salary</dt>
                <dd className="font-medium">${employee.salary.toLocaleString()}/yr</dd>
              </div>
            )}
            {employee.emergency_contact_name && (
              <div>
                <dt className="text-muted-foreground text-xs">Emergency Contact</dt>
                <dd className="font-medium">{employee.emergency_contact_name}</dd>
                {employee.emergency_contact_phone && <dd className="text-xs text-muted-foreground">{employee.emergency_contact_phone}</dd>}
              </div>
            )}
            {employee.probationary_end_date && (
              <div>
                <dt className="text-muted-foreground text-xs">Probation Ends</dt>
                <dd className="font-medium">{format(new Date(employee.probationary_end_date), 'MMM d, yyyy')}</dd>
              </div>
            )}
          </dl>
          {employee.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-1">HR Notes</p>
              <p className="text-sm whitespace-pre-wrap">{employee.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recognition & Milestones */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><Award className="w-4 h-4" />Recognition &amp; Milestones</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {recognitions.length === 0 && pendingMilestones.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recognitions yet.</p>
          ) : (
            <div className="grid gap-2">
              {recognitions.map(rec => (
                <div key={rec.id} className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
                  <span className="text-2xl">
                    {rec.type === 'milestone_hours' ? '⏱️' : rec.type === 'years_of_service' ? '🏆' : rec.type === 'employee_of_month' ? '⭐' : '🎖️'}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{rec.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {rec.type?.replace(/_/g, ' ')} {rec.date_awarded ? `· ${format(new Date(rec.date_awarded), 'MMM d, yyyy')}` : ''}
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
                {pendingMilestones.map(m => (
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
    </div>
  );
}

function PerformanceTab({ reviews }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-semibold">Performance Reviews</CardTitle></CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews on file.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map(rev => (
              <div key={rev.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm">
                <div>
                  <p className="font-medium">{rev.review_period}</p>
                  {rev.review_date && <p className="text-xs text-muted-foreground">{format(new Date(rev.review_date), 'MMM d, yyyy')}</p>}
                  {rev.reviewer_name && <p className="text-xs text-muted-foreground">Reviewer: {rev.reviewer_name}</p>}
                </div>
                <StatusBadge status={rev.overall_rating} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DocumentsTab({ documents }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-semibold">Documents</CardTitle></CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents on file.</p>
        ) : (
          <div className="space-y-2">
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{doc.title || doc.document_type}</p>
                    {doc.expiry_date && <p className="text-xs text-muted-foreground">Expires {format(new Date(doc.expiry_date), 'MMM d, yyyy')}</p>}
                  </div>
                </div>
                {doc.file_url && (
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-xs">View</a>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AccessTab({ accessPerms, employeeId, onToggle }) {
  // Map perms by target_id for quick lookup
  const permMap = {};
  accessPerms.forEach(p => { permMap[p.target_id] = p; });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4" />Portal Access
        </CardTitle>
        <p className="text-xs text-muted-foreground">Toggle individual portal access for this employee.</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {PORTAL_MODULES.map(mod => {
            const perm = permMap[mod.id];
            const isAllowed = perm?.permission === 'allow';
            return (
              <div key={mod.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/20 transition-colors">
                <div>
                  <p className="text-sm font-medium">{mod.label}</p>
                  <p className="text-xs text-muted-foreground font-mono">{mod.route}</p>
                </div>
                {perm ? (
                  <button
                    onClick={() => onToggle.mutate({ permId: perm.id, permission: isAllowed ? 'deny' : 'allow' })}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${isAllowed ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                  >
                    {isAllowed ? <><Check className="w-3 h-3" />Allowed</> : <><X className="w-3 h-3" />Denied</>}
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground italic">No preset</span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}