import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Laptop, Loader2, FileText, Briefcase, Map, Clock } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import JobLabAccountCard from '@/components/client/JobLabAccountCard';

const STATUS_STYLES = {
  saved: 'bg-slate-100 text-slate-700 border-slate-200',
  applied: 'bg-blue-100 text-blue-800 border-blue-200',
  phone_screen: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  interview: 'bg-purple-100 text-purple-800 border-purple-200',
  offer: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  withdrawn: 'bg-amber-100 text-amber-800 border-amber-200',
};

const Stat = ({ icon: Icon, label, value }) => (
  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
    <div className="flex items-center gap-1.5 text-xs text-slate-500">
      <Icon className="w-3.5 h-3.5" /> {label}
    </div>
    <p className="text-xl font-semibold text-slate-800 mt-1">{value}</p>
  </div>
);

export default function ClientJobLabTab({ client }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ account: null, visits: [], applications: [], resumes: [], paths: [] });

  const load = () => {
    setLoading(true);
    base44.functions
      .invoke('manageJobLabAccount', { action: 'getActivity', clientId: client.id })
      .then((res) => setData(res.data))
      .catch(() => toast.error('Could not load Job Lab activity'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [client.id]);

  const { account, visits, applications, resumes, paths } = data;
  const onsite = visits.filter((v) => v.location_type === 'onsite').length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Laptop className="w-5 h-5" style={{ color: 'hsl(231,64%,20%)' }} />
              <CardTitle>Job Lab</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <JobLabAccountCard client={client} />
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : !account ? (
        <div className="text-center py-10 text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg">
          No Job Lab account yet — create one above to start logging activity on this file.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-tour="jl-activity-stats">
            <Stat icon={Clock} label="Visits" value={visits.length} />
            <Stat icon={Laptop} label="Onsite visits" value={onsite} />
            <Stat icon={Briefcase} label="Jobs tracked" value={applications.length} />
            <Stat icon={FileText} label="Resumes" value={resumes.length} />
          </div>

          <Card data-tour="jl-activity-visits">
            <CardHeader><CardTitle className="text-base">Recent visits</CardTitle></CardHeader>
            <CardContent>
              {visits.length === 0 ? (
                <p className="text-sm text-slate-500">No Job Lab visits recorded yet.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {visits.slice(0, 10).map((visit) => (
                    <div key={visit.id} className="flex items-center justify-between py-2">
                      <span className="text-sm text-slate-700">{moment(visit.visit_date).format('MMM D, YYYY · h:mm a')}</span>
                      <Badge className={visit.location_type === 'onsite' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200'}>
                        {visit.location_type === 'onsite' ? 'Onsite kiosk' : 'Online'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-tour="jl-activity-jobs">
            <CardHeader><CardTitle className="text-base">Jobs tracked</CardTitle></CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <p className="text-sm text-slate-500">No jobs saved or applied to yet.</p>
              ) : (
                <div className="space-y-2">
                  {applications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between gap-3 border border-slate-200 rounded-lg px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{app.position}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {app.company}{app.location ? ` · ${app.location}` : ''}
                        </p>
                      </div>
                      <Badge className={STATUS_STYLES[app.status] || STATUS_STYLES.saved}>
                        {(app.status || 'saved').replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Resumes built</CardTitle></CardHeader>
              <CardContent>
                {resumes.length === 0 ? (
                  <p className="text-sm text-slate-500">No resumes yet.</p>
                ) : (
                  <div className="space-y-2">
                    {resumes.map((resume) => (
                      <div key={resume.id} className="border border-slate-200 rounded-lg px-3 py-2">
                        <p className="text-sm font-medium text-slate-800">{resume.title}</p>
                        <p className="text-xs text-slate-500 capitalize">
                          {resume.template} template · updated {moment(resume.updated_date).format('MMM D, YYYY')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Career plans</CardTitle></CardHeader>
              <CardContent>
                {paths.length === 0 ? (
                  <p className="text-sm text-slate-500">No career plans yet.</p>
                ) : (
                  <div className="space-y-2">
                    {paths.map((path) => {
                      const done = (path.milestones || []).filter((m) => m.status === 'completed').length;
                      return (
                        <div key={path.id} className="border border-slate-200 rounded-lg px-3 py-2">
                          <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                            <Map className="w-3.5 h-3.5 text-slate-400" /> {path.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {path.target_role ? `Target: ${path.target_role} · ` : ''}
                            {done}/{path.milestones?.length || 0} milestones done
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}