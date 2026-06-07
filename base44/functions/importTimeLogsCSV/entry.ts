import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { parse } from 'npm:csv-parse@5.5.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url, clear_existing } = await req.json();

    if (!file_url) {
      return Response.json({ error: 'file_url is required' }, { status: 400 });
    }

    // Fetch the CSV file
    const response = await fetch(file_url);
    const csvText = await response.text();

    // Parse CSV
    const records = await new Promise((resolve, reject) => {
      parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    // Fetch all volunteers for matching
    const volunteers = await base44.asServiceRole.entities.Volunteer.list();
    const volunteerById = new Map(volunteers.map(v => [v.id, v]));
    const volunteerByName = new Map();
    volunteers.forEach(v => {
      const name = `${v.first_name} ${v.last_name}`.toLowerCase();
      volunteerByName.set(name, v);
    });

    // Clear existing if requested
    if (clear_existing) {
      const existingLogs = await base44.asServiceRole.entities.VolunteerTimeLog.list();
      for (const log of existingLogs) {
        await base44.asServiceRole.entities.VolunteerTimeLog.delete(log.id);
      }
    }

    // Process records
    const imported = [];
    const errors = [];

    for (const record of records) {
      try {
        // Match volunteer
        let volunteer = null;
        if (record.volunteer_id) {
          volunteer = volunteerById.get(record.volunteer_id);
        }
        if (!volunteer && record.volunteer_name) {
          volunteer = volunteerByName.get(record.volunteer_name.toLowerCase());
        }

        if (!volunteer) {
          errors.push({ row: records.indexOf(record) + 1, error: 'Volunteer not found', data: record });
          continue;
        }

        // Parse dates and hours
        const sign_in_time = record.sign_in_time ? new Date(record.sign_in_time).toISOString() : null;
        const sign_out_time = record.sign_out_time ? new Date(record.sign_out_time).toISOString() : null;
        const total_hours = record.total_hours ? parseFloat(record.total_hours) : null;
        const date = record.date || (sign_in_time ? sign_in_time.split('T')[0] : new Date().toISOString().split('T')[0]);

        // Create time log
        const timeLog = await base44.asServiceRole.entities.VolunteerTimeLog.create({
          volunteer_id: volunteer.id,
          volunteer_name: `${volunteer.first_name} ${volunteer.last_name}`,
          position_id: record.position_id || 'general',
          position_title: record.position_title || 'General Volunteering',
          sign_in_time,
          sign_out_time,
          total_hours,
          date,
          notes: record.notes || '',
          status: record.status || (sign_out_time ? 'completed' : 'signed_in')
        });

        imported.push(timeLog);
      } catch (error) {
        errors.push({ row: records.indexOf(record) + 1, error: error.message, data: record });
      }
    }

    // Recalculate volunteer totals
    await base44.functions.invoke('recalcVolunteerTotals', {});

    return Response.json({
      success: true,
      imported: imported.length,
      errors: errors.length,
      error_details: errors
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});