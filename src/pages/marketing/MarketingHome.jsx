import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Image, Mail, Megaphone, Calendar, Inbox, Share2,
  TrendingUp, Clock, CheckCircle, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-700',
  active: 'bg-green-100 text-green-700',
  planning: 'bg-blue-100 text-blue-700',
  sending: 'bg-yellow-100 text-yellow-700',
  sent: 'bg-green-100 text-green-700',
  submitted: 'bg-orange-100 text-orange-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
};

export default function MarketingHome() {
  const { data: campaigns = [] } = useQuery({
    queryKey: ['mkt-campaigns'],
    queryFn: () => base44.entities.MarketingCampaign.list('-created_date', 5),
  });
  const { data: emailCampaigns = [] } = useQuery({
    queryKey: ['mkt-email-campaigns'],
    queryFn: () => base44.entities.EmailCampaign.list('-created_date', 5),
  });
  const { data: requests = [] } = useQuery({
    queryKey: ['mkt-requests'],
    queryFn: () => base44.entities.MarketingRequest.filter({ status: 'submitted' }),
  });
  const { data: assets = [] } = useQuery({
    queryKey: ['mkt-assets'],
    queryFn: () => base44.entities.MarketingAsset.list(),
  });
  const { data: socialPosts = [] } = useQuery({
    queryKey: ['mkt-social'],
    queryFn: () => base44.entities.SocialPost.filter({ status: 'scheduled' }),
  });

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const sentEmails = emailCampaigns.filter(e => e.status === 'sent');
  const totalOpens = sentEmails.reduce((sum, e) => sum + (e.total_opened || 0), 0);
  const totalSent = sentEmails.reduce((sum, e) => sum + (e.total_sent || 0), 0);
  const avgOpenRate = totalSent > 0 ? Math.round((totalOpens / totalSent) * 100) : 0;

  const stats = [
    { label: 'Active Campaigns', value: activeCampaigns, icon: Megaphone, color: 'text-pink-600', bg: 'bg-pink-50', link: '/marketing/campaigns' },
    { label: 'Brand Assets', value: assets.length, icon: Image, color: 'text-purple-600', bg: 'bg-purple-50', link: '/marketing/assets' },
    { label: 'Pending Requests', value: requests.length, icon: Inbox, color: 'text-orange-600', bg: 'bg-orange-50', link: '/marketing/requests' },
    { label: 'Avg. Email Open Rate', value: `${avgOpenRate}%`, icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50', link: '/marketing/email' },
    { label: 'Scheduled Posts', value: socialPosts.length, icon: Share2, color: 'text-teal-600', bg: 'bg-teal-50', link: '/marketing/social' },
    { label: 'Emails Sent', value: sentEmails.length, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', link: '/marketing/email' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Marketing &amp; Fundraising</h1>
        <p className="text-slate-500 text-sm mt-1">Manage campaigns, assets, email, social media, and more.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} to={stat.link}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Requests */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Inbox className="w-4 h-4 text-orange-500" />
                Pending Marketing Requests
              </CardTitle>
              <Link to="/marketing/requests" className="text-xs text-blue-600 hover:underline">View all →</Link>
            </div>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No pending requests</p>
            ) : (
              <div className="space-y-2">
                {requests.slice(0, 5).map(req => (
                  <div key={req.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{req.title}</p>
                      <p className="text-xs text-slate-500">{req.requester_name} · {req.request_type?.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {req.priority === 'urgent' && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                      {req.deadline && (
                        <span className="text-xs text-slate-500">Due {format(new Date(req.deadline), 'MMM d')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Campaigns */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-pink-500" />
                Recent Campaigns
              </CardTitle>
              <Link to="/marketing/campaigns" className="text-xs text-blue-600 hover:underline">View all →</Link>
            </div>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No campaigns yet</p>
            ) : (
              <div className="space-y-2">
                {campaigns.slice(0, 5).map(c => (
                  <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{c.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{c.campaign_type?.replace(/_/g, ' ')}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status] || 'bg-slate-100 text-slate-600'}`}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Email Campaigns */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500" />
                Recent Email Campaigns
              </CardTitle>
              <Link to="/marketing/email" className="text-xs text-blue-600 hover:underline">View all →</Link>
            </div>
          </CardHeader>
          <CardContent>
            {emailCampaigns.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No email campaigns yet</p>
            ) : (
              <div className="space-y-2">
                {emailCampaigns.slice(0, 5).map(e => (
                  <div key={e.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{e.name}</p>
                      <p className="text-xs text-slate-500">{e.subject}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[e.status] || 'bg-slate-100 text-slate-600'}`}>
                        {e.status}
                      </span>
                      {e.status === 'sent' && (
                        <p className="text-xs text-slate-400 mt-0.5">{e.total_opened || 0}/{e.total_sent || 0} opened</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Social Posts */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Share2 className="w-4 h-4 text-teal-500" />
                Scheduled Social Posts
              </CardTitle>
              <Link to="/marketing/social" className="text-xs text-blue-600 hover:underline">View all →</Link>
            </div>
          </CardHeader>
          <CardContent>
            {socialPosts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No scheduled posts</p>
            ) : (
              <div className="space-y-2">
                {socialPosts.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-sm font-medium text-slate-800 truncate">{p.title}</p>
                      <p className="text-xs text-slate-500">{(p.platforms || []).join(', ')}</p>
                    </div>
                    {p.scheduled_date && (
                      <span className="text-xs text-slate-500 shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(p.scheduled_date), 'MMM d')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}