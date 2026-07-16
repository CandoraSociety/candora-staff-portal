import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Printer, Calendar } from 'lucide-react';

const ACTION_PLAN_LABELS = {
  job_search_workshop: 'Job Search Workshop',
  resume_writing_workshop: 'Resume Writing Workshop',
  interview_skills_workshop: 'Interview Skills Workshop',
  workplace_readiness_workshop: 'Workplace Readiness Workshop',
  financial_literacy_workshop: 'Financial Literacy Workshop',
  digital_literacy_workshop: 'Digital Literacy Workshop',
  empoweru: 'EmpowerU',
  ell_classes: 'ELL Classes',
  skills_assessment: 'Skills Assessment',
  internal_placement: 'Internal Placement',
  exposure_course: 'Exposure Course',
  paid_external_placement: 'Paid External Placement',
  employment_supports: 'Employment Supports',
  job_applications: 'Job Applications',
  networking: 'Networking',
  barrier_support: 'Barrier Support',
  other: 'Other',
};

const STAGES = [
  { key: 'intake',            label: 'Intake',                  desc: 'Initial client intake and registration' },
  { key: 'compass',           label: 'Compass Verification',    desc: 'Client file entered into Compass database' },
  { key: 'stream',            label: 'Stream Assignment',       desc: 'Service stream determined and assigned' },
  { key: 'service_start',     label: 'Service Start',           desc: 'Active program participation begins' },
  { key: 'barrier_support',   label: 'Barrier Support',         desc: 'Barriers identified and action plan created' },
  { key: 'training',          label: 'Training / Placement',    desc: 'Workshops, courses, or placement underway' },
  { key: 'completion',        label: 'Program Completion',      desc: 'All program requirements met' },
  { key: 'employment',        label: 'Employment Outcome',      desc: 'Client secures employment' },
  { key: 'followup',          label: '90-Day Follow-Up',        desc: 'Post-completion employment status confirmed' },
];

function getStageStatus(key, client) {
  switch (key) {
    case 'intake':          return client?.intake_date ? 'done' : 'pending';
    case 'compass':         return client?.compass_verified ? 'done' : 'pending';
    case 'stream':          return client?.service_type ? 'done' : 'pending';
    case 'service_start':   return client?.service_start_date ? 'done' : 'pending';
    case 'barrier_support': return client?.bit_completed ? 'done' : 'pending';
    case 'training':        return client?.action_plan_submitted ? 'done' : 'pending';
    case 'completion':      return client?.program_status === 'complete' ? 'done' : 'pending';
    case 'employment':      return client?.employment_start_date ? 'done' : 'pending';
    case 'followup':        return client?.followup_90day_status ? 'done' : 'pending';
    default:                return 'pending';
  }
}

export default function ClientRoadmap({ client }) {
  const handlePrint = () => {
    const win = window.open('', '_blank');
    const name = `${client?.first_name || ''} ${client?.last_name || ''}`.trim();
    const rows = STAGES.map(s => {
      const status = getStageStatus(s.key, client);
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${s.label}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${s.desc}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:${status === 'done' ? '#16a34a' : '#94a3b8'};">${status === 'done' ? '✓ Complete' : 'Pending'}</td>
      </tr>`;
    }).join('');
    win.document.write(`<html><head><title>Pathway Roadmap — ${name}</title><style>body{font-family:sans-serif;padding:32px;}h1{font-size:18px;}table{width:100%;border-collapse:collapse;}th{background:#1a237e;color:#fff;padding:8px 12px;text-align:left;}</style></head>
      <body><h1>Candora Pathways — Client Roadmap</h1><p><strong>Client:</strong> ${name} &nbsp;&nbsp; <strong>Stream:</strong> ${client?.service_type || 'N/A'}</p>
      <table><tr><th>Stage</th><th>Description</th><th>Status</th></tr>${rows}</table></body></html>`);
    win.document.close();
    win.print();
  };

  const stages = STAGES.map(s => ({ ...s, status: getStageStatus(s.key, client) }));
  const completedCount = stages.filter(s => s.status === 'done').length;

  const sdpItems = (client?.sdp_items || []).map(key => ({
    key,
    label: ACTION_PLAN_LABELS[key] || key,
    date: client?.sdp_item_details?.[key]?.date || '',
  }));
  const sdpDated = sdpItems.filter(i => i.date).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{completedCount} / {stages.length} stages complete</div>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="w-3.5 h-3.5 mr-1" /> Print Pathway
        </Button>
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-200" />

        <div className="space-y-1">
          {stages.map((stage, idx) => {
            const done = stage.status === 'done';
            const isNext = !done && stages.slice(0, idx).every(s => s.status === 'done');
            return (
              <div key={stage.key} className="flex items-start gap-3 pl-0 relative">
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${
                  done ? 'bg-green-500 border-green-500' : isNext ? 'bg-white border-primary' : 'bg-white border-slate-300'
                }`}>
                  {done
                    ? <CheckCircle2 className="w-4 h-4 text-white" />
                    : <Circle className={`w-3 h-3 ${isNext ? 'text-primary' : 'text-slate-300'}`} />}
                </div>
                <div className={`flex-1 pb-3 ${done ? '' : 'opacity-60'}`}>
                  <div className={`text-sm font-medium ${done ? 'text-green-700' : isNext ? 'text-primary' : 'text-slate-500'}`}>{stage.label}</div>
                  <div className="text-xs text-muted-foreground">{stage.desc}</div>
                </div>
              </div>
            );
          })}

          {/* Action plan items with dates */}
          {sdpDated.length > 0 && (
            <>
              <div className="flex items-center gap-2 pl-0 pt-2 pb-1">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">Action Plan Milestones</span>
              </div>
              {sdpDated.map(item => (
                <div key={item.key} className="flex items-start gap-3 pl-0 relative">
                  <div className="w-7 h-7 rounded-full border-2 bg-primary/10 border-primary flex items-center justify-center shrink-0 z-10">
                    <Calendar className="w-3 h-3 text-primary" />
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="text-sm font-medium text-slate-700">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.date}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}