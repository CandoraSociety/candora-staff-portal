import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, ExternalLink, Shield, RefreshCw, Mail, Settings, AlertCircle } from 'lucide-react';

const WEBSITE_TOOLS = [
  {
    category: 'Website Management',
    items: [
      { label: 'WordPress Admin', desc: 'Manage pages, posts, and content', url: 'https://candora.ca/wp-admin', icon: Globe },
      { label: 'Theme Customizer', desc: 'Edit site appearance and layout', url: 'https://candora.ca/wp-admin/customize.php', icon: Settings },
      { label: 'Plugins', desc: 'Manage installed plugins', url: 'https://candora.ca/wp-admin/plugins.php', icon: RefreshCw },
    ]
  },
  {
    category: 'Domain & Hosting',
    items: [
      { label: 'Domain Registrar', desc: 'Manage domain registration and DNS', url: '#', icon: Globe },
      { label: 'Hosting Control Panel', desc: 'Server management and backups', url: '#', icon: Shield },
      { label: 'SSL Certificate', desc: 'Security certificate management', url: '#', icon: Shield },
    ]
  },
  {
    category: 'Analytics & Tracking',
    items: [
      { label: 'Google Analytics', desc: 'Website traffic and user behavior', url: 'https://analytics.google.com', icon: ExternalLink },
      { label: 'Google Search Console', desc: 'Search performance and indexing', url: 'https://search.google.com/search-console', icon: ExternalLink },
      { label: 'Google My Business', desc: 'Local listing management', url: 'https://business.google.com', icon: ExternalLink },
    ]
  },
  {
    category: 'Email & DNS',
    items: [
      { label: 'Email Admin', desc: 'Manage email accounts and settings', url: '#', icon: Mail },
      { label: 'DNS Settings', desc: 'DNS records and routing', url: '#', icon: Settings },
    ]
  },
];

export default function MarketingWebsite() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Website &amp; Domains</h1>
        <p className="text-sm text-slate-500 mt-1">Quick access to website management, domain control, and analytics tools.</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">Update your links</p>
          <p className="text-sm text-amber-700">Update the URLs in this page to match your actual hosting, domain registrar, and CMS admin URLs. Go to <code className="bg-amber-100 px-1 rounded">pages/marketing/MarketingWebsite.jsx</code> to edit.</p>
        </div>
      </div>

      {WEBSITE_TOOLS.map(section => (
        <div key={section.category}>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">{section.category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {section.items.map((item, i) => {
              const Icon = item.icon;
              return (
                <Card key={i} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-800">{item.label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                      {item.url !== '#' && (
                        <a href={item.url} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm" className="h-7 px-2 shrink-0 ml-2">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Website Notes */}
      <Card>
        <CardHeader><CardTitle className="text-base">Website Notes &amp; Documentation</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'Candora.ca', note: 'Main organizational website. WordPress hosted. Keep content updated monthly.' },
            { label: 'SSL Renewal', note: 'SSL certificate renews annually. Set a calendar reminder 30 days before expiry.' },
            { label: 'Backups', note: 'Daily automated backups through hosting. Manual backups before major updates.' },
          ].map((n, i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-700">{n.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{n.note}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}