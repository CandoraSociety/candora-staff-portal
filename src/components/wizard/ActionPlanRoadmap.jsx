import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Calendar, CheckCircle2, XCircle, Clock, ArrowRight, MapPin, Flag } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval } from 'date-fns';
import RoadmapItemPanel from './RoadmapItemPanel';
import BITReviewCheckinPanel from './BITReviewCheckinPanel';

const ITEM_CONFIG = {
  resume_writing: { label: 'Resume Writing', icon: '📄', color: 'bg-purple-500' },
  interview_skills: { label: 'Interview Skills', icon: '🎯', color: 'bg-purple-500' },
  job_search_strategies: { label: 'Job Search Strategies', icon: '🔍', color: 'purple-500' },
  workplace_communication: { label: 'Workplace Communication', icon: '💬', color: 'bg-purple-500' },
  computer_skills: { label: 'Computer Skills', icon: '💻', color: 'bg-purple-500' },
  financial_literacy: { label: 'Financial Literacy', icon: '💰', color: 'bg-purple-500' },
  ell_classes: { label: 'ELL Classes', icon: '📚', color: 'bg-blue-500' },
  upgrading: { label: 'Upgrading', icon: '📈', color: 'bg-blue-500' },
  certification_program: { label: 'Certification Program', icon: '🎓', color: 'bg-blue-500' },
  vocational_training: { label: 'Vocational Training', icon: '🛠️', color: 'bg-blue-500' },
  mentorship: { label: 'Mentorship', icon: '🤝', color: 'bg-blue-500' },
  internal_placement: { label: 'Internal Placement', icon: '🏢', color: 'bg-green-500' },
  external_placement: { label: 'External Placement', icon: '🏭', color: 'bg-green-500' },
  job_shadowing: { label: 'Job Shadowing', icon: '👀', color: 'bg-green-500' },
  work_experience: { label: 'Work Experience', icon: '💼', color: 'bg-green-500' },
  online_applications: { label: 'Online Applications', icon: '🌐', color: 'bg-orange-500' },
  networking: { label: 'Networking', icon: '🤝', color: 'bg-orange-500' },
  job_fair: { label: 'Job Fair', icon: '🎪', color: 'bg-orange-500' },
  employment_agency: { label: 'Employment Agency', icon: '🏛️', color: 'bg-orange-500' },
  direct_employer_contact: { label: 'Direct Employer Contact', icon: '📞', color: 'bg-orange-500' },
  transportation_support: { label: 'Transportation Support', icon: '🚌', color: 'bg-slate-500' },
  childcare_support: { label: 'Childcare Support', icon: '👶', color: 'bg-slate-500' },
  mental_health_support: { label: 'Mental Health Support', icon: '🧠', color: 'bg-slate-500' },
  addiction_support: { label: 'Addiction Support', icon: '🤲', color: 'bg-slate-500' },
  housing_support: { label: 'Housing Support', icon: '🏠', color: 'bg-slate-500' },
};

