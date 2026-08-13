import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Trash2, RefreshCw, UserCheck, Info } from 'lucide-react';

export const STAFF_ROLE_LABELS = {
  career_counsellor: 'Career Counsellor',
  service_navigator: 'Service Navigator',
  admin: 'Admin',
  manager: 'Manager',
};

const ROLE_OPTIONS = Object.entries(STAFF_ROLE_LABELS).map(([value, label]) => ({ value, label }));

// Mirror of useAccessControl admin roles + Pathways module id
const ADMIN_ROLE_NAMES = ['super_admin', 'executive_director', 'admin'];
const PATHWAYS_MODULE_ID = 'pathways';

function RoleSelect({ value, onChange, includeNone, className }) {
  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value || null)}
      className={className}
    >
      {includeNone && <option value="">— None —</option>}
      {ROLE_OPTIONS.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function deriveName(user) {
  if (user.full_name && user.full_name.trim()) return user.full_name.trim();
  const local = (user.email || '').split('@')[0];
  return local.split(/[._-]+/).filter(Boolean).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') || local || 'Unknown';
}

// Determine whether an app user has access to the Pathways CM portal, using the
// same rules as useAccessControl.canAccessModule (admin override → individual
// allow/deny override → tier-based access from the linked Employee record).
function buildAccessChecker(users, permissions, tierPortalAccess, employeeByEmail) {
  return function hasPathwaysAccess(user) {
    if (ADMIN_ROLE_NAMES.includes(user.role)) return true;
    const ind = permissions.find(p =>
      p.target_type === 'module' && p.target_id === PATHWAYS_MODULE_ID &&
      p.scope_type === 'individual' && p.is_active &&
      (p.scope_value === user.id || (p.scope_value && user.email && p.scope_value.toLowerCase() === user.email.toLowerCase()))
    );
    if (ind) return ind.permission === 'allow';
    const emp = user.email ? employeeByEmail[user.email.toLowerCase()] : null;
    const tier = emp?.org_tier;
    return !!(tier && tierPortalAccess[tier]?.includes(PATHWAYS_MODULE_ID));
  };
}

export default function PathwaysStaffManager({ onClose, onUpdated }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      let users = [];
      try { users = await base44.entities.User.list(); } catch (_) { /* non-admins can't list */ }
      const [permissions, orgSettings, employees, existingStaff] = await Promise.all([
        base44.entities.AccessPermission.list().catch(() => []),
        base44.entities.OrgSettings.list().catch(() => []),
        base44.entities.Employee.list().catch(() => []),
        base44.entities.PathwaysStaff.list('name'),
      ]);

      const tierPortalAccess = orgSettings[0]?.tier_portal_access || {};
      const employeeByEmail = {};
      employees.forEach(e => { if (e.email) employeeByEmail[e.email.toLowerCase()] = e; });

      const existingByEmail = {};
      existingStaff.forEach(s => { if (s.email) existingByEmail[s.email.toLowerCase()] = s; });

      let refreshed = existingStaff;

      // Auto-create PathwaysStaff records for app users with Pathways portal access
      if (users.length > 0) {
        const hasPathways = buildAccessChecker(users, permissions, tierPortalAccess, employeeByEmail);
        const toCreate = users
          .filter(u => u.email && hasPathways(u) && !existingByEmail[u.email.toLowerCase()])
          .map(u => ({
            name: deriveName(u),
            email: u.email.toLowerCase(),
            role: 'career_counsellor',
            secondary_role: null,
            tertiary_role: null,
            is_active: true,
          }));

        if (toCreate.length > 0) {
          setSyncing(true);
          try {
            await base44.entities.PathwaysStaff.bulkCreate(toCreate);
            setSyncMsg(`Auto-added ${toCreate.length} staff member${toCreate.length > 1 ? 's' : ''} with Pathways portal access.`);
            refreshed = await base44.entities.PathwaysStaff.list('name');
          } catch (e) {
            setError('Some staff could not be auto-added: ' + (e.message || 'Unknown error'));
            refreshed = await base44.entities.PathwaysStaff.list('name');
          }
          setSyncing(false);
        } else {
          setSyncMsg('');
        }
      } else {
        setSyncMsg('');
      }

      setStaff(refreshed);
      onUpdated?.();
    } catch (e) {
      setError('Failed to load staff: ' + (e.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const handleRemove = async (id) => {
    if (!confirm('Remove this Pathways staff record? If they still have Pathways portal access, they will reappear here automatically on next open.')) return;
    try {
      await base44.entities.PathwaysStaff.delete(id);
      setStaff(prev => prev.filter(s => s.id !== id));
      onUpdated?.();
    } catch (e) {
      alert('Failed to remove: ' + (e.message || 'Unknown error'));
    }
  };

  const handleRoleChange = async (id, field, value) => {
    try {
      await base44.entities.PathwaysStaff.update(id, { [field]: value || null });
      setStaff(prev => prev.map(s => s.id === id ? { ...s, [field]: value || null } : s));
      onUpdated?.();
    } catch (e) {
      alert('Failed to update role: ' + (e.message || 'Unknown error'));
    }
  };

  const selectCls = "rounded-md border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ background: "hsl(231,64%,20%)" }}>
          <h3 className="text-lg font-bold text-white">Manage Pathways Staff</h3>
          <div className="flex items-center gap-2">
            <button onClick={load} disabled={loading || syncing} className="text-white/70 hover:text-white disabled:opacity-50" title="Re-sync from portal access">
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 flex gap-2 items-start text-sm text-blue-800">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              Staff appear here automatically once they're granted access to the Pathways CM portal in
              <span className="font-semibold"> Users &amp; Access</span>. Just set their roles below —
              no need to type names or emails.
            </p>
          </div>

          {syncMsg && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 flex gap-2 items-start text-xs text-emerald-800">
              <UserCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>{syncMsg}</p>
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">{error}</div>
          )}

          {loading ? (
            <div className="text-center py-8 text-slate-400 text-sm">Loading...</div>
          ) : staff.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No staff members yet. Grant Pathways portal access in Users &amp; Access to add them automatically.
            </div>
          ) : (
            <div className="space-y-2">
              {staff.map(s => (
                <div key={s.id} className="rounded-lg border border-slate-200 px-3 py-2.5 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{s.name}</p>
                      <p className="text-xs text-slate-500 truncate">{s.email}</p>
                    </div>
                    <button
                      onClick={() => handleRemove(s.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Primary</label>
                      <RoleSelect value={s.role} onChange={v => handleRoleChange(s.id, 'role', v)} className={`${selectCls} w-full`} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Secondary</label>
                      <RoleSelect value={s.secondary_role} onChange={v => handleRoleChange(s.id, 'secondary_role', v)} includeNone className={`${selectCls} w-full`} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Tertiary</label>
                      <RoleSelect value={s.tertiary_role} onChange={v => handleRoleChange(s.id, 'tertiary_role', v)} includeNone className={`${selectCls} w-full`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}