import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  computeProgramStatus,
  canConfirmNow,
  nextWaitlistPosition,
  statusLabel,
  cleanText,
} from '../../shared/websitePrograms.ts';
import { sendProgramEmail } from '../../shared/programEmails.ts';

// The one way a seat is ever handed out. Everything is decided here, on the
// server, from the program's own record: validation, duplicates, approval, seats,
// waitlist and the matching email. The page only ever learns the outcome.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = cleanText;

export default async function (req) {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));

    const identifier = clean(body.program_id || body.slug, 200);
    const fullName = clean(body.full_name, 160);
    const email = clean(body.email, 200).toLowerCase();
    const consent = body.consent === true;

    if (!identifier) return Response.json({ error: 'Choose a program to register for.' }, { status: 400 });
    if (fullName.length < 2) return Response.json({ error: 'Please give your full name.' }, { status: 400 });
    if (!EMAIL_RE.test(email)) return Response.json({ error: 'Please give a valid email address.' }, { status: 400 });
    if (!consent) {
      return Response.json({ error: 'Please agree to your details being used for this registration.' }, { status: 400 });
    }

    const program = body.program_id
      ? await svc.entities.WebsiteProgram.get(identifier).catch((e) => (e.status === 404 ? null : Promise.reject(e)))
      : (await svc.entities.WebsiteProgram.filter({ slug: identifier }, { limit: 1 })).items?.[0] || null;

    if (!program || program.is_published === false) {
      return Response.json({ error: 'That program is not open for registration.' }, { status: 404 });
    }

    // One registration per person per program — asking again returns where they
    // already stand rather than taking a second seat.
    const existing = (await svc.entities.WebsiteProgramRegistration.filter(
      { program: program.id, email },
      { limit: 1 }
    )).items?.[0];
    if (existing) {
      return Response.json({
        status: existing.status,
        waitlist_position: existing.waitlist_position || 0,
        program_name: program.name,
      });
    }

    const session = body.session_id
      ? await svc.entities.WebsiteProgramSession.get(clean(body.session_id, 100)).catch((e) =>
          e.status === 404 ? null : Promise.reject(e)
        )
      : null;
    if (session?.is_cancelled) {
      return Response.json({ error: 'That session has been cancelled.' }, { status: 409 });
    }

    const confirmedCount = await svc.entities.WebsiteProgramRegistration.count({
      program: program.id,
      status: 'confirmed',
    });
    const programStatus = computeProgramStatus(program, confirmedCount);

    if (!program.registration_required || program.registration_mode === 'none' || programStatus === 'drop_in') {
      return Response.json({ error: 'This program is drop-in — no registration is needed.' }, { status: 400 });
    }
    if (programStatus === 'registration_opening_soon' || programStatus === 'closed' || programStatus === 'finished') {
      return Response.json(
        { error: `Registration is not open for this program (${statusLabel(programStatus)}).` },
        { status: 409 }
      );
    }

    let seatsTaken = confirmedCount;
    let sessionFull = false;
    if (session && Number(session.capacity) > 0) {
      sessionFull = Number(session.seats_taken || 0) >= Number(session.capacity);
    }

    const base = {
      program: program.id,
      program_name: program.name || '',
      program_slug: program.slug || '',
      session: session?.id || '',
      full_name: fullName,
      email,
      phone: clean(body.phone, 40),
      preferred_language: clean(body.preferred_language, 80),
      accessibility_needs: clean(body.accessibility_needs, 1000),
      notes: clean(body.notes, 2000),
      consent,
      source: 'website',
    };

    const wantsApproval = program.approval_required || program.registration_mode === 'approval';
    let status = 'confirmed';
    let waitlistPosition = 0;

    if (wantsApproval) {
      status = 'pending_approval';
    } else if (canConfirmNow(program, seatsTaken) && !sessionFull) {
      status = 'confirmed';
    } else if (program.waitlist_enabled) {
      const waiting = (await svc.entities.WebsiteProgramRegistration.filter(
        { program: program.id, status: 'waitlisted' },
        { limit: 200 }
      )).items || [];
      status = 'waitlisted';
      waitlistPosition = nextWaitlistPosition(waiting);
    } else {
      return Response.json({ error: 'This program is full and is not taking a waitlist.' }, { status: 409 });
    }

    const record = await svc.entities.WebsiteProgramRegistration.create({
      ...base,
      status,
      ...(waitlistPosition ? { waitlist_position: waitlistPosition } : {}),
    });

    // Seats are counted on the program and on the dated session, so the page and
    // the calendar both drop the count the moment a seat is taken.
    if (status === 'confirmed') {
      seatsTaken += 1;
      await svc.entities.WebsiteProgram.update(program.id, { seats_taken: seatsTaken }).catch(() => {});
      if (session) {
        await svc.entities.WebsiteProgramSession
          .update(session.id, { seats_taken: Number(session.seats_taken || 0) + 1 })
          .catch(() => {});
      }
    }

    if (status === 'confirmed') {
      await sendProgramEmail(base44, {
        template: 'ProgramRegistrationConfirmed',
        to: email,
        program,
        session,
        registration: record,
        nextStep: 'Your seat is held. Please arrive ten minutes before the start time and check in at the front desk.',
        ctaLabel: 'Program details',
      });
    } else if (status === 'waitlisted') {
      await sendProgramEmail(base44, {
        template: 'ProgramWaitlisted',
        to: email,
        program,
        session,
        registration: record,
        extra: { waitlist_position: String(waitlistPosition) },
        nextStep: `You are number ${waitlistPosition} on the waitlist. We will email you the moment a seat opens.`,
        ctaLabel: 'Program details',
      });
    } else {
      await sendProgramEmail(base44, {
        template: 'ProgramRegistrationReceived',
        to: email,
        program,
        session,
        registration: record,
        nextStep: 'A staff member will review your registration and email you with a decision. No seat is held until you hear from us.',
        ctaLabel: 'Program details',
      });
    }

    return Response.json({
      status,
      waitlist_position: waitlistPosition,
      program_name: program.name || '',
    });
  } catch (error) {
    console.log('registerForProgram failed:', error?.message || error);
    return Response.json({ error: 'The registration could not be completed. Please try again.' }, { status: 500 });
  }
}