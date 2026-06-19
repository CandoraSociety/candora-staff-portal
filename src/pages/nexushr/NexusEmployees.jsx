import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Eye, ShieldCheck, UserPlus, UserX, ArrowLeft, RotateCcw, Trash2, Copy, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { PORTAL_MODULES, TIER_PRESETS } from '@/lib/tierPermissionPresets';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import StatusBadge from '@/components/shared/StatusBadge';
import { format } from 'date-fns';
import EmployeeForm from '@/components/employees/EmployeeForm';
import PortalAccessSelector from '@/components/employees/PortalAccessSelector';
import FileAccessSelector from '@/components/files/FileAccessSelector';

export default function NexusEmployees() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1); // 1 = employee details, 2 = portal + file access
  const [pendingEmployee, setPendingEmployee] = useState(null); // data from step 1
  const [selectedPortals, setSelectedPortals] = useState([]);
  const [selectedFileAccess, setSelectedFileAccess] = useState([]); // extra file access levels
  const [saving, setSaving] = useState(false);
  const [welcomeInfo, setWelcomeInfo] = useState(null); // shown on step 3
  const [copied, setCopied] = useState(false);
  const [confirmPurgeId, setConfirmPurgeId] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const user = outletContext?.user;
  const { toast } = useToast();

  const ADMIN_TIERS = ['executive_director', 'director'];

  const openAddDialog = () => {
    setPendingEmployee(null);
    setSelectedPortals([]);
    setSelectedFileAccess([]);
    setWelcomeInfo(null);
    setCopied(false);
    setStep(1);
    setShowForm(true);
  };

  // Step 1: collect employee data, move to step 2
  const handleStep1 = (data) => {
    setPendingEmployee(data);
    // Pre-populate portals from tier
    setSelectedPortals(TIER_PRESETS[data.org_tier] || []);
    setStep(2);
  };

  // Step 2: finalize — create employee + permissions, then show welcome message
  const handleFinalize = async () => {
    if (!pendingEmployee) return;
    setSaving(true);
    try {
      const data = pendingEmployee;

      // 1. Create employee record
      const employee = await base44.entities.Employee.create(data);

      // 2. Save portal access permissions
      const permRecords = PORTAL_MODULES.map(mod => ({
        target_type: 'module',
        target_id: mod.id,
        scope_type: 'individual',
        scope_value: data.email,
        permission: selectedPortals.includes(mod.id) ? 'allow' : 'deny',
        is_active: true,
      }));
      await Promise.all(permRecords.map(p => base44.entities.AccessPermission.create(p)));

      // 3. Save file access permissions
      const FILE_ACCESS_LEVELS = ['manager', 'finance', 'corporate'];
      const filePermRecords = FILE_ACCESS_LEVELS.map(level => ({
        target_type: 'file_access',
        target_id: level,
        scope_type: 'individual',
        scope_value: data.email,
        permission: selectedFileAccess.includes(level) ? 'allow' : 'deny',
        is_active: true,
      }));
      await Promise.all(filePermRecords.map(p => base44.entities.AccessPermission.create(p)));

      queryClient.invalidateQueries({ queryKey: ['employees'] });

      // 4. Build welcome message for manual sending
      const registerUrl = `${window.location.origin}/register`;
      const loginUrl = `${window.location.origin}/login`;
      const welcomeMessage = `Subject: Welcome to the Candora Staff Portal — Action Required

Hi ${data.first_name},

Welcome to the team! Your staff account has been set up on the Candora Staff Portal.

To get started, please create your account using the link below. Make sure to register using this exact email address: ${data.email}

👉 Create Your Account: ${registerUrl}

Once you've registered, you can log in at any time here:
🔑 Staff Portal Login: ${loginUrl}

You'll have access to your assigned portals and resources after logging in. If you have any trouble, reach out to your manager or HR.

Welcome aboard!
— Candora HR Team`;

      setWelcomeInfo({ employee: data, message: welcomeMessage, registerUrl, loginUrl });
      setStep(3);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(welcomeInfo.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const { data: employees = [], isLoading } = useQuery({ 
    queryKey: ['employees'], 
    queryFn: () => base44.entities.Employee.list('-created_date', 500) 
  });

  const handleRestore = async (emp) => {
    await base44.entities.Employee.update(emp.id, { is_deleted: false, deleted_at: null });
    queryClient.invalidateQueries({ queryKey: ['employees'] });
    toast({ title: 'Employee restored', description: `${emp.first_name} ${emp.last_name} has been recovered.` });
  };

  const handlePurge = async (emp) => {
    // Delete the linked platform User record first to free up the email address
    if (emp.user_id) {
      try { await base44.entities.User.delete(emp.user_id); } catch (e) { /* already removed */ }
    }
    await base44.entities.Employee.delete(emp.id);
    queryClient.invalidateQueries({ queryKey: ['employees'] });
    setConfirmPurgeId(null);
    toast({ title: 'Permanently deleted', description: `${emp.first_name} ${emp.last_name} has been permanently removed and their email address freed.` });
  };



  const searchStr = search.toLowerCase();
  const matches = (e) => `${e.first_name} ${e.last_name} ${e.position} ${e.department} ${e.email}`.toLowerCase().includes(searchStr);

  const active = employees.filter(e => !e.is_deleted && e.status !== 'terminated' && matches(e));
  const former = employees.filter(e => !e.is_deleted && e.status === 'terminated' && matches(e));

  // Soft-deleted within 30 days
  const today = new Date();
  const deleted = employees.filter(e => {
    if (!e.is_deleted) return false;
    if (!matches(e)) return false;
    if (!e.deleted_at) return true;
    const daysAgo = (today - new Date(e.deleted_at)) / (1000 * 60 * 60 * 24);
    return daysAgo <= 30;
  });

  const filtered = active; // kept for compatibility

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        actions={<Button onClick={openAddDialog} size="sm"><Plus className="w-4 h-4 mr-1" />Add Employee</Button>}
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading employees...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Eye} title="No employees found" description="Add your first employee to get started." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left text-muted-foreground">
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Position</th>
                  <th className="p-4 font-medium hidden md:table-cell">Department</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium hidden sm:table-cell">Invite</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(emp => {
                  const isMe = user?.email && emp.email?.toLowerCase() === user.email.toLowerCase();
                  return (
                  <tr key={emp.id} className={`cursor-pointer transition-colors ${isMe ? 'bg-emerald-50 hover:bg-emerald-100 border-l-4 border-l-emerald-500' : 'hover:bg-muted/30'}`} onClick={() => navigate(`/nexushr/employees/${emp.id}`)}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${emp.is_deceased ? 'bg-gray-200 text-gray-600' : isMe ? 'bg-emerald-500 text-white' : 'bg-primary/10 text-primary'}`}>
                          {emp.is_deceased ? '🕊️' : `${emp.first_name?.[0]}${emp.last_name?.[0]}`}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={`font-medium ${emp.is_deceased ? 'text-gray-500' : ''}`}>{emp.first_name} {emp.last_name}</p>
                            {isMe && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded-full">
                                <ShieldCheck className="w-3 h-3" /> You
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground text-xs">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>{emp.position}</div>
                      {emp.org_tier && <div className="text-xs text-muted-foreground capitalize">{emp.org_tier.replace(/_/g, ' ')}</div>}
                    </td>
                    <td className="p-4 hidden md:table-cell">{emp.department}</td>
                    <td className="p-4">
                      <StatusBadge status={emp.status} />
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      {emp.invite_sent
                        ? <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full"><UserPlus className="w-3 h-3" />Invited</span>
                        : <span className="text-xs text-muted-foreground">No invite</span>
                      }
                    </td>
                    <td className="p-4"><Eye className="w-4 h-4 text-muted-foreground" /></td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Former Employees */}
      {former.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 pt-2">
            <UserX className="w-4 h-4" /> Former Employees ({former.length})
          </h2>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr className="text-left text-muted-foreground">
                    <th className="p-4 font-medium">Name</th>
                    <th className="p-4 font-medium hidden md:table-cell">Position</th>
                    <th className="p-4 font-medium hidden md:table-cell">Last Day</th>
                    <th className="p-4 font-medium hidden lg:table-cell">EI Code</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {former.map(emp => (
                    <tr key={emp.id} className="hover:bg-muted/20 cursor-pointer text-muted-foreground" onClick={() => navigate(`/nexushr/employees/${emp.id}`)}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                            {emp.first_name?.[0]}{emp.last_name?.[0]}
                          </div>
                          <div>
                            <p className="font-medium line-through">{emp.first_name} {emp.last_name}</p>
                            <p className="text-xs">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">{emp.position}</td>
                      <td className="p-4 hidden md:table-cell">{emp.termination_date ? format(new Date(emp.termination_date), 'MMM d, yyyy') : '—'}</td>
                      <td className="p-4 hidden lg:table-cell text-xs">{emp.termination_reason_code || '—'}</td>
                      <td className="p-4"><Eye className="w-4 h-4 text-muted-foreground" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recently Deleted — 30-day recovery window */}
      {deleted.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-red-600 flex items-center gap-2 pt-2">
            <Trash2 className="w-4 h-4" /> Recently Deleted ({deleted.length}) — recoverable for 30 days
          </h2>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-red-50/50">
                  <tr className="text-left text-muted-foreground">
                    <th className="p-4 font-medium">Name</th>
                    <th className="p-4 font-medium hidden md:table-cell">Position</th>
                    <th className="p-4 font-medium hidden md:table-cell">Deleted On</th>
                    <th className="p-4 font-medium">Days Left</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {deleted.map(emp => {
                    const daysLeft = emp.deleted_at
                      ? Math.max(0, 30 - Math.floor((today - new Date(emp.deleted_at)) / (1000 * 60 * 60 * 24)))
                      : 30;
                    return (
                      <tr key={emp.id} className="text-muted-foreground opacity-70">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-500">
                              {emp.first_name?.[0]}{emp.last_name?.[0]}
                            </div>
                            <div>
                              <p className="font-medium line-through">{emp.first_name} {emp.last_name}</p>
                              <p className="text-xs">{emp.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell">{emp.position}</td>
                        <td className="p-4 hidden md:table-cell">{emp.deleted_at ? format(new Date(emp.deleted_at), 'MMM d, yyyy') : '—'}</td>
                        <td className="p-4">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${daysLeft <= 5 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {daysLeft}d remaining
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-50" onClick={() => handleRestore(emp)}>
                              <RotateCcw className="w-3.5 h-3.5 mr-1" />Restore
                            </Button>
                            {confirmPurgeId === emp.id ? (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-red-600 font-medium">Sure?</span>
                                <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handlePurge(emp)}>Yes, Delete Forever</Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setConfirmPurgeId(null)}>Cancel</Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => setConfirmPurgeId(emp.id)}>
                                <Trash2 className="w-3.5 h-3.5 mr-1" />Delete Forever
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] flex flex-col max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {step === 1 ? 'Add Employee — Details' : step === 2 ? 'Add Employee — Access & Permissions' : '✅ Employee Created'}
            </DialogTitle>
            {step < 3 && <p className="text-xs text-muted-foreground">Step {step} of 2</p>}
          </DialogHeader>

          <div className="overflow-y-auto flex-1 pr-1">
            {step === 1 && (
              <EmployeeForm onSubmit={handleStep1} submitLabel="Next: Set Portal Access →" />
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div className="text-sm">
                  <span className="font-medium">{pendingEmployee?.first_name} {pendingEmployee?.last_name}</span>
                  <span className="text-muted-foreground"> · {pendingEmployee?.org_tier?.replace(/_/g, ' ')}</span>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Portal Access</p>
                  <PortalAccessSelector
                    value={selectedPortals}
                    onChange={setSelectedPortals}
                    orgTier={null}
                  />
                </div>

                <div className="border-t pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">File Access</p>
                  <FileAccessSelector
                    value={selectedFileAccess}
                    onChange={setSelectedFileAccess}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </Button>
                  <Button onClick={handleFinalize} disabled={saving} className="flex-1">
                    {saving ? 'Creating...' : 'Create Employee'}
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && welcomeInfo && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                  <strong>{welcomeInfo.employee.first_name} {welcomeInfo.employee.last_name}</strong> has been added successfully. Copy the message below and send it to <strong>{welcomeInfo.employee.email}</strong>.
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Welcome Message</p>
                    <Button size="sm" variant="outline" onClick={handleCopy} className="h-7 text-xs gap-1">
                      {copied ? <><CheckCheck className="w-3.5 h-3.5 text-green-600" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy Message</>}
                    </Button>
                  </div>
                  <textarea
                    readOnly
                    value={welcomeInfo.message}
                    className="w-full h-64 text-xs font-mono bg-muted/40 border rounded-md p-3 resize-none focus:outline-none"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs text-blue-800 space-y-2">
                  <div>
                    <strong>Register (first time):</strong>
                    <div className="mt-0.5 font-mono break-all">{welcomeInfo.registerUrl}</div>
                  </div>
                  <div>
                    <strong>Login (returning):</strong>
                    <div className="mt-0.5 font-mono break-all">{welcomeInfo.loginUrl}</div>
                  </div>
                </div>

                <Button className="w-full" onClick={() => setShowForm(false)}>Done</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}