const STATUS_CONFIG = {
  planned: { label: 'Planned', color: 'bg-slate-200', ring: 'ring-slate-400', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-400', ring: 'ring-blue-600', icon: ArrowRight },
  completed: { label: 'Completed', color: 'bg-green-500', ring: 'ring-green-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-400', ring: 'ring-red-600', icon: XCircle },
};

function parseDate(dateStr) {
  if (!dateStr) return null;
  return parseISO(dateStr + 'T12:00:00');
}

function msPct(min, max, val) {
  if (!val) return null;
  return ((val - min) / (max - min)) * 100;
}

function getItemColor(key) {
  if (key.startsWith('barrier_')) return 'bg-amber-500';
  const config = ITEM_CONFIG[key];
  return config?.color || 'bg-slate-400';
}

function buildItems(selectedItems, itemDetails, roadmapStatus, client) {
  const items = (selectedItems || []).map(key => ({
    key,
    label: ITEM_CONFIG[key]?.label || key.replace(/_/g, ' '),
    icon: ITEM_CONFIG[key]?.icon || '📌',
    color: getItemColor(key),
    detail: itemDetails?.[key] || {},
    status: roadmapStatus?.[key]?.status || 'planned',
    statusData: roadmapStatus?.[key] || {},
    isBarrier: false,
  }));

  for (let n = 1; n <= 3; n++) {
    if (client?.[`barrier_${n}`]) {
      items.push({
        key: `barrier_${n}`,
        label: `Barrier: ${client[`barrier_${n}`]}`,
        icon: '⚠️',
        color: 'bg-amber-500',
        isBarrier: true,
        detail: {
          status: client[`barrier_${n}_status`],
          action_steps: client[`barrier_${n}_action_steps`],
          notes: client[`barrier_${n}_notes`],
        },
        status: roadmapStatus?.[`barrier_${n}`]?.status || 'planned',
        statusData: roadmapStatus?.[`barrier_${n}`] || {},
      });
    }
  }

  return items;
}

export default function ActionPlanRoadmap({ client, onSave }) {
  const [view, setView] = useState('timeline');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showBITPanel, setShowBITPanel] = useState(false);

  const items = useMemo(() => 
    buildItems(client?.sdp_items, client?.sdp_item_details, client?.roadmap_item_status, client),
    [client]
  );

  const intakeDate = parseDate(client?.intake_date) || parseDate(client?.service_start_date) || new Date();
  const projectedEnd = intakeDate ? new Date(intakeDate.getTime() + 90 * 24 * 60 * 60 * 1000) : new Date();
  
  const allDates = items
    .flatMap(item => [
      parseDate(item.statusData?.start_date),
      parseDate(item.statusData?.completed_date),
    ])
    .filter(Boolean);

  const maxDateFromItems = allDates.length > 0 
    ? allDates.reduce((max, d) => (d > max ? d : max))
    : projectedEnd;

  const maxDate = maxDateFromItems > projectedEnd ? maxDateFromItems : projectedEnd;
  const maxDateWithBuffer = new Date(maxDate.getTime() + 28 * 24 * 60 * 60 * 1000);

  const minMs = intakeDate.getTime();
  const maxMs = maxDateWithBuffer.getTime();
  const todayMs = new Date().setHours(12, 0, 0, 0);

  const pct = (date) => {
    if (!date) return null;
    const ms = date instanceof Date ? date.getTime() : parseISO(date + 'T12:00:00').getTime();
    return Math.max(0, Math.min(100, msPct(minMs, maxMs, ms)));
  };

  const months = [];
  const current = startOfMonth(intakeDate);
  const end = endOfMonth(maxDateWithBuffer);
  while (current <= end) {
    months.push(current);
    current.setMonth(current.getMonth() + 1);
  }

  const handleSaveItem = async (itemKey, data) => {
    const currentStatus = client?.roadmap_item_status || {};
    await onSave({
      roadmap_item_status: {
        ...currentStatus,
        [itemKey]: { ...currentStatus[itemKey], ...data },
      },
    });
    setSelectedItem(null);
  };

  const handleSaveBITCheckin = async (checkinData) => {
    const currentCheckins = client?.bit_review_checkins || [];
    await onSave({
      bit_review_checkins: [...currentCheckins, checkinData],
    });
    setShowBITPanel(false);
  };

  const milestones = [
    { label: 'Intake', date: client?.intake_date, field: 'intake_date' },
    { label: 'Program Start', date: client?.service_start_date, field: 'service_start_date' },
    { label: 'Projected End', date: format(projectedEnd, 'yyyy-MM-dd'), isProjection: true },
    { label: '90-Day Follow-up', date: client?.followup_90day_date, field: 'followup_90day_date' },
  ].filter(m => m.date);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Tabs value={view} onValueChange={setView}>
            <TabsList>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
            </TabsList>
          </Tabs>

          {client?.bit_completed && (
            <Button onClick={() => setShowBITPanel(true)} variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              BIT Check-in
            </Button>
          )}
        </div>

        {view === 'timeline' && (
          <Card>
            <CardContent className="p-4">
              <div className="relative" style={{ height: `${Math.max(items.length * 48 + 80, 300)}px` }}>
                {/* Month Axis */}
                <div className="absolute top-0 left-0 right-0 h-12 border-b flex">
                  {months.map((month, i) => (
                    <div
                      key={i}
                      className="border-r text-xs text-muted-foreground px-2 py-1"
                      style={{
                        left: pct(month),
                        width: pct(new Date(month.getFullYear(), month.getMonth() + 1, 0)) - pct(month),
                      }}
                    >
                      {format(month, 'MMM yyyy')}
                    </div>
                  ))}
                </div>

                {/* Milestone Lines */}
                {milestones.map((m, i) => (
                  <div
                    key={i}
                    className="absolute top-12 bottom-0 w-px border-l border-dashed"
                    style={{ left: `${pct(parseDate(m.date))}%` }}
                  >
                    <div className="text-xs text-muted-foreground -rotate-45 origin-top-left mt-2">
                      {m.label}
                    </div>
                  </div>
                ))}

                {/* Today Line */}
                {todayMs >= minMs && todayMs <= maxMs && (
                  <div
                    className="absolute top-12 bottom-0 w-px bg-red-500 z-10"
                    style={{ left: `${msPct(minMs, maxMs, todayMs)}%` }}
                  />
                )}

                {/* Item Rows */}
                {items.map((item, i) => {
                  const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.planned;
                  const Icon = status.icon;
                  const startDate = parseDate(item.statusData?.start_date);
                  const endDate = parseDate(item.statusData?.completed_date);
                  const left = startDate ? pct(startDate) : 0;
                  const width = endDate && startDate ? pct(endDate) - left : 40;

                  return (
                    <div key={item.key} className="absolute h-12 flex items-center" style={{ top: 48 + i * 48 }}>
                      <div className="w-48 text-xs truncate pr-2">{item.label}</div>
                      <div className="flex-1 relative h-8">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`absolute h-6 rounded-full ${status.color} ring-2 cursor-pointer hover:opacity-80 transition-opacity`}
                              style={{
                                left: `${left}%`,
                                width: `${Math.max(width, 5)}%`,
                              }}
                              onClick={() => setSelectedItem(item)}
                            >
                              {item.status === 'in_progress' && (
                                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                              )}
                              {(item.status === 'completed' || item.status === 'cancelled') && (
                                <Icon className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-white" />
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-semibold">{item.label}</p>
                            <p className="text-xs">Status: {status.label}</p>
                            {item.statusData?.start_date && (
                              <p className="text-xs">Start: {item.statusData.start_date}</p>
                            )}
                            {item.statusData?.completed_date && (
                              <p className="text-xs">End: {item.statusData.completed_date}</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {view === 'list' && (
          <Card>
            <CardContent className="p-4 space-y-2">
              {items.map(item => {
                const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.planned;
                const StatusIcon = status.icon;
                return (
                  <Button
                    key={item.key}
                    variant="outline"
                    className="w-full justify-start h-auto py-3"
                    onClick={() => setSelectedItem(item)}
                  >
                    <span className="text-lg mr-2">{item.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.statusData?.start_date && `Start: ${item.statusData.start_date}`}
                        {item.statusData?.completed_date && ` • End: ${item.statusData.completed_date}`}
                      </div>
                    </div>
                    <Badge className={status.color}>{status.label}</Badge>
                    <StatusIcon className="w-4 h-4 ml-2" />
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        )}

        {view === 'calendar' && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-xs font-medium text-center p-2">{day}</div>
                ))}
                {eachDayOfInterval({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }).map(day => {
                  const dayItems = items.filter(item => {
                    const start = parseDate(item.statusData?.start_date);
                    const end = parseDate(item.statusData?.completed_date);
                    if (start && end) {
                      return isWithinInterval(day, { start, end });
                    }
                    return false;
                  });
                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-20 border p-1 ${isSameDay(day, new Date()) ? 'bg-slate-100' : ''}`}
                    >
                      <div className="text-xs font-medium mb-1">{format(day, 'd')}</div>
                      <div className="space-y-1">
                        {dayItems.slice(0, 3).map(item => (
                          <div
                            key={item.key}
                            className={`text-xs px-1 py-0.5 rounded truncate ${item.color} text-white`}
                          >
                            {item.icon} {item.label.split(' ')[0]}
                          </div>
                        ))}
                        {dayItems.length > 3 && (
                          <div className="text-xs text-muted-foreground">+{dayItems.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedItem && (
          <RoadmapItemPanel
            item={selectedItem}
            onSave={(data) => handleSaveItem(selectedItem.key, data)}
            onClose={() => setSelectedItem(null)}
          />
        )}

        {showBITPanel && (
          <BITReviewCheckinPanel
            onSave={handleSaveBITCheckin}
            onClose={() => setShowBITPanel(false)}
          />
        )}
      </div>
    </TooltipProvider>
  );
}