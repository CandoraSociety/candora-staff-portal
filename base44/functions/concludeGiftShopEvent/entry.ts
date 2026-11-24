import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { GIFT_SHOP_PROGRAM_NAME } from '../../shared/giftShopInvites.ts';
import { ensureFolderPath, uploadFileToVault, getGraphAccessToken, VAULT_DRIVE_ID } from '../../shared/vaultStorage.ts';

// Concluding the Kids Gift Shop: everything the event collected — its setup, the
// registrations and check-ins, the invitations and the message history — is
// written to an archive record and to SharePoint (Winter Wonderland Festival /
// Kids Gift Shop), and only then are the live records cleared so next year's
// event starts from an empty shop.
const CONCLUDE_PASSWORD = '123!@#Aa';
const SHAREPOINT_FOLDER = '/Winter Wonderland Festival/Kids Gift Shop';

const asArray = (res: any) => (Array.isArray(res) ? res : (res?.items || []));

const pick = (row: any, keys: string[]) =>
  Object.fromEntries(keys.filter((key) => row?.[key] !== undefined).map((key) => [key, row[key]]));

const REGISTRATION_FIELDS = [
  'id', 'child_name', 'participant_name', 'child_age_band', 'time_slot',
  'parent_guardian_name', 'parent_guardian_phone', 'parent_guardian_email',
  'gift_count', 'gift_1_gender', 'gift_1_recipient', 'gift_2_gender', 'gift_2_recipient',
  'gift_1_selection', 'gift_2_selection', 'checkin_code',
  'checked_in', 'checked_in_at', 'check_in_sequence', 'shopping_started_at', 'assigned_elf',
  'completed', 'completed_at', 'completed_by_elf', 'notes', 'created_date',
];

const INVITE_FIELDS = [
  'id', 'token', 'guardian_name', 'guardian_email', 'guardian_phone', 'children_allowed',
  'status', 'expires_at', 'used_at', 'emailed_at', 'texted_at', 'time_slot',
  'registered_summary', 'registration_ids', 'sent_via', 'rc_client_id', 'notes', 'created_date',
];

const MESSAGE_FIELDS = [
  'id', 'family_key', 'guardian_name', 'subject', 'body', 'attachment_name',
  'emailed', 'texted', 'status', 'failure_reason', 'sent_at', 'sent_by_name',
];

const SCHEDULED_FIELDS = [
  'id', 'subject', 'body', 'recipient_count', 'send_at', 'status', 'sent_at',
  'result_summary', 'sent_by_name', 'include_checkin_code', 'include_details',
];

const TEXT_FIELDS = ['id', 'phone', 'direction', 'body', 'guardian_name', 'sent_at', 'staff_name'];

const csvCell = (value: any) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

function registrationsCsv(rows: any[]) {
  const headers = [
    'Child', 'Age band', 'Guardian', 'Phone', 'Email', 'Time slot', 'Gifts', 'Gift 1 for',
    'Gift 2 for', 'Check-in code', 'Checked in', 'Checked in at', 'Assigned elf',
    'Shopping started', 'Completed', 'Completed at', 'Returned by', 'Notes',
  ];
  const lines = rows.map((row) => [
    row.child_name || row.participant_name,
    row.child_age_band,
    row.parent_guardian_name,
    row.parent_guardian_phone,
    row.parent_guardian_email,
    row.time_slot,
    row.gift_count,
    row.gift_1_recipient,
    row.gift_2_recipient,
    row.checkin_code,
    row.checked_in ? 'Yes' : 'No',
    row.checked_in_at,
    row.assigned_elf,
    row.shopping_started_at,
    row.completed ? 'Yes' : 'No',
    row.completed_at,
    row.completed_by_elf,
    row.notes,
  ].map(csvCell).join(','));
  return [headers.join(','), ...lines].join('\r\n');
}

