const normalizedTitle = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export async function readAnalysisInsights(base44, user, threadKeys, messageIds) {
  const rows = [];
  let cursor;
  do {
    const page = await base44.entities.EmailInsight.filter({
      owner_email: user.email,
      $or: [{ source_thread_id: { $in: threadKeys } }, { source_message_ids: { $in: messageIds } }],
    }, { limit: 200, ...(cursor ? { cursor } : {}) });
    rows.push(...page.items);
    cursor = page.has_more ? page.next_cursor : null;
  } while (cursor);
  return rows;
}

// Refresh only AI suggestions. Never overwrite a note or reverse an employee's decision.
export async function saveAnalysisResults(base44, user, results, existing, summariesOnly) {
  const creates = [];
  const updates = new Map();
  const retained = new Set();
  for (const result of results) {
    const thread = result.group[0].thread_id || result.group[0].id;
    const local = existing.filter((i) => i.source_thread_id === thread);
    const drafts = summariesOnly ? [result.summary] : [...result.insights, result.summary];
    for (const raw of drafts) {
      const { existing_insight_id, ...draft } = raw;
      const same = existing.find((i) => i.dedupe_key === draft.dedupe_key)
        || local.find((i) => i.id === existing_insight_id && i.kind !== 'summary')
        || local.find((i) => i.kind === draft.kind && normalizedTitle(i.title) === normalizedTitle(draft.title));
      if (same) {
        retained.add(same.id);
        if (same.status !== 'suggested') continue;
        updates.set(same.id, { id: same.id, ...draft, due_date: draft.due_date || '' });
      } else {
        creates.push({ ...draft, owner_email: user.email, status: 'suggested', is_demo: result.group.every((m) => m.is_demo) });
      }
    }
    if (!summariesOnly && !result.incomplete) {
      local.filter((i) => i.status === 'suggested' && i.kind !== 'summary' && !retained.has(i.id)).forEach((i) => {
        updates.set(i.id, { id: i.id, status: 'dismissed', approved_action: 'Replaced after rereading the conversation' });
      });
    }
  }
  for (let offset = 0; offset < creates.length; offset += 400) {
    await base44.entities.EmailInsight.bulkCreate(creates.slice(offset, offset + 400));
  }
  const patches = [...updates.values()];
  for (let offset = 0; offset < patches.length; offset += 400) {
    await base44.entities.EmailInsight.bulkUpdate(patches.slice(offset, offset + 400));
  }
  const analyzedIds = [...new Set(results.flatMap((r) => r.readIds || r.group.map((m) => m.id)))];
  // A summary-only request does not mean action analysis has run.
  if (!summariesOnly && analyzedIds.length) {
    const timestamp = new Date().toISOString();
    for (let offset = 0; offset < analyzedIds.length; offset += 400) {
      await base44.entities.EmailMessage.bulkUpdate(analyzedIds.slice(offset, offset + 400).map((id) => ({
        id, analysis_state: 'analyzed', last_analyzed_at: timestamp,
      })));
    }
  }
  return { saved_count: creates.filter((i) => i.kind !== 'summary').length, analyzed_message_ids: analyzedIds };
}