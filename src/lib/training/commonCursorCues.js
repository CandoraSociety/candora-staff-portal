const target = (name) => ({ selector: `[data-tour="${name}"]` });
const widget = (name) => ({ selector: `[data-tour-widget="${name}"]` });
const cue = (at, region) => ({ at, target: region });

export const COMMON_CURSOR_CUES = {
  dashboard: {
    'Opening a portal': { cues: [cue(0, { selector: '[data-tour-path="/portal"]' }), cue('or the + button', target('tabbar-add'))] },
    'Inside the Portals tab': { cues: [cue(0, target('portal-cards')), cue('Use Search tools', target('portal-filters')), cue('Select a card', target('portal-cards'))] },
  },
  dashboard_widgets: {
    'My Tasks and My Reminders': { cues: [cue(0, widget('my_tasks')), cue('My Reminders shows', widget('my_reminders'))] },
    'Notes, birthdays and recent clients': { cues: [cue(0, widget('quick_notes')), cue('Team Birthdays', widget('team_birthdays')), cue('Recent Clients shortcuts', widget('recent_clients'))] },
    'Tracking widgets': { cues: [cue(0, widget('project_progress')), cue('Time Log is', widget('time_log')), cue('Meeting Manager schedules', widget('meeting_manager')), cue('Google Translate translates', widget('google_translate'))] },
  },
  staffadmin: {
    'Booking time off': { cues: [cue(0, target('vacation-form'))] },
    'Sick time and personal days': { cues: [cue(0, target('sick-form'))] },
  },
};