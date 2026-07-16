import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Trash2, UserPlus } from 'lucide-react';

export const STAFF_ROLE_LABELS = {
  career_counsellor: 'Career Counsellor',
  service_navigator: 'Service Navigator',
  admin: 'Admin',
  manager: 'Manager',
};

export default function PathwaysStaffManager({ onClose, onUpdated }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('career_counsellor');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const data = await base44.entities.PathwaysStaff.list('name');
    setStaff(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newName.trim() || !newEmail.trim()) return;
    setSaving(true);
    try {
      await base44.entities.PathwaysStaff.create({
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        role: newRole,
        is_active: true,
      });
      setNewName('');
      setNewEmail('');
      setNewRole('career_counsellor');
      await load();
      onUpdated?.();
    } catch (e) {
      alert('Failed to add staff member: ' + (e.message || 'Unknown error'));
    }
    setSaving(false);
  };

  const handleRemove = async (id) => {
    if (!confirm('Remove this staff member from the Pathways portal?')) return;
    try {
      await base44.entities.PathwaysStaff.delete(id);
      await load();
      onUpdated?.();
    } catch (e) {
      alert('Failed to remove: ' + (e.message || 'Unknown error'));
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await base44.entities.PathwaysStaff.update(id, { role });
      await load();
      onUpdated?.();
    } catch (e) {
      alert('Failed to update role: ' + (e.message || 'Unknown error'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ background: "hsl(231,64%,20%)" }}>
          <h3 className="text-lg font-bold text-white">Manage Pathways Staff</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="rounded-lg border border-slate-200 p-4 space-y-3 bg-slate-50">
            <h4 className="text-sm font-semibold text-slate-700">Add Staff Member</h4>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Full name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email address"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(STAFF_ROLE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <button
                onClick={handleAdd}
                disabled={saving || !newName.trim() || !newEmail.trim()}
                className="ml-auto px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                style={{ background: "hsl(231,64%,20%)" }}
              >
                <UserPlus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-400 text-sm">Loading...</div>
          ) : staff.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No staff members yet. Add one above.</div>
          ) : (
            <div className="space-y-2">
              {staff.map(s => (
                <div key={s.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{s.name}</p>
                    <p className="text-xs text-slate-500 truncate">{s.email}</p>
                  </div>
                  <select
                    value={s.role}
                    onChange={e => handleRoleChange(s.id, e.target.value)}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(STAFF_ROLE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleRemove(s.id)}
                    className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}