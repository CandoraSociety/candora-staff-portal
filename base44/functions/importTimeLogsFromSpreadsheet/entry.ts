import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Papa from 'npm:papaparse@5.5.3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file');
    if (!file) return Response.json({ error: 'No file uploaded' }, { status: 400 });

    const text = await file.text();
    const parseResult = Papa.parse(text, { header: true, skipEmptyLines: true });

    if (parseResult.errors.length > 0) {
      return Response.json({ error: 'CSV parsing failed', details: parseResult.errors }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;
    const errors = [];

    // Pre-fetch all volunteers for fast lookup
    const allVolunteers = await base44.asServiceRole.entities.Volunteer.list();
    const volunteerById = new Map();
    const volunteerByName = new Map();
    
    allVolunteers.forEach((vol) => {
      if (vol.id) volunteerById.set(vol.id, vol);
      const fullName = `${vol.first_name} ${vol.last_name}`.toLowerCase().trim();
      if (fullName) volunteerByName.set(fullName, vol);
    });

    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i];
      const rowNum = i + 1;

      try {
        if (!row.volunteer_id && !row.volunteer_name) {
          errors.push({ row: rowNum, error: 'Missing volunteer_id and volunteer_name' });
          skipped++;
          continue;
        }

        // Try to find volunteer by ID first, then by name
        let volunteer = null;
        
        if (row.volunteer_id) {
          volunteer = volunteerById.get(row.volunteer_id);
        }
        
        // Fallback: try matching by name if ID not found
        if (!volunteer && row.volunteer_name) {
          const normalizedName = row.volunteer_name.toLowerCase().trim();
          volunteer = volunteerByName.get(normalizedName);
        }

        if (!volunteer) {
          errors.push({ 
            row: rowNum, 
            error: `Volunteer not found: ID="${row.volunteer_id || 'N/A'}", Name="${row.volunteer_name || 'N/A'}"` 
          });
          skipped++;
          continue;
        }

        const signOut = row.sign_out_time ? new Date(row.sign_out_time).toISOString() : null;
        const totalHours = row.total_hours ? parseFloat(row.total_hours) : null;
        const signIn = row.sign_in_time ? new Date(row.sign_in_time).toISOString() : null;

        await base44.asServiceRole.entities.VolunteerTimeLog.create({
          volunteer_id: volunteer.id,
          volunteer_name: row.volunteer_name || `${volunteer.first_name} ${volunteer.last_name}`,
          position_id: row.position_id || null,
          position_title: row.position_title || 'Volunteer Work',
          sign_in_time: signIn,
          sign_out_time: signOut,
          total_hours: totalHours,
          date: row.date || (signIn ? signIn.split('T')[0] : new Date().toISOString().split('T')[0]),
          notes: row.notes || '',
          status: row.status || 'completed'
        });

        imported++;
      } catch (err) {
        errors.push({ row: rowNum, error: err.message });
        skipped++;
      }
    }

    // Recalculate totals for all volunteers
    await base44.functions.invoke('recalcVolunteerTotals', {});

    return Response.json({ 
      success: true, 
      summary: `Imported ${imported} time logs, skipped ${skipped} rows`,
      details: { imported, skipped, errors: errors.slice(0, 20) } // Show first 20 errors
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});