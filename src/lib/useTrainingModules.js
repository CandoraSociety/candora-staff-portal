import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAccessControl } from '@/lib/useAccessControl';
import { TRAINING_MODULES, TRAINING_MODULE_ACCESS } from '@/lib/training/trainingModules';
import { useSupervisorAccess } from '@/lib/useSupervisorAccess';

// Training modules the signed-in staff member can take (only modules for
// portals they have access to; supervisor add-ons only for actual
// supervisors) plus their saved progress — shared by the training sidebar.
export default function useTrainingModules() {
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: permissions = [] } = useQuery({ queryKey: ['permissions'], queryFn: () => base44.entities.AccessPermission.list() });
  const { data: employeeRecord } = useQuery({
    queryKey: ['currentEmployee', user?.email],
    queryFn: () => base44.entities.Employee.filter({ email: user?.email }).then(e => e[0] || null),
    enabled: !!user?.email,
  });
  const { data: orgSettingsList = [] } = useQuery({ queryKey: ['orgSettings'], queryFn: () => base44.entities.OrgSettings.list(), staleTime: 1000 * 60 * 5 });
  const access = useAccessControl(user, permissions, employeeRecord?.org_tier, orgSettingsList[0]?.tier_portal_access || {}, orgSettingsList[0]?.owner_email);
  const { isSupervisor } = useSupervisorAccess();

  const modules = TRAINING_MODULES.filter(m => {
    const requiredPortal = TRAINING_MODULE_ACCESS[m.key];
    if (requiredPortal && !access.canAccessModule(requiredPortal)) return false;
    if (m.supervisorOnly && !isSupervisor) return false;
    return true;
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['trainingProgress', user?.email],
    queryFn: () => base44.entities.TrainingProgress.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  return { modules, progress };
}