import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Roles that bypass the NDA gate entirely
const NDA_EXEMPT_ROLES = ['executive_director'];

export function useOnboarding(user) {
  const [ndaSigned, setNdaSigned] = useState(null); // null = loading
  const [onboardingTemplates, setOnboardingTemplates] = useState([]);
  const [onboardingRecords, setOnboardingRecords] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardDismissed, setWizardDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  const isExempt = user && NDA_EXEMPT_ROLES.includes(user.role);

  useEffect(() => {
    if (!user) return;
    if (isExempt) {
      setNdaSigned(true);
      setLoading(false);
      return;
    }
    load();
  }, [user?.id]);

  const load = async () => {
    setLoading(true);
    try {
      // Check NDA
      const ndas = await base44.entities.NDASignature.filter({ user_id: user.id });
      const signed = ndas.length > 0;
      setNdaSigned(signed);

      if (signed) {
        // Load employee record
        const emps = await base44.entities.Employee.filter({ user_id: user.id });
        const emp = emps[0] || null;
        setEmployee(emp);

        // Load onboarding templates + records
        const [templates, records] = await Promise.all([
          base44.entities.OnboardingTemplate.filter({ is_active: true }, 'sort_order'),
          base44.entities.OnboardingRecord.filter({ user_id: user.id }),
        ]);
        setOnboardingTemplates(templates);
        setOnboardingRecords(records);

        // Auto-show wizard on first login if there are pending required items
        const hasSessionFlag = sessionStorage.getItem('onboarding_wizard_shown');
        if (!hasSessionFlag && templates.length > 0) {
          const pendingRequired = templates.filter(t => {
            if (!t.is_required) return false;
            const rec = records.find(r => r.template_id === t.id);
            return !rec || rec.status !== 'completed';
          });
          if (pendingRequired.length > 0) {
            setShowWizard(true);
            sessionStorage.setItem('onboarding_wizard_shown', '1');
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNDASigned = () => {
    setNdaSigned(true);
    load();
  };

  const handleWizardComplete = () => {
    setShowWizard(false);
    load(); // refresh records
  };

  const handleWizardDismiss = () => {
    setShowWizard(false);
    setWizardDismissed(true);
  };

  const pendingCount = onboardingTemplates.filter(t => {
    const rec = onboardingRecords.find(r => r.template_id === t.id);
    return !rec || rec.status === 'pending';
  }).length;

  const requiredPendingCount = onboardingTemplates.filter(t => {
    if (!t.is_required) return false;
    const rec = onboardingRecords.find(r => r.template_id === t.id);
    return !rec || rec.status !== 'completed';
  }).length;

  return {
    loading,
    ndaSigned,
    isExempt,
    employee,
    onboardingTemplates,
    onboardingRecords,
    showWizard,
    setShowWizard,
    pendingCount,
    requiredPendingCount,
    handleNDASigned,
    handleWizardComplete,
    handleWizardDismiss,
  };
}