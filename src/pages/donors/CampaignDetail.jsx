import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ExternalLink, Loader2, Target } from 'lucide-react';
import CampaignProfileForm from '@/components/donors/campaign/CampaignProfileForm';
import DonationOptionsEditor from '@/components/donors/campaign/DonationOptionsEditor';
import PublicPagePanel from '@/components/donors/campaign/PublicPagePanel';
import CampaignGiftsList from '@/components/donors/campaign/CampaignGiftsList';
import CampaignPillarsPanel from '@/components/donors/campaign/CampaignPillarsPanel';
import CampaignGiftingPanel from '@/components/donors/campaign/CampaignGiftingPanel';
import CampaignCertificatesPanel from '@/components/donors/campaign/CampaignCertificatesPanel';
import CampaignDeliveriesPanel from '@/components/donors/campaign/CampaignDeliveriesPanel';
import CampaignShareLinks from '@/components/donors/campaign/CampaignShareLinks';
import CampaignPillarReport from '@/components/donors/campaign/CampaignPillarReport';
import CampaignImagesPanel from '@/components/donors/campaign/CampaignImagesPanel';
import { activeTiers, formatMoney, publicCampaignUrl } from '@/lib/donorConstants';

// A campaign's own workspace: the full profile, the giving options offered on
// its public page, the page itself, and every gift it has brought in.
export default function CampaignDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [tab, setTab] = useState('profile');

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['donation-campaign', id],
    queryFn: () => base44.entities.DonationCampaign.get(id),
    enabled: !!id,
  });

  const { data: donations = [] } = useQuery({
    queryKey: ['donations'],
    queryFn: () => base44.entities.Donation.list('-donation_date', 500),
  });

  const gifts = useMemo(() => donations.filter((d) => d.campaign_id === id), [donations, id]);
  const raised = gifts.reduce((sum, gift) => sum + (Number(gift.amount) || 0), 0);
  const pct = campaign?.goal_amount ? Math.min(100, Math.round((raised / campaign.goal_amount) * 100)) : 0;

  const save = async (patch) => {
    await base44.entities.DonationCampaign.update(id, patch);
    qc.invalidateQueries({ queryKey: ['donation-campaign', id] });
    qc.invalidateQueries({ queryKey: ['donation-campaigns'] });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-muted-foreground">This campaign could not be found.</p>
        <Button asChild variant="outline"><Link to="/donors/campaigns">Back to campaigns</Link></Button>
      </div>
    );
  }

  const slug = campaign.slug || '';

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Link to="/donors/campaigns" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> All campaigns
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-display font-bold">{campaign.name}</h1>
            {campaign.is_private && (
              <Badge className="bg-purple-100 text-purple-700">Private</Badge>
            )}
            <Badge className={campaign.public_page_enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}>
              {campaign.public_page_enabled ? 'Page live' : 'Page not published'}
            </Badge>
            {!campaign.is_active && <Badge className="bg-amber-100 text-amber-800">Closed to gifts</Badge>}
          </div>
          {campaign.tagline && <p className="text-sm text-muted-foreground">{campaign.tagline}</p>}
        </div>

        <div className="flex items-center gap-2">
          {slug && (
            <Button variant="outline" asChild>
              <a href={publicCampaignUrl(slug)} target="_blank" rel="noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" /> {campaign.public_page_enabled ? 'Open page' : 'Preview page'}
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Raised</p>
            <p className="text-2xl font-display font-bold">{formatMoney(raised)}</p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            {campaign.goal_amount ? `Goal ${formatMoney(campaign.goal_amount)} · ${pct}%` : 'No goal set'}
            <div>{gifts.length} gifts · {activeTiers(campaign).length} giving options</div>
          </div>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="profile">Overview</TabsTrigger>
          <TabsTrigger value="pillars">Pillars</TabsTrigger>
          <TabsTrigger value="photography">Photography</TabsTrigger>
          <TabsTrigger value="options">Giving options</TabsTrigger>
          <TabsTrigger value="gifting">Gifting &amp; e-cards</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
          <TabsTrigger value="page">Public page</TabsTrigger>
          <TabsTrigger value="sharing">Sharing</TabsTrigger>
          <TabsTrigger value="gifts">Donations</TabsTrigger>
          <TabsTrigger value="reporting">Reporting</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <CampaignProfileForm campaign={campaign} onSave={save} />
        </TabsContent>
        <TabsContent value="pillars" className="mt-4">
          <CampaignPillarsPanel campaign={campaign} onSave={save} />
        </TabsContent>
        <TabsContent value="photography" className="mt-4">
          <CampaignImagesPanel campaign={campaign} onSave={save} />
        </TabsContent>
        <TabsContent value="options" className="mt-4">
          <DonationOptionsEditor
            campaign={campaign}
            onSave={save}
            onSynced={() => qc.invalidateQueries({ queryKey: ['donation-campaign', id] })}
          />
        </TabsContent>
        <TabsContent value="gifting" className="mt-4">
          <CampaignGiftingPanel campaign={campaign} onSave={save} />
        </TabsContent>
        <TabsContent value="certificates" className="mt-4">
          <CampaignCertificatesPanel campaign={campaign} onSave={save} />
        </TabsContent>
        <TabsContent value="deliveries" className="mt-4">
          <CampaignDeliveriesPanel campaign={campaign} />
        </TabsContent>
        <TabsContent value="page" className="mt-4">
          <PublicPagePanel campaign={campaign} onSave={save} onManageOptions={() => setTab('options')} />
        </TabsContent>
        <TabsContent value="sharing" className="mt-4">
          <CampaignShareLinks campaign={campaign} />
        </TabsContent>
        <TabsContent value="gifts" className="mt-4">
          <CampaignGiftsList gifts={gifts} />
        </TabsContent>
        <TabsContent value="reporting" className="mt-4">
          <CampaignPillarReport campaign={campaign} gifts={gifts} />
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Target className="w-3.5 h-3.5" /> Gifts paid on the public page appear here and on the supporter's donor record.
      </p>
    </div>
  );
}