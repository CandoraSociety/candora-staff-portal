import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  buildSessions,
  nextWaitlistPosition,
  cleanText,
  ALBERTA_TZ,
} from '../../shared/websitePrograms.ts';
import { sendProgramEmail } from '../../shared/programEmails.ts';

// The staff actions behind the program queues: generating a calendar, deciding a
// registration, and moving the waitlist along. Every decision is made here so the
// same seat can never be handed out twice, and every decision is emailed.
const clean = cleanText;

const ACTIVE_SEAT = ['confirmed', 'attended'];

async function confirmedCount(base44, programId) {
  return base44.asServiceRole.entities.WebsiteProgramRegistration.count({
    program: programId,
    status: 'confirmed',
  });
}

// Gives the next person in line the seat that just opened, and starts the clock on
// how long the offer is held for them.
async function offerToNextInLine(base44, program) {
  const waiting = (await base44.asServiceRole.entities.WebsiteProgramRegistration.filter(
    { program: program.id, status: 'waitlisted' },
    { sort: 'waitlist_position', limit: 100 }
  )).items || [];
  const next = waiting.find((item) => Number(item.waitlist_position) > 0) || waiting[0];
  if (!next) return null;

  const hours = Number(program.waitlist_offer_hours) || 72;
  const expires = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  const taken = await confirmedCount(base44, program.id);

  await base44.asServiceRole.entities.WebsiteProgramRegistration.update(next.id, {
    status: 'confirmed',
    waitlist_position: null,
    waitlist_offer_expires_at: expires,
    decided_at: new Date().toISOString(),
  });
  await base44.asServiceRole.entities.WebsiteProgram.update(program.id, { seats_taken: taken + 1 });

  // The line closes up behind them.
  const remaining = waiting.filter((item) => item.id !== next.id);
  if (remaining.length) {
    await base44.asServiceRole.entities.WebsiteProgramRegistration.bulkUpdate(
      remaining.map((item, index) => ({ id: item.id, waitlist_position: index + 1 }))
    );
  }

  await sendProgramEmail(base44, {
    template: 'ProgramWaitlistOffer',
    to: next.email,
    program,
    registration: next,
    extra: {
      offer_expires: new Date(expires).toLocaleString('en-CA', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: ALBERTA_TZ,
      }),
    },
    nextStep: `A seat has opened and it is held for you until ${new Date(expires).toLocaleString('en-CA', {
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: ALBERTA_TZ,
    })}. If we do not hear from you by then it passes to the next person.`,
    ctaLabel: 'Program details',
  });

  return next;
}

