import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { DEFAULT_POLICY, DEFAULT_PREFS, sampleMessages } from "@/lib/emailAssistant";

// Loads everything the AI Email Assistant needs for the signed-in employee.
// Every query is scoped to that person; row-level security enforces the same
// boundary on the server, so no other employee's correspondence is reachable.
export default function useEmailAssistant() {
  const queryClient = useQueryClient();

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const email = user?.email;

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["emailMessages", email],
    queryFn: () =>
      base44.entities.EmailMessage
        .filter({ owner_email: email }, { sort: "-received_at", limit: 100 })
        .then((page) => page.items || []),
    enabled: !!email,
  });

  const { data: insights = [], isLoading: loadingInsights } = useQuery({
    queryKey: ["emailInsights", email],
    queryFn: () =>
      base44.entities.EmailInsight
        .filter({ owner_email: email }, { sort: "-created_date", limit: 300 })
        .then((page) => page.items || []),
    enabled: !!email,
  });

  const { data: prefsRecord } = useQuery({
    queryKey: ["emailAssistantPrefs", email],
    queryFn: () =>
      base44.entities.EmailAssistantPreference
        .filter({ owner_email: email }, { limit: 1 })
        .then((page) => page.items?.[0] || null),
    enabled: !!email,
  });

  const { data: policyRecord } = useQuery({
    queryKey: ["emailAssistantPolicy"],
    queryFn: () =>
      base44.entities.EmailAssistantPolicy.list({ limit: 1 }).then((page) => page.items?.[0] || null),
  });

  const prefs = { ...DEFAULT_PREFS, ...(prefsRecord || {}), features: { ...DEFAULT_PREFS.features, ...(prefsRecord?.features || {}) } };
  const policy = { ...DEFAULT_POLICY, ...(policyRecord || {}), features_allowed: { ...DEFAULT_POLICY.features_allowed, ...(policyRecord?.features_allowed || {}) } };

  const savePrefs = useMutation({
    mutationFn: async (patch) => {
      const payload = { ...patch };
      if (payload.features) payload.features = { ...prefs.features, ...payload.features };
      if (prefsRecord) return base44.entities.EmailAssistantPreference.update(prefsRecord.id, payload);
      return base44.entities.EmailAssistantPreference.create({ owner_email: email, ...DEFAULT_PREFS, ...payload });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emailAssistantPrefs", email] }),
  });

  const seedSamples = useMutation({
    mutationFn: () => base44.entities.EmailMessage.bulkCreate(sampleMessages(user)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailMessages", email] });
    },
  });

  const clearSamples = useMutation({
    mutationFn: () => base44.entities.EmailMessage.deleteMany({ owner_email: email, is_demo: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailMessages", email] });
      queryClient.invalidateQueries({ queryKey: ["emailInsights", email] });
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["emailMessages", email] });
    queryClient.invalidateQueries({ queryKey: ["emailInsights", email] });
  };

  return {
    user,
    email,
    messages,
    insights,
    prefs,
    policy,
    savePrefs,
    seedSamples,
    clearSamples,
    refresh,
    isLoading: loadingUser || loadingMessages || loadingInsights,
  };
}