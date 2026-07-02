import { base44 } from '@/api/base44Client';
import { PATHWAYS_MILESTONE_TITLES } from '@/lib/digilitConstants';

/**
 * Syncs Digital Literacy status changes to the linked Pathways Client.
 * - Adds/updates a milestone on the Client entity
 * - Adds a progress note to the Client's roadmap_progress_notes
 *
 * @param {object} params
 * @param {string} params.pathways_client_id - The Pathways Client entity ID
 * @param {string} params.participant_name - Display name of the DigiLit participant
 * @param {string} params.newStatus - The new status (registered, started, completed, withdrawn)
 * @param {string} params.oldStatus - The previous status (for note context)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function syncToPathways({ pathways_client_id, participant_name, newStatus, oldStatus }) {
  if (!pathways_client_id) return { success: false, error: 'No pathways_client_id provided' };

  try {
    // Fetch the current Client record
    const client = await base44.entities.Client.get(pathways_client_id);
    if (!client) return { success: false, error: 'Pathways client not found' };

    const milestoneTitle = PATHWAYS_MILESTONE_TITLES[newStatus];
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    // Get current user for logging
    let me = null;
    try { me = await base44.auth.me(); } catch (_) {}

    // 1. Update milestones — add or update the relevant milestone
    const existingMilestones = client.milestones || [];
    const existingIdx = existingMilestones.findIndex(m => m.title === milestoneTitle);

    let updatedMilestones;
    if (existingIdx >= 0) {
      // Update existing milestone
      updatedMilestones = [...existingMilestones];
      updatedMilestones[existingIdx] = {
        ...updatedMilestones[existingIdx],
        date: today,
        status: 'completed',
        notes: `Digital Literacy program status: ${newStatus}`,
      };
    } else {
      // Add new milestone
      updatedMilestones = [...existingMilestones, {
        title: milestoneTitle,
        date: today,
        status: 'completed',
        notes: `Digital Literacy program status: ${newStatus}`,
      }];
    }

    // 2. Add a progress note to roadmap_progress_notes
    const existingNotes = client.roadmap_progress_notes || [];
    const statusMessages = {
      registered: `Registered in Digital Literacy program`,
      started: `Started Digital Literacy program`,
      completed: `Completed Digital Literacy program`,
      withdrawn: `Withdrew from Digital Literacy program`,
    };
    const newNote = {
      id: Date.now().toString(),
      date: today,
      event_type: 'manual',
      item_label: 'Digital Literacy',
      item_key: 'digital_literacy',
      note: statusMessages[newStatus] || `Digital Literacy status updated to: ${newStatus}`,
      logged_by: me?.email || '',
      logged_by_name: me?.full_name || 'Digital Literacy Portal',
      compass_entered: false,
    };

    const updatedNotes = [newNote, ...existingNotes];

    // 3. Update the Client entity
    await base44.entities.Client.update(pathways_client_id, {
      milestones: updatedMilestones,
      roadmap_progress_notes: updatedNotes,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to sync to Pathways:', error);
    return { success: false, error: error.message };
  }
}