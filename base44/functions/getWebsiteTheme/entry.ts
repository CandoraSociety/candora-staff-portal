import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  publicThemeStages,
  themeSchedule,
  activeThemeSummary,
} from '../../shared/websiteThemes.ts';

// The seasonal theme calendar for Website Studio: every stage that can be
// switched to by hand, the schedule automatic mode follows, and the stage live
// right now. All of it is worked out in Alberta time on the server, so the
// Studio and the public website can never disagree about the dates.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const now = Date.now();
    return Response.json({
      now: new Date(now).toISOString(),
      timezone: 'Alberta time (UTC-6, no daylight saving)',
      stages: publicThemeStages(now),
      schedule: themeSchedule(now),
      active: activeThemeSummary(now),
    });
  } catch (error) {
    console.log('getWebsiteTheme failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}