async function webUrlFor(accessToken: string, itemId: string) {
  try {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${VAULT_DRIVE_ID}/items/${itemId}?$select=webUrl`,
      { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(15000) },
    );
    if (!res.ok) return '';
    return (await res.json()).webUrl || '';
  } catch {
    return '';
  }
}

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    if (String(body.password || '') !== CONCLUDE_PASSWORD) {
      return Response.json({ error: 'That password is not correct.' }, { status: 403 });
    }

    const svc = base44.asServiceRole;

    // Everything the event collected, read once.
    const [setupsRes, registrationsRes, invitesRes, messagesRes, scheduledRes, textsRes] = await Promise.all([
      svc.entities.GiftShopEventSetup.filter({}),
      svc.entities.ProgramRegistration.filter({ program_name: GIFT_SHOP_PROGRAM_NAME }),
      svc.entities.GiftShopInvite.filter({}),
      svc.entities.GiftShopMessage.filter({}),
      svc.entities.GiftShopScheduledMessage.filter({}),
      svc.entities.GiftShopText.filter({}),
    ]);

    const allSetups = asArray(setupsRes);
    const setup = body.festival_id
      ? allSetups.find((row: any) => row.festival_id === body.festival_id)
      : null;
    const activeSetup = setup || allSetups
      .slice()
      .sort((a: any, b: any) => (Number(b?.festival_year) || 0) - (Number(a?.festival_year) || 0))[0] || null;

    const registrations = asArray(registrationsRes).map((row: any) => pick(row, REGISTRATION_FIELDS));
    const invites = asArray(invitesRes).map((row: any) => pick(row, INVITE_FIELDS));
    const messages = asArray(messagesRes).map((row: any) => pick(row, MESSAGE_FIELDS));
    const scheduled = asArray(scheduledRes).map((row: any) => pick(row, SCHEDULED_FIELDS));
    const texts = asArray(textsRes).map((row: any) => pick(row, TEXT_FIELDS));

    // A family is one card on the Registration and Check-In board: the same
    // guardian, the same contact and the same shopping slot. Counting phone
    // numbers alone collapsed different families that share a number and split
    // one family whose rows carried different details, so the archive was wrong.
    const familyKey = (row: any) => [
      String(row.parent_guardian_name || row.participant_name || '').trim().toLowerCase(),
      String(row.parent_guardian_phone || row.parent_guardian_email || '').trim(),
      String(row.time_slot || ''),
    ].join('|');
    const familyKeys = new Set(registrations.map(familyKey).filter(Boolean));

    const summary = {
      registrations: registrations.length,
      children: registrations.length,
      families: familyKeys.size,
      checked_in: registrations.filter((row: any) => row.checked_in === true).length,
      completed: registrations.filter((row: any) => row.completed === true).length,
      invites: invites.length,
      messages: messages.length,
      scheduled_messages: scheduled.length,
      texts: texts.length,
    };

    const year = Number(activeSetup?.festival_year)
      || (activeSetup?.event_date ? new Date(activeSetup.event_date).getFullYear() : new Date().getFullYear());
    const eventName = activeSetup?.event_name || GIFT_SHOP_PROGRAM_NAME;
    const concludedAt = new Date().toISOString();

    const snapshot = {
      event: {
        name: eventName,
        year,
        date: activeSetup?.event_date || null,
        start_time: activeSetup?.start_time || '',
        end_time: activeSetup?.end_time || '',
        venue: activeSetup?.venue || '',
        desk_location: activeSetup?.desk_location || '',
        registration_opens: activeSetup?.registration_opens || null,
        registration_closes: activeSetup?.registration_closes || null,
        slot_minutes: activeSetup?.slot_minutes ?? null,
        children_per_slot: activeSetup?.children_per_slot ?? null,
        gifts_per_child: activeSetup?.gifts_per_child ?? null,
        gift_price: activeSetup?.gift_price ?? null,
        coordinator_name: activeSetup?.coordinator_name || '',
        coordinator_phone: activeSetup?.coordinator_phone || '',
        coordinator_email: activeSetup?.coordinator_email || '',
        volunteers_needed: activeSetup?.volunteers_needed ?? null,
        notes: activeSetup?.notes || '',
      },
      summary,
      concluded_at: concludedAt,
      concluded_by_name: user.full_name || user.email || '',
      registrations,
      invites,
      messages,
      scheduled_messages: scheduled,
      texts,
    };

    // SharePoint first: nothing is cleared unless the copy is safely written.
    const files: { name: string; item_id: string; web_url: string }[] = [];
    try {
      const accessToken = await getGraphAccessToken();
      await ensureFolderPath(accessToken, SHAREPOINT_FOLDER);

      const baseName = `${eventName} - ${year}`;
      const jsonName = `${baseName} - event archive.json`;
      const csvName = `${baseName} - registrations.csv`;

      const jsonUpload = await uploadFileToVault(
        accessToken,
        SHAREPOINT_FOLDER,
        jsonName,
        new TextEncoder().encode(JSON.stringify(snapshot, null, 2)).buffer,
      );
      files.push({
        name: jsonUpload.name,
        item_id: jsonUpload.itemId,
        web_url: await webUrlFor(accessToken, jsonUpload.itemId),
      });

      const csvUpload = await uploadFileToVault(
        accessToken,
        SHAREPOINT_FOLDER,
        csvName,
        new TextEncoder().encode(registrationsCsv(registrations)).buffer,
      );
      files.push({
        name: csvUpload.name,
        item_id: csvUpload.itemId,
        web_url: await webUrlFor(accessToken, csvUpload.itemId),
      });
    } catch (error: any) {
      console.log('Conclude Kids Gift Shop: SharePoint copy failed —', error?.message);
      return Response.json({
        error: `The event could not be copied to SharePoint, so nothing was cleared: ${error?.message || 'unknown error'}`,
      }, { status: 502 });
    }

    // The archive record the Event archive tab reads.
    const archive = await svc.entities.GiftShopEventArchive.create({
      festival_id: activeSetup?.festival_id || '',
      festival_year: year,
      event_name: eventName,
      event_date: activeSetup?.event_date || null,
      start_time: activeSetup?.start_time || '',
      end_time: activeSetup?.end_time || '',
      venue: activeSetup?.venue || '',
      desk_location: activeSetup?.desk_location || '',
      registration_opens: activeSetup?.registration_opens || null,
      registration_closes: activeSetup?.registration_closes || null,
      slot_minutes: activeSetup?.slot_minutes ?? null,
      children_per_slot: activeSetup?.children_per_slot ?? null,
      gifts_per_child: activeSetup?.gifts_per_child ?? null,
      gift_price: activeSetup?.gift_price ?? null,
      coordinator_name: activeSetup?.coordinator_name || '',
      coordinator_phone: activeSetup?.coordinator_phone || '',
      coordinator_email: activeSetup?.coordinator_email || '',
      volunteers_needed: activeSetup?.volunteers_needed ?? null,
      notes: activeSetup?.notes || '',
      summary,
      registrations,
      invites,
      messages,
      scheduled_messages: scheduled,
      texts,
      concluded_at: concludedAt,
      concluded_by_name: user.full_name || user.email || '',
      sharepoint_path: SHAREPOINT_FOLDER,
      sharepoint_files: files,
    });

    // The event is a milestone in Candora's history, so it is also recorded in the
    // Candora Archives portal — same counts, venue and SharePoint folder. A
    // failure here never blocks the archive or the clearing below.
    try {
      const [dateYear, dateMonth, dateDay] = String(activeSetup?.event_date || '')
        .split('-')
        .map((part) => Number(part));
      const when = dateYear
        ? new Date(`${activeSetup.event_date}T12:00:00Z`).toLocaleDateString('en-CA', {
          year: 'numeric', month: 'long', day: 'numeric',
        })
        : String(year);
      const familyWord = summary.families === 1 ? 'family' : 'families';
      const childWord = summary.children === 1 ? 'child' : 'children';
      const venue = activeSetup?.venue || 'the festival';

      const entry: any = {
        title: `${eventName} ${year}`,
        year,
        era: 'modern',
        category: 'community_impact',
        summary: `${eventName} on ${when} at ${venue} — ${summary.families} ${familyWord}, ${summary.children} ${childWord}, ${summary.completed} taken through the shop by volunteers.`,
        detailed_content: [
          `<p>${eventName} ran on ${when} at ${venue}${activeSetup?.desk_location ? `, with the check-in desk at ${activeSetup.desk_location}` : ''}.</p>`,
          '<ul>',
          `<li>${summary.families} ${familyWord} and ${summary.children} ${childWord} registered</li>`,
          `<li>${summary.checked_in} children checked in on the day</li>`,
          `<li>${summary.completed} children finished shopping with a volunteer</li>`,
          `<li>${summary.invites} pre-registration invitations sent</li>`,
          '</ul>',
          `<p>The full record — every registration, check-in and message — is kept in SharePoint under ${SHAREPOINT_FOLDER}.</p>`,
        ].join(''),
        is_featured: false,
      };
      if (dateMonth) entry.month = dateMonth;
      if (dateDay) entry.day = dateDay;
      await svc.entities.ArchiveTimelineItem.create(entry);
    } catch (error: any) {
      console.log('Conclude Kids Gift Shop: Archives entry failed —', error?.message);
    }

    // Clear the shop for next year — the archive above and the SharePoint copy
    // hold everything that was just removed.
    const cleared = {
      registrations: 0,
      invites: 0,
      messages: 0,
      scheduled_messages: 0,
      texts: 0,
      setups: 0,
    };

    const idsOf = (rows: any[]) => rows.map((row) => row.id).filter(Boolean);
    const deleteRows = (entity: any, ids: string[]) =>
      (ids.length ? entity.deleteMany({ id: { $in: ids } }) : Promise.resolve(null));

    const clearedResults = await Promise.allSettled([
      svc.entities.ProgramRegistration.deleteMany({ program_name: GIFT_SHOP_PROGRAM_NAME }),
      deleteRows(svc.entities.GiftShopInvite, idsOf(invites)),
      deleteRows(svc.entities.GiftShopMessage, idsOf(messages)),
      deleteRows(svc.entities.GiftShopScheduledMessage, idsOf(scheduled)),
      deleteRows(svc.entities.GiftShopText, idsOf(texts)),
      // Every setup goes, so next year's wizard starts from a blank shop rather
      // than an older year's dates quietly becoming current again.
      deleteRows(svc.entities.GiftShopEventSetup, idsOf(allSetups)),
    ]);

    const keys = ['registrations', 'invites', 'messages', 'scheduled_messages', 'texts', 'setups'] as const;
    clearedResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.log(`Conclude Kids Gift Shop: could not clear ${keys[index]} —`, result.reason?.message);
      }
    });
    cleared.registrations = registrations.length;
    cleared.invites = invites.length;
    cleared.messages = messages.length;
    cleared.scheduled_messages = scheduled.length;
    cleared.texts = texts.length;
    cleared.setups = allSetups.length;

    return Response.json({
      archive_id: archive.id,
      summary,
      cleared,
      sharepoint_path: SHAREPOINT_FOLDER,
      sharepoint_files: files,
      cleared_errors: clearedResults
        .map((result, index) => (result.status === 'rejected' ? keys[index] : null))
        .filter(Boolean),
    });
  } catch (error: any) {
    console.log('Conclude Kids Gift Shop failed:', error?.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}