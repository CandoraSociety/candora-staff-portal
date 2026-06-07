import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Papa from 'npm:papaparse@5.5.3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Get file URL from request
    const { file_url } = await req.json();
    if (!file_url) return Response.json({ error: 'No file URL provided' }, { status: 400 });

    // Download the file from the URL
    const fileResponse = await fetch(file_url);
    if (!fileResponse.ok) {
      return Response.json({ error: 'Failed to download file' }, { status: 400 });
    }
    const text = await fileResponse.text();
    
    // Parse CSV with proper handling of quoted fields and escaped quotes
    const parseResult = Papa.parse(text, { 
      header: true, 
      skipEmptyLines: true,
      quoteChar: '"',
      escapeChar: '"',
      trim: true
    });

    if (parseResult.errors.length > 0) {
      return Response.json({ error: 'CSV parsing failed', details: parseResult.errors }, { status: 400 });
    }

    // Load all volunteers into a map for efficient lookup
    const volunteers = await base44.asServiceRole.entities.Volunteer.list();
    const volunteerMap = new Map();
    const volunteerNameMap = new Map();
    
    volunteers.forEach(v => {
      volunteerMap.set(v.id, v);
      // Also index by full name for fallback matching (case-insensitive)
      const fullName = `${v.first_name} ${v.last_name}`.toLowerCase().trim();
      volunteerNameMap.set(fullName, v);
    });

    let imported = 0;
    let skipped = 0;
    const errors = [];
    const toImport = [];

    // Process each record
    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i];
      const rowNum = i + 2; // Account for header row (1-indexed + header)

      try {
        // Find volunteer by ID first, then fallback to name match
        let volunteer = volunteerMap.get(row.volunteer_id);
        
        if (!volunteer && row.volunteer_name) {
          // Fallback: try to match by name (case-insensitive)
          const nameKey = row.volunteer_name.toLowerCase().trim();
          volunteer = volunteerNameMap.get(nameKey);
        }

        if (!volunteer) {
          errors.push({ 
            row: rowNum, 
            volunteer_id: row.volunteer_id,
            volunteer_name: row.volunteer_name,
            error: 'Volunteer not found' 
          });
          skipped++;
          continue;
        }

        // Parse and validate fields - handle empty strings
        const signIn = row.sign_in_time && row.sign_in_time.trim() ? new Date(row.sign_in_time).toISOString() : null;
        const signOut = row.sign_out_time && row.sign_out_time.trim() ? new Date(row.sign_out_time).toISOString() : null;
        const totalHours = row.total_hours && row.total_hours.trim() ? parseFloat(row.total_hours) : 0;
        const date = row.date && row.date.trim() ? row.date : (signIn ? signIn.split('T')[0] : new Date().toISOString().split('T')[0]);

        // Prepare record for import
        toImport.push({
          volunteer_id: volunteer.id,
          volunteer_name: row.volunteer_name || `${volunteer.first_name} ${volunteer.last_name}`,
          position_id: row.position_id && row.position_id.trim() ? row.position_id : null,
          position_title: (row.position_title && row.position_title.trim()) ? row.position_title : 'Volunteer Work',
          sign_in_time: signIn,
          sign_out_time: signOut,
          total_hours: totalHours,
          date: date,
          notes: (row.notes && row.notes.trim()) ? row.notes : '',
          status: (row.status && row.status.trim()) ? row.status : 'completed'
        });

        imported++;
      } catch (err) {
        errors.push({ 
          row: rowNum, 
          volunteer_id: row.volunteer_id,
          volunteer_name: row.volunteer_name,
          error: err.message 
        });
        skipped++;
      }
    }

    // Bulk insert in batches of 100
    const BATCH_SIZE = 100;
    for (let i = 0; i < toImport.length; i += BATCH_SIZE) {
      const batch = toImport.slice(i, i + BATCH_SIZE);
      await base44.asServiceRole.entities.VolunteerTimeLog.bulkCreate(batch);
    }

    // Recalculate totals for all volunteers
    await base44.functions.invoke('recalcVolunteerTotals', {});

    return Response.json({ 
      success: true, 
      summary: `Imported ${imported} time logs, skipped ${skipped} rows`,
      details: { 
        imported, 
        skipped, 
        errors: errors.slice(0, 20) // Show first 20 errors
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});