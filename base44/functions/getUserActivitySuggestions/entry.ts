import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const suggestions = [];

    // Helper: safely list entities (user-scoped automatically by created_by_id)
    const safeList = async (entityName, sort = '-updated_date', limit = 100) => {
      try {
        return await base44.entities[entityName].list(sort, limit);
      } catch { return []; }
    };

    // Helper: safely filter entities
    const safeFilter = async (entityName, query, sort = '-updated_date', limit = 100) => {
      try {
        return await base44.entities[entityName].filter(query, sort, limit);
      } catch { return []; }
    };

    const ACTIVE_TASK_STATUSES = ['not_started', 'in_progress', 'waiting', 'blocked'];
    const ACTIVE_PROJECT_STATUSES = ['planning', 'active', 'on_hold', 'in_progress'];

    // ── ED Tasks ──────────────────────────────────────────
    const edTasks = await safeList('EDTask', '-updated_date', 80);
    edTasks
      .filter(t => ACTIVE_TASK_STATUSES.includes(t.status))
      .forEach(t => suggestions.push({
        id: `edtask-${t.id}`, source: 'ED Task', source_id: t.id,
        title: t.title,
        description: t.description || '',
        category: 'Task',
        suggestion_type: 'action_item',
        priority: t.priority,
        status: t.status,
        due_date: t.due_date,
        tags: t.tags,
        updated_date: t.updated_date,
      }));

    // ── ED Projects ───────────────────────────────────────
    const edProjects = await safeList('EDProject', '-updated_date', 50);
    edProjects
      .filter(p => ACTIVE_PROJECT_STATUSES.includes(p.status))
      .forEach(p => suggestions.push({
        id: `edproject-${p.id}`, source: 'ED Project', source_id: p.id,
        title: p.name,
        description: p.description || '',
        category: 'Project',
        suggestion_type: 'update',
        status: p.status,
        progress: p.progress_percent,
        risk_level: p.risk_level,
        updated_date: p.updated_date,
      }));

    // ── ED Notes ──────────────────────────────────────────
    const edNotes = await safeList('EDNote', '-updated_date', 40);
    edNotes.forEach(n => suggestions.push({
      id: `ednote-${n.id}`, source: 'ED Note', source_id: n.id,
      title: n.title,
      description: (n.content || '').slice(0, 250),
      category: 'Note',
      note_type: n.note_type,
      suggestion_type: n.note_type === 'action_item' ? 'action_item' : 'discussion',
      tags: n.tags,
      updated_date: n.updated_date,
    }));

    // ── ED Objectives (OPSP) ──────────────────────────────
    const objectives = await safeList('EDObjective', '-updated_date', 30);
    objectives
      .filter(o => ['active', 'at_risk'].includes(o.status))
      .forEach(o => suggestions.push({
        id: `edobj-${o.id}`, source: 'Strategic Objective', source_id: o.id,
        title: o.title,
        description: o.description || '',
        category: 'Strategic Objective',
        suggestion_type: 'update',
        status: o.status,
        progress: o.progress_percent,
        quarter: o.quarter,
        updated_date: o.updated_date,
      }));

    // ── ED KPIs ───────────────────────────────────────────
    const kpis = await safeList('EDKPI', '-updated_date', 20);
    kpis.forEach(k => suggestions.push({
      id: `edkpi-${k.id}`, source: 'KPI', source_id: k.id,
      title: k.name,
      description: k.description || '',
      category: 'KPI',
      suggestion_type: 'update',
      current_value: k.current_value,
      target_value: k.target_value,
      unit: k.unit,
      trend: k.trend,
      updated_date: k.updated_date,
    }));

    // ── Events/Projects Manager — Projects ───────────────
    const evtProjects = await safeList('Project', '-updated_date', 50);
    evtProjects
      .filter(p => ACTIVE_PROJECT_STATUSES.includes(p.status))
      .forEach(p => suggestions.push({
        id: `project-${p.id}`, source: 'Project', source_id: p.id,
        title: p.name,
        description: p.description || '',
        category: p.project_type === 'fundraising_grant' ? 'Grant / Fundraising' : 'Project',
        suggestion_type: 'update',
        status: p.status,
        priority: p.priority,
        progress: p.progress_percent,
        updated_date: p.updated_date,
      }));

    // ── Events/Projects Manager — Programs ────────────────
    const programs = await safeList('Program', '-updated_date', 30);
    programs
      .filter(p => ['planning', 'active'].includes(p.status))
      .forEach(p => suggestions.push({
        id: `program-${p.id}`, source: 'Program', source_id: p.id,
        title: p.name,
        description: p.description || '',
        category: 'Program',
        suggestion_type: 'update',
        status: p.status,
        updated_date: p.updated_date,
      }));

    // ── Project Tasks ─────────────────────────────────────
    const projectTasks = await safeList('ProjectTask', '-updated_date', 80);
    projectTasks
      .filter(t => ACTIVE_TASK_STATUSES.includes(t.status))
      .forEach(t => suggestions.push({
        id: `ptask-${t.id}`, source: 'Project Task', source_id: t.id,
        title: t.title,
        description: t.description || '',
        category: 'Task',
        suggestion_type: 'action_item',
        status: t.status,
        priority: t.priority,
        due_date: t.due_date,
        updated_date: t.updated_date,
      }));

    // ── File Manager Notes (filtered by owner_email) ──────
    const notes = await safeFilter('Note', { owner_email: user.email }, '-updated_date', 30);
    notes.forEach(n => suggestions.push({
      id: `note-${n.id}`, source: 'Note', source_id: n.id,
      title: n.title,
      description: (n.content || '').replace(/<[^>]+>/g, '').slice(0, 250),
      category: 'Note',
      suggestion_type: 'discussion',
      tags: n.tags,
      updated_date: n.updated_date,
    }));

    // ── Personal Organizer (filtered by user_email) ───────
    const organizers = await safeFilter('PersonalOrganizer', { user_email: user.email }, '-updated_date', 5);
    organizers.forEach(org => {
      (org.priorities || []).forEach(p => {
        if (p.title) suggestions.push({
          id: `po-priority-${p.id}`, source: 'Priority', source_id: p.id,
          title: p.title,
          description: p.priority_level ? `Priority: ${p.priority_level}` : '',
          category: 'Priority',
          suggestion_type: 'action_item',
          due_date: p.due_date,
          updated_date: p.created_at || org.updated_date,
        });
      });
      (org.notes || []).forEach(n => {
        suggestions.push({
          id: `po-note-${n.id}`, source: 'Personal Note', source_id: n.id,
          title: n.subject || 'Personal Note',
          description: n.raw_entry || n.formatted || '',
          category: 'Note',
          suggestion_type: 'discussion',
          updated_date: n.created_at || org.updated_date,
        });
      });
      (org.tasks || []).forEach(t => {
        if (!t.done && t.text) suggestions.push({
          id: `po-task-${t.id}`, source: 'Personal Task', source_id: t.id,
          title: t.text,
          description: '',
          category: 'Task',
          suggestion_type: 'action_item',
          updated_date: t.created_at || org.updated_date,
        });
      });
    });

    // Sort by most recently updated
    suggestions.sort((a, b) => {
      const da = new Date(b.updated_date || 0).getTime();
      const db = new Date(a.updated_date || 0).getTime();
      return da - db;
    });

    return Response.json({ suggestions, count: suggestions.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});