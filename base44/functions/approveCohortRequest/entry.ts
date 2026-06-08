import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { cohortRequestId } = await req.json();

    if (!cohortRequestId) {
      return Response.json({ error: 'cohortRequestId is required' }, { status: 400 });
    }

    // Get the cohort request
    const cohortRequest = await base44.entities.VolunteerCohortRequest.get(cohortRequestId);
    
    if (!cohortRequest) {
      return Response.json({ error: 'Cohort request not found' }, { status: 404 });
    }

    // Update cohort request status to approved
    await base44.entities.VolunteerCohortRequest.update(cohortRequestId, {
      status: 'approved',
      approved_by: user.email,
      approval_date: new Date().toISOString().split('T')[0],
    });

    // Create a portal card for the cohort
    const card = await base44.entities.PortalCard.create({
      title: `${cohortRequest.organization_name} Volunteer Portal`,
      description: `Dedicated portal for ${cohortRequest.organization_name} cohort volunteers. Access resources, sign up for shifts, and track group hours.`,
      category: 'cohort',
      icon: 'Building2',
      color: 'primary',
      is_active: true,
      sort_order: 100,
      metadata: {
        cohort_request_id: cohortRequestId,
        organization_name: cohortRequest.organization_name,
        organization_type: cohortRequest.organization_type,
        contact_email: cohortRequest.contact_email,
        contact_name: cohortRequest.contact_name,
        number_of_volunteers: cohortRequest.number_of_volunteers,
        areas_of_interest: cohortRequest.areas_of_interest,
      },
    });

    // Update cohort request with card ID
    await base44.entities.VolunteerCohortRequest.update(cohortRequestId, {
      card_created: true,
      card_id: card.id,
    });

    // Send email notification to the cohort contact
    await base44.integrations.Core.SendEmail({
      to: cohortRequest.contact_email,
      subject: `Your Cohort Volunteer Request Has Been Approved!`,
      body: `Dear ${cohortRequest.contact_name},\n\nGreat news! Your volunteer cohort request for ${cohortRequest.organization_name} has been approved.\n\nWe've created a dedicated portal for your group. You can now access volunteer resources, sign up for shifts, and track your group's hours.\n\nOrganization: ${cohortRequest.organization_name}\nOrganization Type: ${cohortRequest.organization_type}\nExpected Volunteers: ${cohortRequest.number_of_volunteers}\nAreas of Interest: ${cohortRequest.areas_of_interest.join(', ')}\n\nIf you have any questions, please don't hesitate to reach out.\n\nThank you for your commitment to making a difference!\n\nBest regards,\nThe Candora Society Volunteer Team`,
    });

    return Response.json({ 
      success: true, 
      message: 'Cohort request approved and portal card created successfully',
      card_id: card.id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});