export default async function (req) {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = clean(body.action, 40);
    const staffName = user.full_name || user.email || '';

    if (action === 'generate_sessions') {
      const program = await svc.entities.WebsiteProgram
        .get(clean(body.program_id, 100))
        .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!program) return Response.json({ error: 'Program not found' }, { status: 404 });

      const wanted = buildSessions(program, Number(body.days) || 90);
      if (!wanted.length) {
        return Response.json(
          { error: 'This program has no weekly recurrence set, so there are no sessions to generate.' },
          { status: 400 }
        );
      }

      const existing = (await svc.entities.WebsiteProgramSession.filter(
        { program: program.id },
        { limit: 500 }
      )).items || [];
      const known = new Set(existing.map((item) => item.starts_at));
      const missing = wanted.filter((session) => !known.has(session.starts_at));

      if (missing.length) {
        await svc.entities.WebsiteProgramSession.bulkCreate(
          missing.map((session) => ({
            ...session,
            program: program.id,
            program_name: program.name || '',
            program_slug: program.slug || '',
          }))
        );
      }
      return Response.json({ created: missing.length, total: known.size + missing.length });
    }

    if (action === 'decide_registration') {
      const registration = await svc.entities.WebsiteProgramRegistration
        .get(clean(body.id, 100))
        .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!registration) return Response.json({ error: 'Registration not found' }, { status: 404 });

      const program = await svc.entities.WebsiteProgram
        .get(registration.program)
        .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!program) return Response.json({ error: 'Program not found' }, { status: 404 });

      const decision = clean(body.decision, 30);
      const session = registration.session
        ? await svc.entities.WebsiteProgramSession
            .get(registration.session)
            .catch((e) => (e.status === 404 ? null : Promise.reject(e)))
        : null;
      const wasSeated = ACTIVE_SEAT.includes(registration.status);
      const now = new Date().toISOString();

      const update = { decided_by: staffName, decided_at: now };

      if (decision === 'approve') {
        Object.assign(update, { status: 'confirmed', waitlist_position: null, decline_reason: '' });
        await svc.entities.WebsiteProgramRegistration.update(registration.id, update);
        if (!wasSeated) {
          const taken = await confirmedCount(base44, program.id);
          await svc.entities.WebsiteProgram.update(program.id, { seats_taken: taken + 1 });
          if (session) {
            await svc.entities.WebsiteProgramSession
              .update(session.id, { seats_taken: Number(session.seats_taken || 0) + 1 })
              .catch(() => {});
          }
        }
        await sendProgramEmail(base44, {
          template: 'ProgramApproved',
          to: registration.email,
          program,
          session,
          registration,
          nextStep: 'Your place is confirmed. Please arrive ten minutes before the start and check in at the front desk.',
          ctaLabel: 'Program details',
        });
      } else if (decision === 'decline') {
        Object.assign(update, {
          status: 'declined',
          waitlist_position: null,
          decline_reason: clean(body.reason, 500),
        });
        await svc.entities.WebsiteProgramRegistration.update(registration.id, update);
        if (wasSeated) {
          const taken = await confirmedCount(base44, program.id);
          await svc.entities.WebsiteProgram.update(program.id, { seats_taken: Math.max(0, taken - 1) });
        }
        await sendProgramEmail(base44, {
          template: 'ProgramDeclined',
          to: registration.email,
          program,
          session,
          registration,
          extra: { reason_line: clean(body.reason, 500) },
          nextStep: clean(body.reason, 500) || 'Please contact us if you would like to talk about this decision.',
          ctaLabel: 'Other programs',
        });
      } else if (decision === 'waitlist') {
        const waiting = (await svc.entities.WebsiteProgramRegistration.filter(
          { program: program.id, status: 'waitlisted' },
          { limit: 200 }
        )).items || [];
        const position = nextWaitlistPosition(waiting);
        Object.assign(update, { status: 'waitlisted', waitlist_position: position });
        await svc.entities.WebsiteProgramRegistration.update(registration.id, update);
        if (wasSeated) {
          const taken = await confirmedCount(base44, program.id);
          await svc.entities.WebsiteProgram.update(program.id, { seats_taken: Math.max(0, taken - 1) });
        }
        await sendProgramEmail(base44, {
          template: 'ProgramWaitlisted',
          to: registration.email,
          program,
          session,
          registration,
          extra: { waitlist_position: String(position) },
          nextStep: `You are number ${position} on the waitlist. We will email you the moment a seat opens.`,
          ctaLabel: 'Program details',
        });
      } else if (decision === 'cancel') {
        Object.assign(update, { status: 'cancelled', waitlist_position: null });
        await svc.entities.WebsiteProgramRegistration.update(registration.id, update);
        if (wasSeated) {
          const taken = await confirmedCount(base44, program.id);
          await svc.entities.WebsiteProgram.update(program.id, { seats_taken: Math.max(0, taken - 1) });
          if (session) {
            await svc.entities.WebsiteProgramSession
              .update(session.id, { seats_taken: Math.max(0, Number(session.seats_taken || 0) - 1) })
              .catch(() => {});
          }
          if (program.auto_promote_from_waitlist) {
            await offerToNextInLine(base44, program);
          }
        }
      } else if (decision === 'attended' || decision === 'no_show') {
        Object.assign(update, { status: decision });
        await svc.entities.WebsiteProgramRegistration.update(registration.id, update);
      } else if (decision === 'in_review') {
        Object.assign(update, { status: 'pending_approval' });
        await svc.entities.WebsiteProgramRegistration.update(registration.id, update);
      } else {
        return Response.json({ error: 'Unknown decision' }, { status: 400 });
      }

      const fresh = await svc.entities.WebsiteProgramRegistration.get(registration.id);
      return Response.json({ registration: fresh });
    }

    if (action === 'promote_waitlist') {
      const registration = await svc.entities.WebsiteProgramRegistration
        .get(clean(body.id, 100))
        .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!registration) return Response.json({ error: 'Registration not found' }, { status: 404 });
      const program = await svc.entities.WebsiteProgram
        .get(registration.program)
        .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!program) return Response.json({ error: 'Program not found' }, { status: 404 });

      const taken = await confirmedCount(base44, program.id);
      const hours = Number(program.waitlist_offer_hours) || 72;
      const expires = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

      await svc.entities.WebsiteProgramRegistration.update(registration.id, {
        status: 'confirmed',
        waitlist_position: null,
        waitlist_offer_expires_at: expires,
        decided_by: staffName,
        decided_at: new Date().toISOString(),
      });
      await svc.entities.WebsiteProgram.update(program.id, { seats_taken: taken + 1 });

      const waiting = (await svc.entities.WebsiteProgramRegistration.filter(
        { program: program.id, status: 'waitlisted' },
        { sort: 'waitlist_position', limit: 200 }
      )).items || [];
      if (waiting.length) {
        await svc.entities.WebsiteProgramRegistration.bulkUpdate(
          waiting.map((item, index) => ({ id: item.id, waitlist_position: index + 1 }))
        );
      }

      await sendProgramEmail(base44, {
        template: 'ProgramWaitlistOffer',
        to: registration.email,
        program,
        registration,
        extra: {
          offer_expires: new Date(expires).toLocaleString('en-CA', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZone: ALBERTA_TZ,
          }),
        },
        nextStep: 'A seat has been offered to you. Please reply to confirm you are coming.',
        ctaLabel: 'Program details',
      });

      const fresh = await svc.entities.WebsiteProgramRegistration.get(registration.id);
      return Response.json({ registration: fresh });
    }

    if (action === 'reorder_waitlist') {
      const ordered = Array.isArray(body.ordered_ids) ? body.ordered_ids.filter(Boolean) : [];
      if (!ordered.length) return Response.json({ error: 'No order given' }, { status: 400 });
      await svc.entities.WebsiteProgramRegistration.bulkUpdate(
        ordered.map((id, index) => ({ id, waitlist_position: index + 1 }))
      );
      return Response.json({ reordered: ordered.length });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.log('programAdmin failed:', error?.message || error);
    return Response.json({ error: 'The action could not be completed.' }, { status: 500 });
  }
}