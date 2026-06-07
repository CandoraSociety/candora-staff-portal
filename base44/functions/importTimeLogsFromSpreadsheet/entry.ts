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

    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i];
      const rowNum = i + 1;

      try {
        if (!row.volunteer_id || !row.volunteer_name) {
          errors.push({ row: rowNum, error: 'Missing volunteer_id or volunteer_name' });
          skipped++;
          continue;
        }

        // Validate volunteer exists
        const volunteers = await base44.asServiceRole.entities.Volunteer.filter({ id: row.volunteer_id });
        if (!volunteers || volunteers.length === 0) {
          errors.push({ row: rowNum, error: `Volunteer ID ${row.volunteer_id} not found` });
          skipped++;
          continue;
        }

        const volunteer = volunteers[0];
        const signOut = row.sign_out_time ? new Date(row.sign_out_time).toISOString() : null;
        const totalHours = row.total_hours ? parseFloat(row.total_hours) : null;
        const signIn = row.sign_in_time ? new Date(row.sign_in_time).toISOString() : null;

        await base44.asServiceRole.entities.VolunteerTimeLog.create({
          volunteer_id: row.volunteer_id,
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
      details: { imported, skipped, errors: errors.slice(0, 10) } // Show first 10 errors
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});