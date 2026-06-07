import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { stringify } from 'npm:csv-stringify@6.5.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all time logs
    const timeLogs = await base44.asServiceRole.entities.VolunteerTimeLog.list('-sign_in_time', 10000);

    // Convert to CSV format
    const csvData = timeLogs.map(log => ({
      id: log.id,
      volunteer_id: log.volunteer_id,
      volunteer_name: log.volunteer_name,
      position_id: log.position_id || '',
      position_title: log.position_title || '',
      sign_in_time: log.sign_in_time,
      sign_out_time: log.sign_out_time || '',
      total_hours: log.total_hours || '',
      date: log.date,
      notes: log.notes || '',
      status: log.status
    }));

    // Convert to CSV string
    const csv = await new Promise((resolve, reject) => {
      stringify(csvData, {
        header: true,
        columns: ['id', 'volunteer_id', 'volunteer_name', 'position_id', 'position_title', 'sign_in_time', 'sign_out_time', 'total_hours', 'date', 'notes', 'status']
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=time-logs-export.csv'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});