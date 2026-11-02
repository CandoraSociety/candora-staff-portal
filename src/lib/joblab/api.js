import { base44 } from '@/api/base44Client';
import { readSession } from '@/lib/joblab/session';

// Every Job Lab request goes through the joblabApi backend function. Visitors
// are anonymous, so the participant id + session token travel in the payload.
export async function callJobLab(action, payload = {}) {
  const session = readSession();
  const body = {
    action,
    participantId: session?.participant?.id,
    token: session?.token,
    ...payload,
  };

  try {
    const response = await base44.functions.invoke('joblabApi', body);
    const data = response?.data || {};
    if (data.error) throw new Error(data.error);
    return data;
  } catch (error) {
    const message =
      error?.response?.data?.error ||
      error?.message ||
      'Something went wrong. Please try again.';
    throw new Error(message);
  }
}