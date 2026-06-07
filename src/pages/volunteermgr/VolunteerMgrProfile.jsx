import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Phone, MapPin, Clock, Award, FileText, Pencil, ChevronDown, ChevronUp, GraduationCap, User, Calendar, Shield, AlertCircle, Utensils, Image, Building, BookOpen, Heart } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import moment from 'moment';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import VolunteerTypeBadge from '@/components/volunteermgr/VolunteerTypeBadge';
import VolunteerHourStats from '@/components/volunteermgr/VolunteerHourStats';
import VolunteerDetails from '@/components/volunteermgr/VolunteerDetails';
import { calculateMilestones } from '@/lib/milestones';

export default function VolunteerMgrProfile() {
  const { id } = useParams();
  const [membersOpen, setMembersOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: volunteers = [] } = useQuery({
    queryKey: ['volunteers'],
    queryFn: () => base44.entities.Volunteer.list('-created_date', 200),
  });

  const volunteer = volunteers.find((v) => v.id === id);

  const { data: timeLogs = [] } = useQuery({
    queryKey: ['timelogs', id],
    queryFn: () => base44.entities.VolunteerTimeLog.filter({ volunteer_id: id }, '-date', 500),
    enabled: !!id,
  });

  const { data: recognitions = [] } = useQuery({
    queryKey: ['recognitions', id],
    queryFn: () => base44.entities.VolunteerRecognition.filter({ volunteer_id: id }),
    enabled: !!id,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', id],
    queryFn: () => base44.entities.VolunteerDocument.filter({ volunteer_id: id }),
    enabled: !!id,
  });

  const { data: trainingRecords = [] } = useQuery({
    queryKey: ['training-records', id],
    queryFn: () => base44.entities.TrainingRecord.filter({ volunteer_id: id }),
    enabled: !!id,
  });

  const handleStatusChange = async (newStatus) => {
    await base44.entities.Volunteer.update(id, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ['volunteers'] });
  };

  const statusColors = {
    active: 'bg-green-50 text-green-700 border-green-200',
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    occasional: 'bg-blue-50 text-blue-700 border-blue-200',
    inactive: 'bg-gray-50 text-gray-500 border-gray-200',
    suspended: 'bg-red-50 text-red-700 border-red-200',
  };

  const statusOptions = ['active', 'occasional', 'pending', 'inactive', 'suspended'];

  if (!volunteer) {
    return (
      <div className="space-y-6">
        <Link to="/volunteermgr/volunteers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Volunteers
        </Link>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Volunteer not found.</p>
        </div>
      </div>
    );
  }

  const isDeceased = !!volunteer.is_deceased;
  const isCorporate = volunteer.volunteer_type === 'corporate';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/volunteermgr/volunteers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Volunteers
        </Link>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Badge className={statusColors[volunteer.status]}>{volunteer.status}</Badge>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {statusOptions.map((s) => (
                <DropdownMenuItem key={s} onClick={() => handleStatusChange(s)}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => setEditOpen(true)} className="gap-2">
            <Pencil className="w-4 h-4" /> Edit
          </Button>
        </div>
      </div>

      {isDeceased && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 text-center">
          <p className="text-3xl mb-2">🕊️</p>
          <h2 className="text-xl font-semibold text-purple-900">In Memoriam</h2>
          <p className="text-purple-700 mt-2">
            {volunteer.first_name} {volunteer.last_name} is forever remembered with gratitude and love for their generous service to our community.
          </p>
          {volunteer.deceased_date && (
            <p className="text-sm text-purple-600 mt-2">
              Passed away {new Date(volunteer.deceased_date).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}.
            </p>
          )}
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl shrink-0">
              {isCorporate ? (volunteer.company_name?.[0] || 'C') : isDeceased ? '🕊️' : <>{volunteer.first_name?.[0]}{volunteer.last_name?.[0]}</>}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold font-display flex items-center gap-2 flex-wrap">
                <span>
                  {isCorporate ? `${volunteer.company_name || 'Unknown Company'}${volunteer.first_name ? ` — ${volunteer.first_name}` : ''}` : `${volunteer.first_name} ${volunteer.last_name}`}
                </span>
                {isDeceased && ' 🕊️'}
                {!isCorporate && volunteer.birth_date && volunteer.gender && (
                  <span className="text-[#0066cc] font-medium">
                    {moment().diff(moment(volunteer.birth_date), 'years')}/{volunteer.gender.toLowerCase().startsWith('m') ? 'M' : volunteer.gender.toLowerCase().startsWith('f') ? 'F' : volunteer.gender.charAt(0).toUpperCase()}
                  </span>
                )}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <VolunteerTypeBadge type={volunteer.volunteer_type} />
                <Badge className={statusColors[volunteer.status]}>{volunteer.status}</Badge>
              </div>
              {volunteer.programs && volunteer.programs.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {volunteer.programs.map((prog, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">{prog}</Badge>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-4 mt-4 text-sm">
                {!isCorporate && volunteer.email && (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />{volunteer.email}
                  </span>
                )}
                {!isCorporate && volunteer.phone && (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />{volunteer.phone}
                  </span>
                )}
                {volunteer.city && (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />{volunteer.city}
                  </span>
                )}
              </div>
              {volunteer.start_date && (
                <p className="text-sm text-muted-foreground mt-2">
                  Started: {moment(volunteer.start_date).format('MMM D, YYYY')}
                </p>
              )}
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{Math.round(volunteer.total_hours || 0)}</p>
              <p className="text-sm text-muted-foreground">Total Hours</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <VolunteerHourStats timeLogs={timeLogs} />

      {isCorporate && (volunteer.corporate_members || []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Group Members</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" onClick={() => setMembersOpen(!membersOpen)} className="w-full flex items-center justify-between mb-4">
              <span>{volunteer.corporate_members.length} members</span>
              {membersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            {membersOpen && (
              <div className="grid gap-2">
                {volunteer.corporate_members.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{m.name}</p>
                      {m.email && <p className="text-xs text-muted-foreground">{m.email}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <VolunteerDetails volunteer={volunteer} isDeceased={isDeceased} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" /> Recent Time Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No time logs recorded.</p>
          ) : (
            <div className="grid gap-3">
              {timeLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{log.position_title || 'Volunteer Work'}</p>
                    <p className="text-xs text-muted-foreground">{moment(log.date || log.sign_in_time).format('MMM D, YYYY')}</p>
                  </div>
                  <Badge variant="outline">{log.total_hours ? `${log.total_hours.toFixed(1)}h` : 'In progress'}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Award className="w-4 h-4" /> Recognition & Milestones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recognitions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recognitions yet.</p>
          ) : (
            <div className="grid gap-3">
              {recognitions.map((rec) => (
                <div key={rec.id} className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
                  <span className="text-2xl">
                    {rec.type === 'milestone_hours' ? '⏱️' : rec.type === 'years_of_service' ? '🏆' : rec.type === 'volunteer_of_month' ? '⭐' : '🎖️'}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{rec.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {rec.type?.replace(/_/g, ' ')} · {rec.date_awarded ? moment(rec.date_awarded).format('MMM D, YYYY') : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {(() => {
            const awardedKeys = new Set(recognitions.filter((r) => r.milestone_key).map((r) => r.milestone_key));
            const pending = calculateMilestones(volunteer).filter((m) => !awardedKeys.has(m.milestone_key));
            if (pending.length === 0) return null;
            return (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Pending Milestones</p>
                <div className="grid gap-2">
                  {pending.map((m) => (
                    <div key={m.milestone_key} className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg opacity-70">
                      <span className="text-2xl">{m.icon}</span>
                      <p className="font-medium text-sm">{m.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {trainingRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> Training Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {trainingRecords.map((rec) => (
                <div key={rec.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{rec.pathway_title || 'Training'}</p>
                    <p className="text-xs text-muted-foreground">
                      {rec.completed_modules?.length || 0} modules completed
                      {rec.completion_date ? ` · ${moment(rec.completion_date).format('MMM D, YYYY')}` : ''}
                    </p>
                  </div>
                  <Badge variant={rec.status === 'completed' ? 'default' : 'secondary'} className="capitalize">{rec.status?.replace(/_/g, ' ')}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" /> Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">{doc.document_type?.replace(/_/g, ' ')}</p>
                  </div>
                  <Badge variant={doc.signed ? 'default' : 'secondary'}>{doc.signed ? 'Signed' : 'Unsigned'}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}